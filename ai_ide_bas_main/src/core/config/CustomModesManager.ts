import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import * as os from "os"

import * as yaml from "yaml"
import stripBom from "strip-bom"

import { type ModeConfig, type PromptComponent, customModesSettingsSchema, modeConfigSchema } from "@roo-code/types"

import { fileExistsAtPath } from "../../utils/fs"
import { getWorkspacePath } from "../../utils/path"
import { getGlobalRooDirectory } from "../../services/roo-config"
import { logger } from "../../utils/logging"
import { GlobalFileNames } from "../../shared/globalFileNames"
import { ensureSettingsDirectoryExists } from "../../utils/globalContext"
import { t } from "../../i18n"
import { AIIDEBAS_PROMPTS_API_BASE_URL } from "../../shared/constants"
import { modeToRole } from "../../services/prompt-api-service"
import { addCustomInstructions } from "../prompts/sections/custom-instructions"
import { loadBuiltInModeRules } from "../../services/builtin-rules"
import { formatLanguage } from "../../shared/language"
import { getAllModes } from "../../shared/modes"

const ROOMODES_FILENAME = ".roomodes"

// Type definitions for import/export functionality
interface RuleFile {
	relativePath: string
	content: string
}

interface ExportedModeConfig extends ModeConfig {
	rulesFiles?: RuleFile[]
	exportedCustomInstructions?: string // "USER'S CUSTOM INSTRUCTIONS" section with all changes from admin panel
}

interface ImportData {
	customModes: ExportedModeConfig[]
}

interface ExportResult {
	success: boolean
	yaml?: string
	error?: string
}

interface ImportResult {
	success: boolean
	error?: string
}

export class CustomModesManager {
	private static readonly cacheTTL = 10_000

	private disposables: vscode.Disposable[] = []
	private isWriting = false
	private writeQueue: Array<() => Promise<void>> = []
	private cachedModes: ModeConfig[] | null = null
	private cachedAt: number = 0

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly onUpdate: () => Promise<void>,
	) {
		this.watchCustomModesFiles().catch((error) => {
			console.error("[CustomModesManager] Failed to setup file watchers:", error)
		})
	}

	private async queueWrite(operation: () => Promise<void>): Promise<void> {
		this.writeQueue.push(operation)

		if (!this.isWriting) {
			await this.processWriteQueue()
		}
	}

	private async processWriteQueue(): Promise<void> {
		if (this.isWriting || this.writeQueue.length === 0) {
			return
		}

		this.isWriting = true

		try {
			while (this.writeQueue.length > 0) {
				const operation = this.writeQueue.shift()

				if (operation) {
					await operation()
				}
			}
		} finally {
			this.isWriting = false
		}
	}

	private async getWorkspaceRoomodes(): Promise<string | undefined> {
		const workspaceFolders = vscode.workspace.workspaceFolders

		if (!workspaceFolders || workspaceFolders.length === 0) {
			return undefined
		}

		const workspaceRoot = getWorkspacePath()
		const roomodesPath = path.join(workspaceRoot, ROOMODES_FILENAME)
		const exists = await fileExistsAtPath(roomodesPath)
		return exists ? roomodesPath : undefined
	}

	/**
	 * Regex pattern for problematic characters that need to be cleaned from YAML content
	 * Includes:
	 * - \u00A0: Non-breaking space
	 * - \u200B-\u200D: Zero-width spaces and joiners
	 * - \u2010-\u2015, \u2212: Various dash characters
	 * - \u2018-\u2019: Smart single quotes
	 * - \u201C-\u201D: Smart double quotes
	 */
	private static readonly PROBLEMATIC_CHARS_REGEX =
		// eslint-disable-next-line no-misleading-character-class
		/[\u00A0\u200B\u200C\u200D\u2010\u2011\u2012\u2013\u2014\u2015\u2212\u2018\u2019\u201C\u201D]/g

	/**
	 * Clean invisible and problematic characters from YAML content
	 */
	private cleanInvisibleCharacters(content: string): string {
		// Single pass replacement for all problematic characters
		return content.replace(CustomModesManager.PROBLEMATIC_CHARS_REGEX, (match) => {
			switch (match) {
				case "\u00A0": // Non-breaking space
					return " "
				case "\u200B": // Zero-width space
				case "\u200C": // Zero-width non-joiner
				case "\u200D": // Zero-width joiner
					return ""
				case "\u2018": // Left single quotation mark
				case "\u2019": // Right single quotation mark
					return "'"
				case "\u201C": // Left double quotation mark
				case "\u201D": // Right double quotation mark
					return '"'
				default: // Dash characters (U+2010 through U+2015, U+2212)
					return "-"
			}
		})
	}

	/**
	 * Parse YAML content with enhanced error handling and preprocessing
	 */
	private parseYamlSafely(content: string, filePath: string): any {
		// Clean the content
		let cleanedContent = stripBom(content)
		cleanedContent = this.cleanInvisibleCharacters(cleanedContent)

		try {
			const parsed = yaml.parse(cleanedContent)
			// Ensure we never return null or undefined
			return parsed ?? {}
		} catch (yamlError) {
			// For .roomodes files, try JSON as fallback
			if (filePath.endsWith(ROOMODES_FILENAME)) {
				try {
					// Try parsing the original content as JSON (not the cleaned content)
					return JSON.parse(content)
				} catch (jsonError) {
					// JSON also failed, show the original YAML error
					const errorMsg = yamlError instanceof Error ? yamlError.message : String(yamlError)
					console.error(`[CustomModesManager] Failed to parse YAML from ${filePath}:`, errorMsg)

					const lineMatch = errorMsg.match(/at line (\d+)/)
					const line = lineMatch ? lineMatch[1] : "unknown"
					vscode.window.showErrorMessage(t("common:customModes.errors.yamlParseError", { line }))

					// Return empty object to prevent duplicate error handling
					return {}
				}
			}

			// For non-.roomodes files, just log and return empty object
			const errorMsg = yamlError instanceof Error ? yamlError.message : String(yamlError)
			console.error(`[CustomModesManager] Failed to parse YAML from ${filePath}:`, errorMsg)
			return {}
		}
	}

	private async loadModesFromFile(filePath: string): Promise<ModeConfig[]> {
		try {
			const content = await fs.readFile(filePath, "utf-8")
			const settings = this.parseYamlSafely(content, filePath)

			// Ensure settings has customModes property
			if (!settings || typeof settings !== "object" || !settings.customModes) {
				return []
			}

			const result = customModesSettingsSchema.safeParse(settings)

			if (!result.success) {
				console.error(`[CustomModesManager] Schema validation failed for ${filePath}:`, result.error)

				// Show user-friendly error for .roomodes files
				if (filePath.endsWith(ROOMODES_FILENAME)) {
					const issues = result.error.issues
						.map((issue) => `• ${issue.path.join(".")}: ${issue.message}`)
						.join("\n")

					vscode.window.showErrorMessage(t("common:customModes.errors.schemaValidationError", { issues }))
				}

				return []
			}

			// Determine source based on file path
			const isRoomodes = filePath.endsWith(ROOMODES_FILENAME)
			const source = isRoomodes ? ("project" as const) : ("global" as const)

			// Add source to each mode
			return result.data.customModes.map((mode) => ({ ...mode, source }))
		} catch (error) {
			// Only log if the error wasn't already handled in parseYamlSafely
			if (!(error as any).alreadyHandled) {
				const errorMsg = `Failed to load modes from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
				console.error(`[CustomModesManager] ${errorMsg}`)
			}
			return []
		}
	}

	private async mergeCustomModes(projectModes: ModeConfig[], globalModes: ModeConfig[]): Promise<ModeConfig[]> {
		const slugs = new Set<string>()
		const merged: ModeConfig[] = []

		// Add project mode (takes precedence)
		for (const mode of projectModes) {
			if (!slugs.has(mode.slug)) {
				slugs.add(mode.slug)
				merged.push({ ...mode, source: "project" })
			}
		}

		// Add non-duplicate global modes
		for (const mode of globalModes) {
			if (!slugs.has(mode.slug)) {
				slugs.add(mode.slug)
				merged.push({ ...mode, source: "global" })
			}
		}

		return merged
	}

	public async getCustomModesFilePath(): Promise<string> {
		const settingsDir = await ensureSettingsDirectoryExists(this.context)
		const filePath = path.join(settingsDir, GlobalFileNames.customModes)
		const fileExists = await fileExistsAtPath(filePath)

		if (!fileExists) {
			await this.queueWrite(() => fs.writeFile(filePath, yaml.stringify({ customModes: [] }, { lineWidth: 0 })))
		}

		return filePath
	}

	private async watchCustomModesFiles(): Promise<void> {
		// Skip if test environment is detected
		if (process.env.NODE_ENV === "test") {
			return
		}

		const settingsPath = await this.getCustomModesFilePath()

		// Watch settings file
		const settingsWatcher = vscode.workspace.createFileSystemWatcher(settingsPath)

		const handleSettingsChange = async () => {
			try {
				// Ensure that the settings file exists (especially important for delete events)
				await this.getCustomModesFilePath()
				const content = await fs.readFile(settingsPath, "utf-8")

				const errorMessage = t("common:customModes.errors.invalidFormat")

				let config: any

				try {
					config = this.parseYamlSafely(content, settingsPath)
				} catch (error) {
					console.error(error)
					vscode.window.showErrorMessage(errorMessage)
					return
				}

				const result = customModesSettingsSchema.safeParse(config)

				if (!result.success) {
					vscode.window.showErrorMessage(errorMessage)
					return
				}

				// Get modes from .roomodes if it exists (takes precedence)
				const roomodesPath = await this.getWorkspaceRoomodes()
				const roomodesModes = roomodesPath ? await this.loadModesFromFile(roomodesPath) : []

				// Merge modes from both sources (.roomodes takes precedence)
				const mergedModes = await this.mergeCustomModes(roomodesModes, result.data.customModes)
				await this.context.globalState.update("customModes", mergedModes)
				this.clearCache()
				await this.onUpdate()
			} catch (error) {
				console.error(`[CustomModesManager] Error handling settings file change:`, error)
			}
		}

		this.disposables.push(settingsWatcher.onDidChange(handleSettingsChange))
		this.disposables.push(settingsWatcher.onDidCreate(handleSettingsChange))
		this.disposables.push(settingsWatcher.onDidDelete(handleSettingsChange))
		this.disposables.push(settingsWatcher)

		// Watch .roomodes file - watch the path even if it doesn't exist yet
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (workspaceFolders && workspaceFolders.length > 0) {
			const workspaceRoot = getWorkspacePath()
			const roomodesPath = path.join(workspaceRoot, ROOMODES_FILENAME)
			const roomodesWatcher = vscode.workspace.createFileSystemWatcher(roomodesPath)

			const handleRoomodesChange = async () => {
				try {
					const settingsModes = await this.loadModesFromFile(settingsPath)
					const roomodesModes = await this.loadModesFromFile(roomodesPath)
					// .roomodes takes precedence
					const mergedModes = await this.mergeCustomModes(roomodesModes, settingsModes)
					await this.context.globalState.update("customModes", mergedModes)
					this.clearCache()
					await this.onUpdate()
				} catch (error) {
					console.error(`[CustomModesManager] Error handling .roomodes file change:`, error)
				}
			}

			this.disposables.push(roomodesWatcher.onDidChange(handleRoomodesChange))
			this.disposables.push(roomodesWatcher.onDidCreate(handleRoomodesChange))
			this.disposables.push(
				roomodesWatcher.onDidDelete(async () => {
					// When .roomodes is deleted, refresh with only settings modes
					try {
						const settingsModes = await this.loadModesFromFile(settingsPath)
						await this.context.globalState.update("customModes", settingsModes)
						this.clearCache()
						await this.onUpdate()
					} catch (error) {
						console.error(`[CustomModesManager] Error handling .roomodes file deletion:`, error)
					}
				}),
			)
			this.disposables.push(roomodesWatcher)
		}
	}

	public async getCustomModes(): Promise<ModeConfig[]> {
		// Check if we have a valid cached result.
		const now = Date.now()

		if (this.cachedModes && now - this.cachedAt < CustomModesManager.cacheTTL) {
			return this.cachedModes
		}

		// Get modes from settings file.
		const settingsPath = await this.getCustomModesFilePath()
		const settingsModes = await this.loadModesFromFile(settingsPath)

		// Get modes from .roomodes if it exists.
		const roomodesPath = await this.getWorkspaceRoomodes()
		const roomodesModes = roomodesPath ? await this.loadModesFromFile(roomodesPath) : []

		// Create maps to store modes by source.
		const projectModes = new Map<string, ModeConfig>()
		const globalModes = new Map<string, ModeConfig>()

		// Add project modes (they take precedence).
		for (const mode of roomodesModes) {
			projectModes.set(mode.slug, { ...mode, source: "project" as const })
		}

		// Add global modes.
		for (const mode of settingsModes) {
			if (!projectModes.has(mode.slug)) {
				globalModes.set(mode.slug, { ...mode, source: "global" as const })
			}
		}

		// Combine modes in the correct order: project modes first, then global modes.
		const mergedModes = [
			...roomodesModes.map((mode) => ({ ...mode, source: "project" as const })),
			...settingsModes
				.filter((mode) => !projectModes.has(mode.slug))
				.map((mode) => ({ ...mode, source: "global" as const })),
		]

		await this.context.globalState.update("customModes", mergedModes)

		this.cachedModes = mergedModes
		this.cachedAt = now

		return mergedModes
	}

	public async updateCustomMode(slug: string, config: ModeConfig): Promise<void> {
		try {
			// Validate the mode configuration before saving
			const validationResult = modeConfigSchema.safeParse(config)
			if (!validationResult.success) {
				const errors = validationResult.error.errors.map((e) => e.message).join(", ")
				logger.error(`Invalid mode configuration for ${slug}`, { errors: validationResult.error.errors })
				throw new Error(`Invalid mode configuration: ${errors}`)
			}

			const isProjectMode = config.source === "project"
			let targetPath: string

			if (isProjectMode) {
				const workspaceFolders = vscode.workspace.workspaceFolders

				if (!workspaceFolders || workspaceFolders.length === 0) {
					logger.error("Failed to update project mode: No workspace folder found", { slug })
					throw new Error(t("common:customModes.errors.noWorkspaceForProject"))
				}

				const workspaceRoot = getWorkspacePath()
				targetPath = path.join(workspaceRoot, ROOMODES_FILENAME)
				const exists = await fileExistsAtPath(targetPath)

				logger.info(`${exists ? "Updating" : "Creating"} project mode in ${ROOMODES_FILENAME}`, {
					slug,
					workspace: workspaceRoot,
				})
			} else {
				targetPath = await this.getCustomModesFilePath()
			}

			await this.queueWrite(async () => {
				// Ensure source is set correctly based on target file.
				const modeWithSource = {
					...config,
					source: isProjectMode ? ("project" as const) : ("global" as const),
				}

				await this.updateModesInFile(targetPath, (modes) => {
					const updatedModes = modes.filter((m) => m.slug !== slug)
					updatedModes.push(modeWithSource)
					return updatedModes
				})

				this.clearCache()
				await this.refreshMergedState()
			})
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			logger.error("Failed to update custom mode", { slug, error: errorMessage })
			vscode.window.showErrorMessage(t("common:customModes.errors.updateFailed", { error: errorMessage }))
		}
	}

	private async updateModesInFile(filePath: string, operation: (modes: ModeConfig[]) => ModeConfig[]): Promise<void> {
		let content = "{}"

		try {
			content = await fs.readFile(filePath, "utf-8")
		} catch (error) {
			// File might not exist yet.
			content = yaml.stringify({ customModes: [] }, { lineWidth: 0 })
		}

		let settings

		try {
			settings = this.parseYamlSafely(content, filePath)
		} catch (error) {
			// Error already logged in parseYamlSafely
			settings = { customModes: [] }
		}

		// Ensure settings is an object and has customModes property
		if (!settings || typeof settings !== "object") {
			settings = { customModes: [] }
		}
		if (!settings.customModes) {
			settings.customModes = []
		}

		settings.customModes = operation(settings.customModes)
		await fs.writeFile(filePath, yaml.stringify(settings, { lineWidth: 0 }), "utf-8")
	}

	private async refreshMergedState(): Promise<void> {
		const settingsPath = await this.getCustomModesFilePath()
		const roomodesPath = await this.getWorkspaceRoomodes()

		const settingsModes = await this.loadModesFromFile(settingsPath)
		const roomodesModes = roomodesPath ? await this.loadModesFromFile(roomodesPath) : []
		const mergedModes = await this.mergeCustomModes(roomodesModes, settingsModes)

		await this.context.globalState.update("customModes", mergedModes)

		this.clearCache()

		await this.onUpdate()
	}

	public async deleteCustomMode(slug: string, fromMarketplace = false): Promise<void> {
		try {
			const settingsPath = await this.getCustomModesFilePath()
			const roomodesPath = await this.getWorkspaceRoomodes()

			const settingsModes = await this.loadModesFromFile(settingsPath)
			const roomodesModes = roomodesPath ? await this.loadModesFromFile(roomodesPath) : []

			// Find the mode in either file
			const projectMode = roomodesModes.find((m) => m.slug === slug)
			const globalMode = settingsModes.find((m) => m.slug === slug)

			if (!projectMode && !globalMode) {
				throw new Error(t("common:customModes.errors.modeNotFound"))
			}

			// Determine which mode to use for rules folder path calculation
			const modeToDelete = projectMode || globalMode

			await this.queueWrite(async () => {
				// Delete from project first if it exists there
				if (projectMode && roomodesPath) {
					await this.updateModesInFile(roomodesPath, (modes) => modes.filter((m) => m.slug !== slug))
				}

				// Delete from global settings if it exists there
				if (globalMode) {
					await this.updateModesInFile(settingsPath, (modes) => modes.filter((m) => m.slug !== slug))
				}

				// Delete associated rules folder
				if (modeToDelete) {
					await this.deleteRulesFolder(slug, modeToDelete, fromMarketplace)
				}

				// Clear cache when modes are deleted
				this.clearCache()
				await this.refreshMergedState()
			})
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			vscode.window.showErrorMessage(t("common:customModes.errors.deleteFailed", { error: errorMessage }))
		}
	}

	/**
	 * Deletes the rules folder for a specific mode
	 * @param slug - The mode slug
	 * @param mode - The mode configuration to determine the scope
	 */
	private async deleteRulesFolder(slug: string, mode: ModeConfig, fromMarketplace = false): Promise<void> {
		try {
			// Determine the scope based on source (project or global)
			const scope = mode.source || "global"

			// Determine the rules folder path
			let rulesFolderPath: string
			if (scope === "project") {
				const workspacePath = getWorkspacePath()
				if (workspacePath) {
					rulesFolderPath = path.join(workspacePath, ".roo", `rules-${slug}`)
				} else {
					return // No workspace, can't delete project rules
				}
			} else {
				// Global scope - use OS home directory
				const homeDir = os.homedir()
				rulesFolderPath = path.join(homeDir, ".roo", `rules-${slug}`)
			}

			// Check if the rules folder exists and delete it
			const rulesFolderExists = await fileExistsAtPath(rulesFolderPath)
			if (rulesFolderExists) {
				try {
					await fs.rm(rulesFolderPath, { recursive: true, force: true })
					logger.info(`Deleted rules folder for mode ${slug}: ${rulesFolderPath}`)
				} catch (error) {
					logger.error(`Failed to delete rules folder for mode ${slug}: ${error}`)
					// Notify the user about the failure
					const messageKey = fromMarketplace
						? "common:marketplace.mode.rulesCleanupFailed"
						: "common:customModes.errors.rulesCleanupFailed"
					vscode.window.showWarningMessage(t(messageKey, { rulesFolderPath }))
					// Continue even if folder deletion fails
				}
			}
		} catch (error) {
			logger.error(`Error deleting rules folder for mode ${slug}`, {
				error: error instanceof Error ? error.message : String(error),
			})
		}
	}

	public async resetCustomModes(): Promise<void> {
		try {
			const filePath = await this.getCustomModesFilePath()
			await fs.writeFile(filePath, yaml.stringify({ customModes: [] }, { lineWidth: 0 }))
			await this.context.globalState.update("customModes", [])
			this.clearCache()
			await this.onUpdate()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			vscode.window.showErrorMessage(t("common:customModes.errors.resetFailed", { error: errorMessage }))
		}
	}

	/**
	 * Checks if a mode has associated rules files in the .roo/rules-{slug}/ directory
	 * @param slug - The mode identifier to check
	 * @returns True if the mode has rules files with content, false otherwise
	 */
	public async checkRulesDirectoryHasContent(slug: string): Promise<boolean> {
		try {
			// First, find the mode to determine its source
			const allModes = await this.getCustomModes()
			const mode = allModes.find((m) => m.slug === slug)

			if (!mode) {
				// If not in custom modes, check if it's in .roomodes (project-specific)
				const workspacePath = getWorkspacePath()
				if (!workspacePath) {
					return false
				}

				const roomodesPath = path.join(workspacePath, ROOMODES_FILENAME)
				try {
					const roomodesExists = await fileExistsAtPath(roomodesPath)
					if (roomodesExists) {
						const roomodesContent = await fs.readFile(roomodesPath, "utf-8")
						const roomodesData = yaml.parse(roomodesContent)
						const roomodesModes = roomodesData?.customModes || []

						// Check if this specific mode exists in .roomodes
						const modeInRoomodes = roomodesModes.find((m: any) => m.slug === slug)
						if (!modeInRoomodes) {
							return false // Mode not found anywhere
						}
					} else {
						return false // No .roomodes file and not in custom modes
					}
				} catch (error) {
					return false // Cannot read .roomodes and not in custom modes
				}
			}

			// Determine the correct rules directory based on mode source
			let modeRulesDir: string
			const isGlobalMode = mode?.source === "global"

			if (isGlobalMode) {
				// For global modes, check in global .roo directory
				const globalRooDir = getGlobalRooDirectory()
				modeRulesDir = path.join(globalRooDir, `rules-${slug}`)
			} else {
				// For project modes, check in workspace .roo directory
				const workspacePath = getWorkspacePath()
				if (!workspacePath) {
					return false
				}
				modeRulesDir = path.join(workspacePath, ".roo", `rules-${slug}`)
			}

			try {
				const stats = await fs.stat(modeRulesDir)
				if (!stats.isDirectory()) {
					return false
				}
			} catch (error) {
				return false
			}

			// Check if directory has any content files
			try {
				const entries = await fs.readdir(modeRulesDir, { withFileTypes: true })

				for (const entry of entries) {
					if (entry.isFile()) {
						// Use path.join with modeRulesDir and entry.name for compatibility
						const filePath = path.join(modeRulesDir, entry.name)
						const content = await fs.readFile(filePath, "utf-8")
						if (content.trim()) {
							return true // Found at least one file with content
						}
					}
				}

				return false // No files with content found
			} catch (error) {
				return false
			}
		} catch (error) {
			logger.error("Failed to check rules directory for mode", {
				slug,
				error: error instanceof Error ? error.message : String(error),
			})
			return false
		}
	}

	/**
	 * Generates only the "USER'S CUSTOM INSTRUCTIONS" section for export
	 * This includes all changes from admin panel (customModePrompts) and rules
	 */
	private async generateCustomInstructionsSection(
		slug: string,
		cwd: string,
		customPrompts?: PromptComponent,
		globalCustomInstructions?: string,
		language?: string,
		apiCustomInstructions?: string,
		apiArtifactsInstructions?: string,
		apiPromptLoaded?: boolean,
		context?: vscode.ExtensionContext
	): Promise<string> {
		try {
			// Объединяем apiCustomInstructions с изменениями из админки
			const modeCustomInstructionsFromAdmin = customPrompts?.customInstructions || ""
			const combinedModeCustomInstructions = modeCustomInstructionsFromAdmin
				? (apiCustomInstructions ? `${apiCustomInstructions}\n\n${modeCustomInstructionsFromAdmin}` : modeCustomInstructionsFromAdmin)
				: (apiCustomInstructions || "")

			// Загружаем встроенные правила для fallback (если нужно)
			const loadBuiltInModeRulesFn = context 
				? (mode: string) => loadBuiltInModeRules(mode)
				: undefined

			// Генерируем секцию с учетом всех изменений
			// ВАЖНО: При экспорте НЕ включаем mode-specific rules files, потому что они уже экспортируются в rulesFiles
			// Это предотвращает дублирование контента в exportedCustomInstructions и rulesFiles
			const hasApiData = apiPromptLoaded || !!(apiCustomInstructions || apiArtifactsInstructions)
			const customInstructions = await addCustomInstructions(
				combinedModeCustomInstructions,
				globalCustomInstructions || "",
				cwd,
				slug,
				{
					language: language ? formatLanguage(language) : undefined,
					settings: {
						useAgentRules: true, // Включаем AGENTS.md по умолчанию
						maxConcurrentFileReads: 5,
						todoListEnabled: true,
					},
					loadBuiltInModeRules: loadBuiltInModeRulesFn,
					artifactsInstructions: apiArtifactsInstructions || "",
					useApiDataOnly: hasApiData, // Если есть ЛЮБЫЕ данные из API, не используем правила из .roo
					skipModeRulesFiles: true, // Не загружаем rules-{mode}/ файлы - они уже в rulesFiles при экспорте
				}
			)

			return customInstructions
		} catch (error) {
			logger.warn(`[CustomModesManager] Failed to generate custom instructions section: ${error instanceof Error ? error.message : String(error)}`)
			return ""
		}
	}

	/**
	 * Exports a mode configuration with its associated rules files into a shareable YAML format
	 * @param slug - The mode identifier to export
	 * @param customPrompts - Optional custom prompts to merge into the export
	 * @param provider - Optional provider for generating custom instructions section
	 * @returns Success status with YAML content or error message
	 */
	public async exportModeWithRules(
		slug: string, 
		customPrompts?: PromptComponent,
		provider?: any
	): Promise<ExportResult> {
		try {
			// Try to load from API first (for API-provided modes)
			// This ensures we get the latest published prompt from the API
			let modeFromApi: ModeConfig | null = null
			try {
				const role = modeToRole(slug)
				const apiBaseUrl = AIIDEBAS_PROMPTS_API_BASE_URL
				const exportUrl = `${apiBaseUrl}/api/v1/prompts/export/${role}`
				
				const response = await fetch(exportUrl, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					signal: AbortSignal.timeout(5000),
				})

				if (response.ok) {
					const apiData = await response.json()
					// API returns mode configuration in export format
					if (apiData && apiData.slug === slug) {
						modeFromApi = apiData as ModeConfig
						logger.info(`[CustomModesManager] Loaded mode ${slug} from API export endpoint`)
					}
				}
			} catch (error) {
				// API export endpoint might not be available or mode might not exist in API
				// Continue with local data
				logger.debug(`[CustomModesManager] Could not load mode ${slug} from API: ${error instanceof Error ? error.message : String(error)}`)
			}

			// Import modes from shared to check built-in modes
			const { modes: builtInModes } = await import("../../shared/modes")

			// Get all current modes (including API roles)
			// ⚠️ ВАЖНО: Используем getAllModes() вместо getCustomModes() для включения ролей из API
			const customModes = await this.getCustomModes()
			const allModes = provider?.context
				? await getAllModes(customModes, provider.context, undefined, formatLanguage(vscode.env.language))
				: customModes
			let mode = allModes.find((m) => m.slug === slug)

			// If mode not found in custom modes, check if it's a built-in mode that has been customized
			if (!mode) {
				// Only check workspace-based modes if workspace is available
				const workspacePath = getWorkspacePath()
				if (workspacePath) {
					const roomodesPath = path.join(workspacePath, ROOMODES_FILENAME)
					try {
						const roomodesExists = await fileExistsAtPath(roomodesPath)
						if (roomodesExists) {
							const roomodesContent = await fs.readFile(roomodesPath, "utf-8")
							const roomodesData = yaml.parse(roomodesContent)
							const roomodesModes = roomodesData?.customModes || []

							// Find the mode in .roomodes
							mode = roomodesModes.find((m: any) => m.slug === slug)
						}
					} catch (error) {
						// Continue to check built-in modes
					}
				}

				// If still not found, check if it's a built-in mode
				if (!mode) {
					const builtInMode = builtInModes.find((m) => m.slug === slug)
					if (builtInMode) {
						// Use the built-in mode as the base
						mode = { ...builtInMode }
					} else if (modeFromApi) {
						// Use mode from API if available
						mode = modeFromApi
					} else {
						return { success: false, error: "Mode not found" }
					}
				}
			}

			// If mode was loaded from API, prioritize API data
			if (modeFromApi && mode) {
				// Merge API data with local mode (API takes precedence)
				mode = { ...mode, ...modeFromApi }
				logger.info(`[CustomModesManager] Using API data for mode ${slug} in export`)
			}

			// Determine the base directory based on mode source
			// API roles don't have a source property, so we default to workspace
			const isGlobalMode = mode.source === "global"
			let baseDir: string
			if (isGlobalMode) {
				// For global modes, use the global .roo directory
				baseDir = getGlobalRooDirectory()
			} else {
				// For project modes or API roles (which don't have source), use the workspace directory
				const workspacePath = getWorkspacePath()
				if (!workspacePath) {
					return { success: false, error: "No workspace found" }
				}
				baseDir = workspacePath
			}

			// ВАЖНО: Файлы в глобальной папке .roo создаются в структуре ~/.roo/{lang}/rules-{slug}/
			// Нужно искать файлы в правильной структуре с учетом языка
			// Сначала пробуем найти файлы в структуре с языковой папкой, затем в старой структуре (для обратной совместимости)
			let rulesFiles: RuleFile[] = []
			
			// Получаем текущий язык из провайдера
			let currentLang = "ru" // По умолчанию русский
			if (provider) {
				try {
					const state = await provider.getState()
					currentLang = state.language || "ru"
				} catch (error) {
					// Используем значение по умолчанию
				}
			}
			
			// Форматируем язык используя импортированную функцию
			const normalizedLang = formatLanguage(currentLang)
			
			// Список путей для проверки (сначала новая структура с языком, затем старая для обратной совместимости)
			const pathsToCheck: string[] = []
			
			if (isGlobalMode) {
				// Для глобальных режимов: ~/.roo/{lang}/rules-{slug}/ (новая структура)
				pathsToCheck.push(path.join(baseDir, normalizedLang, `rules-${slug}`))
				// Старая структура для обратной совместимости: ~/.roo/rules-{slug}/
				pathsToCheck.push(path.join(baseDir, `rules-${slug}`))
			} else {
				// Для проектных режимов: {workspace}/.roo/{lang}/rules-{slug}/ (новая структура)
				pathsToCheck.push(path.join(baseDir, ".roo", normalizedLang, `rules-${slug}`))
				// Старая структура для обратной совместимости: {workspace}/.roo/rules-{slug}/
				pathsToCheck.push(path.join(baseDir, ".roo", `rules-${slug}`))
			}
			
			// Ищем файлы в каждой из возможных директорий
			for (const modeRulesDir of pathsToCheck) {
				try {
					const stats = await fs.stat(modeRulesDir)
					if (stats.isDirectory()) {
						// Extract content specific to this mode by looking for the mode-specific rules
						const entries = await fs.readdir(modeRulesDir, { withFileTypes: true })

						for (const entry of entries) {
							if (entry.isFile()) {
								// Use path.join with modeRulesDir and entry.name for compatibility
								const filePath = path.join(modeRulesDir, entry.name)
								const content = await fs.readFile(filePath, "utf-8")
								if (content.trim()) {
									// Calculate relative path from within the rules directory
									// This excludes the rules-{slug} folder from the path
									const relativePath = path.relative(modeRulesDir, filePath)
									// Normalize path to use forward slashes for cross-platform compatibility
									const normalizedRelativePath = relativePath.replace(/\\/g, "/")
									
									// Дедупликация: проверяем, нет ли уже файла с таким же именем
									const existingFile = rulesFiles.find(f => f.relativePath === normalizedRelativePath)
									if (!existingFile) {
										rulesFiles.push({ relativePath: normalizedRelativePath, content: content.trim() })
									}
								}
							}
						}
						
						// Если нашли файлы в новой структуре, прекращаем поиск (приоритет новой структуре)
						if (rulesFiles.length > 0) {
							break
						}
					}
				} catch (error) {
					// Directory doesn't exist, continue to next path
					continue
				}
			}

			// Determine if this is a new role from API (has API-specific fields)
			const isNewRoleFromApi = !!(mode as any).id || !!(mode as any).artifact_type || !!(mode as any).template
			
			// ВАЖНО: Для API-ролей файлы всегда создаются в глобальной папке ~/.roo/{lang}/rules-{slug}/
			// даже если режим не помечен как global. Нужно искать файлы в глобальной папке для API-ролей.
			if (isNewRoleFromApi && !isGlobalMode) {
				// Для API-ролей ищем файлы в глобальной папке
				const globalBaseDir = getGlobalRooDirectory()
				const globalPathsToCheck: string[] = [
					path.join(globalBaseDir, normalizedLang, `rules-${slug}`),
					path.join(globalBaseDir, `rules-${slug}`)
				]
				
				// Ищем файлы в глобальной папке для API-ролей
				for (const modeRulesDir of globalPathsToCheck) {
					try {
						const stats = await fs.stat(modeRulesDir)
						if (stats.isDirectory()) {
							const entries = await fs.readdir(modeRulesDir, { withFileTypes: true })
							
							for (const entry of entries) {
								if (entry.isFile()) {
									const filePath = path.join(modeRulesDir, entry.name)
									const content = await fs.readFile(filePath, "utf-8")
									if (content.trim()) {
										const relativePath = path.relative(modeRulesDir, filePath)
										const normalizedRelativePath = relativePath.replace(/\\/g, "/")
										
										// Дедупликация: проверяем, нет ли уже файла с таким же именем
										const existingFile = rulesFiles.find(f => f.relativePath === normalizedRelativePath)
										if (!existingFile) {
											rulesFiles.push({ relativePath: normalizedRelativePath, content: content.trim() })
										}
									}
								}
							}
							
							// Если нашли файлы в новой структуре, прекращаем поиск
							if (rulesFiles.length > 0) {
								break
							}
						}
					} catch (error) {
						// Directory doesn't exist, continue to next path
						continue
					}
				}
			}
			
			// Get current language for filtering multilingual fields
			let currentLanguage: string | undefined
			if (provider) {
				try {
					const state = await provider.getState()
					currentLanguage = state.language
				} catch (error) {
					// Continue without language
				}
			}
			
			// Import pickTextFromMultilang for extracting current language from multilingual fields
			const { pickTextFromMultilang } = await import("../../shared/modes")
			
			// Create an export mode with rules files preserved
			let exportMode: ExportedModeConfig
			
			if (isNewRoleFromApi) {
				// For new roles from API, create minimal export with only needed fields
				// Extract description for current language only
				const descriptionValue = (mode as any).description
				const extractedDescription = descriptionValue 
					? (typeof descriptionValue === "string" 
						? descriptionValue 
						: pickTextFromMultilang(descriptionValue, currentLanguage))
					: undefined
				
				// Create minimal export object with only required fields for new roles from API
				// Only include: id, name, description (current language only), artifact_type, target_roles, tags, source
				exportMode = {
					id: (mode as any).id,
					name: mode.name,
					description: extractedDescription ? { [currentLanguage || "en"]: extractedDescription } : undefined,
					artifact_type: (mode as any).artifact_type,
					target_roles: (mode as any).target_roles || [],
					tags: (mode as any).tags || [],
					source: "project" as const,
				} as any as ExportedModeConfig
			} else {
				// For built-in or custom modes, use standard export
				exportMode = {
					...mode,
					// Remove source property for export
					source: "project" as const,
				}
				
				// Merge custom prompts if provided
				if (customPrompts) {
					if (customPrompts.roleDefinition) exportMode.roleDefinition = customPrompts.roleDefinition
					// For description, extract current language if it's multilingual
					if (customPrompts.description) {
						if (typeof customPrompts.description === "string") {
							exportMode.description = customPrompts.description
						} else {
							// Extract only current language
							const extracted = pickTextFromMultilang(customPrompts.description, currentLanguage)
							if (extracted) {
								exportMode.description = extracted
							}
						}
					}
					if (customPrompts.whenToUse) exportMode.whenToUse = customPrompts.whenToUse
					if (customPrompts.customInstructions) exportMode.customInstructions = customPrompts.customInstructions
				}
			}

			// Add rules files if any exist
			if (rulesFiles.length > 0) {
				exportMode.rulesFiles = rulesFiles
			}

			// Generate "USER'S CUSTOM INSTRUCTIONS" section with all changes from admin panel
			// ВАЖНО: Если уже есть rulesFiles, НЕ загружаем данные из API для exportedCustomInstructions,
			// потому что rulesFiles УЖЕ содержат промпты из API (они были созданы при выгрузке)
			// Это предотвращает дублирование контента
			let exportedCustomInstructions: string | undefined
			if (provider) {
				try {
					// Получаем состояние провайдера для доступа к globalCustomInstructions и другим настройкам
					const state = await provider.getState()
					const cwd = provider.cwd || getWorkspacePath() || ""
					
					// Если есть rulesFiles, пропускаем загрузку из API — данные уже в rulesFiles
					let apiCustomInstructions = ""
					let apiArtifactsInstructions = ""
					let apiPromptLoaded = false
					
					// Только загружаем из API если НЕТ rulesFiles
					if (rulesFiles.length === 0) {
						try {
							const { loadPromptFromApiSeparated } = await import("../../services/prompt-api-service")
							const apiPromptData = await loadPromptFromApiSeparated(
								slug, 
								state.language, 
								undefined, 
								provider.context,
								false, // onlyPublished
								false, // useCacheOnly - при экспорте используем API, не только кэш
							)
							if (apiPromptData) {
								if (apiPromptData.customInstructions && apiPromptData.customInstructions.trim()) {
									apiCustomInstructions = apiPromptData.customInstructions.trim()
								}
								if (apiPromptData.artifactsInstructions && apiPromptData.artifactsInstructions.trim()) {
									apiArtifactsInstructions = apiPromptData.artifactsInstructions.trim()
								}
								if (apiCustomInstructions || apiArtifactsInstructions) {
									apiPromptLoaded = true
									logger.info(`[CustomModesManager] Loaded API data for export: customInstructions=${apiCustomInstructions.length}, artifactsInstructions=${apiArtifactsInstructions.length}`)
								}
							}
						} catch (error) {
							// API недоступен, продолжаем без API данных
							logger.debug(`[CustomModesManager] Could not load API data for export: ${error instanceof Error ? error.message : String(error)}`)
						}
					} else {
						logger.info(`[CustomModesManager] Skipping API data loading for export - rulesFiles already contain ${rulesFiles.length} files`)
					}
					
					// Генерируем секцию "USER'S CUSTOM INSTRUCTIONS" с учетом всех изменений
					exportedCustomInstructions = await this.generateCustomInstructionsSection(
						slug,
						cwd,
						customPrompts,
						state.customInstructions, // globalCustomInstructions
						state.language,
						apiCustomInstructions,
						apiArtifactsInstructions,
						apiPromptLoaded,
						provider.context
					)
					
					if (exportedCustomInstructions) {
						logger.info(`[CustomModesManager] Generated custom instructions section for export, length=${exportedCustomInstructions.length}`)
					}
				} catch (error) {
					logger.warn(`[CustomModesManager] Failed to generate custom instructions section: ${error instanceof Error ? error.message : String(error)}`)
					// Continue without custom instructions section
				}
			}

			// Add exported custom instructions section if available
			if (exportedCustomInstructions) {
				exportMode.exportedCustomInstructions = exportedCustomInstructions
			}

			// Generate YAML
			const exportData = {
				customModes: [exportMode],
			}

			const yamlContent = yaml.stringify(exportData)

			return { success: true, yaml: yamlContent }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			logger.error("Failed to export mode with rules", { slug, error: errorMessage })
			return { success: false, error: errorMessage }
		}
	}

	/**
	 * Helper method to import rules files for a mode
	 * @param importMode - The mode being imported
	 * @param rulesFiles - The rules files to import
	 * @param source - The import source ("global" or "project")
	 */
	private async importRulesFiles(
		importMode: ExportedModeConfig,
		rulesFiles: RuleFile[],
		source: "global" | "project",
	): Promise<void> {
		// Determine base directory and rules folder path based on source
		let baseDir: string
		let rulesFolderPath: string

		if (source === "global") {
			baseDir = getGlobalRooDirectory()
			rulesFolderPath = path.join(baseDir, `rules-${importMode.slug}`)
		} else {
			const workspacePath = getWorkspacePath()
			baseDir = path.join(workspacePath, ".roo")
			rulesFolderPath = path.join(baseDir, `rules-${importMode.slug}`)
		}

		// Always remove the existing rules folder for this mode if it exists
		// This ensures that if the imported mode has no rules, the folder is cleaned up
		try {
			await fs.rm(rulesFolderPath, { recursive: true, force: true })
			logger.info(`Removed existing ${source} rules folder for mode ${importMode.slug}`)
		} catch (error) {
			// It's okay if the folder doesn't exist
			logger.debug(`No existing ${source} rules folder to remove for mode ${importMode.slug}`)
		}

		// Only proceed with file creation if there are rules files to import
		if (!rulesFiles || !Array.isArray(rulesFiles) || rulesFiles.length === 0) {
			return
		}

		// Import the new rules files with path validation
		for (const ruleFile of rulesFiles) {
			if (ruleFile.relativePath && ruleFile.content) {
				// Validate the relative path to prevent path traversal attacks
				const normalizedRelativePath = path.normalize(ruleFile.relativePath)

				// Ensure the path doesn't contain traversal sequences
				if (normalizedRelativePath.includes("..") || path.isAbsolute(normalizedRelativePath)) {
					logger.error(`Invalid file path detected: ${ruleFile.relativePath}`)
					continue // Skip this file but continue with others
				}

				// Check if path starts with a rules-* folder (old export format)
				let cleanedRelativePath = normalizedRelativePath
				const rulesMatch = normalizedRelativePath.match(/^rules-[^\/\\]+[\/\\]/)
				if (rulesMatch) {
					// Strip the entire rules-* folder reference for backwards compatibility
					cleanedRelativePath = normalizedRelativePath.substring(rulesMatch[0].length)
					logger.info(`Detected old export format, stripping ${rulesMatch[0]} from path`)
				}

				// Use the rules folder path instead of base directory
				const targetPath = path.join(rulesFolderPath, cleanedRelativePath)
				const normalizedTargetPath = path.normalize(targetPath)
				const expectedBasePath = path.normalize(rulesFolderPath)

				// Ensure the resolved path stays within the rules folder
				if (!normalizedTargetPath.startsWith(expectedBasePath)) {
					logger.error(`Path traversal attempt detected: ${ruleFile.relativePath}`)
					continue // Skip this file but continue with others
				}

				// Ensure directory exists
				const targetDir = path.dirname(targetPath)
				await fs.mkdir(targetDir, { recursive: true })

				// Write the file
				await fs.writeFile(targetPath, ruleFile.content, "utf-8")
			}
		}
	}

	/**
	 * Imports modes from YAML content, including their associated rules files
	 * @param yamlContent - The YAML content containing mode configurations
	 * @param source - Target level for import: "global" (all projects) or "project" (current workspace only)
	 * @returns Success status with optional error message
	 */
	public async importModeWithRules(
		yamlContent: string,
		source: "global" | "project" = "project",
	): Promise<ImportResult> {
		try {
			// Parse the YAML content with proper type validation
			let importData: ImportData
			try {
				const parsed = yaml.parse(yamlContent)

				// Validate the structure
				if (!parsed?.customModes || !Array.isArray(parsed.customModes) || parsed.customModes.length === 0) {
					return { success: false, error: "Invalid import format: Expected 'customModes' array in YAML" }
				}

				importData = parsed as ImportData
			} catch (parseError) {
				return {
					success: false,
					error: `Invalid YAML format: ${parseError instanceof Error ? parseError.message : "Failed to parse YAML"}`,
				}
			}

			// Check workspace availability early if importing at project level
			if (source === "project") {
				const workspacePath = getWorkspacePath()
				if (!workspacePath) {
					return { success: false, error: "No workspace found" }
				}
			}

			// Process each mode in the import
			for (const importMode of importData.customModes) {
				const { rulesFiles, ...modeConfig } = importMode

				// Validate the mode configuration
				const validationResult = modeConfigSchema.safeParse(modeConfig)
				if (!validationResult.success) {
					logger.error(`Invalid mode configuration for ${modeConfig.slug}`, {
						errors: validationResult.error.errors,
					})
					return {
						success: false,
						error: `Invalid mode configuration for ${modeConfig.slug}: ${validationResult.error.errors.map((e) => e.message).join(", ")}`,
					}
				}

				// Check for existing mode conflicts
				const existingModes = await this.getCustomModes()
				const existingMode = existingModes.find((m) => m.slug === importMode.slug)
				if (existingMode) {
					logger.info(`Overwriting existing mode: ${importMode.slug}`)
				}

				// Import the mode configuration with the specified source
				await this.updateCustomMode(importMode.slug, {
					...modeConfig,
					source: source, // Use the provided source parameter
				})

				// Import rules files (this also handles cleanup of existing rules folders)
				await this.importRulesFiles(importMode, rulesFiles || [], source)
			}

			// Refresh the modes after import
			await this.refreshMergedState()

			return { success: true }
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			logger.error("Failed to import mode with rules", { error: errorMessage })
			return { success: false, error: errorMessage }
		}
	}

	private clearCache(): void {
		this.cachedModes = null
		this.cachedAt = 0
	}

	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose()
		}

		this.disposables = []
	}
}
