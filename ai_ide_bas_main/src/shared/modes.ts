// Условный импорт vscode (доступен только в extension host, не в webview)
// Используем type-only импорт для типов и динамический импорт для runtime
type ExtensionContext = import("vscode").ExtensionContext

import {
	type GroupOptions,
	type GroupEntry,
	type ModeConfig,
	type CustomModePrompts,
	type ExperimentId,
	type ToolGroup,
	type PromptComponent,
	DEFAULT_MODES,
} from "@roo-code/types"

import { addCustomInstructions } from "../core/prompts/sections/custom-instructions"
import { getAllRolesFromApi, roleToMode, setModeTargetRoles } from "../services/prompt-api-service"

// Re-export for use in webview-ui
export { getAllRolesFromApi, roleToMode }

import { EXPERIMENT_IDS } from "./experiments"
import { TOOL_GROUPS, ALWAYS_AVAILABLE_TOOLS } from "./tools"
const PROMPT_HELPER = ``;


const PROMPT_BA = ``;

const PROMPT_ARCH = ``;

const PROMPT_SA = ``;

const PROMPT_REVIEW = ``;

const PROMPT_DESIGNER = ``;

export type Mode = string

// Helper to extract group name regardless of format
export function getGroupName(group: GroupEntry): ToolGroup {
	if (typeof group === "string") {
		return group
	}

	return group[0]
}

// Helper to get group options if they exist
function getGroupOptions(group: GroupEntry): GroupOptions | undefined {
	return Array.isArray(group) ? group[1] : undefined
}

// Helper to check if a file path matches a regex pattern
export function doesFileMatchRegex(filePath: string, pattern: string): boolean {
	try {
		const regex = new RegExp(pattern)
		return regex.test(filePath)
	} catch (error) {
		console.error(`Invalid regex pattern: ${pattern}`, error)
		return false
	}
}

// Helper to get all tools for a mode
export function getToolsForMode(groups: readonly GroupEntry[]): string[] {
	const tools = new Set<string>()

	// Add tools from each group
	groups.forEach((group) => {
		const groupName = getGroupName(group)
		const groupConfig = TOOL_GROUPS[groupName]
		groupConfig.tools.forEach((tool: string) => tools.add(tool))
	})

	// Always add required tools
	ALWAYS_AVAILABLE_TOOLS.forEach((tool) => tools.add(tool))

	return Array.from(tools)
}

// Main modes configuration as an ordered array
// Note: The first mode in this array is the default mode for new installations
export const modes: readonly ModeConfig[] = [
	{
		slug: "code",
		name: "📋 BA (Business Analyst)",
		roleDefinition: ``,
		whenToUse: ``,
		description: "",
		customInstructions: PROMPT_BA,
		groups: [
			"read",
			["edit", { fileRegex: ".*", description: "Markdown & requirement docs only" }],
			"browser",
			"mcp",
		],
	},
	{
		slug: "architect",
		name: "🏗️ Architect",
		roleDefinition: ``,
		whenToUse: ``,
		description: "",
		customInstructions: PROMPT_ARCH,
		groups: ["read", ["edit", { fileRegex: ".*", description: "Architecture docs" }], "browser", "mcp"],
	},
	{
		slug: "ask",
		name: "📝 SA (System Analyst)",
		roleDefinition: ``,
		whenToUse: ``,
		description: "",
		customInstructions: PROMPT_SA,
		groups: ["read", ["edit", { fileRegex: ".*", description: "Analysis docs" }], "browser", "mcp"],
	},
	{
		slug: "debug",
		name: "🔍 Review (Reviewer)",
		roleDefinition:``,
		whenToUse:``,
		description: "",
		customInstructions: PROMPT_REVIEW,
		groups: [
			"read",
			["edit", { fileRegex: ".*", description: "Markdown & requirement docs only" }],
			"browser",
			"mcp",
		],
	},
	{
		slug: "designer",
		name: "🎨 Designer",
		roleDefinition:``,
		whenToUse:``,
		description: "",
		customInstructions: PROMPT_DESIGNER,
		groups: ["read", ["edit", { fileRegex: ".*", description: "Design docs" }], "browser", "mcp"],
	},
	{
		slug: "pm",
		name: "📂 PM (Project Manager)",
		roleDefinition:``,
		whenToUse: ``,
		description: "",
		customInstructions: "",
		groups: ["read", ["edit", { fileRegex: ".*", description: "PM docs" }], "browser", "mcp"],
	},
	{
		slug: "helper",
		name: "🆘 Helper",
		roleDefinition:``,
		whenToUse: "",
		description: "",
		customInstructions: PROMPT_HELPER,
		groups: ["read", ["edit", { fileRegex: ".*", description: "Design docs" }], "browser", "mcp"],
	},
] as const

// Export the default mode slug
export const defaultModeSlug = modes[0].slug

// Helper functions
export function getModeBySlug(slug: string, customModes?: ModeConfig[]): ModeConfig | undefined {
	// Check custom modes first
	const customMode = customModes?.find((mode) => mode.slug === slug)
	if (customMode) {
		return customMode
	}
	// Then check built-in modes
	return modes.find((mode) => mode.slug === slug)
}

export function getModeConfig(slug: string, customModes?: ModeConfig[]): ModeConfig {
	const mode = getModeBySlug(slug, customModes)
	if (!mode) {
		throw new Error(`No mode found for slug: ${slug}`)
	}
	return mode
}

// Helper function to normalize language code to match backend format
// Backend expects: ru, en, es, zh, ar, pt
// Extension may provide: es-ES, zh-CN, pt-BR, etc.
function normalizeLangForBackend(lang?: string): string | undefined {
	if (!lang) return undefined
	// Extract base language code (before hyphen)
	const baseLang = lang.split("-")[0].toLowerCase()
	// Map common variations to backend format
	const langMap: Record<string, string> = {
		zh: "zh", // zh-CN or zh-TW -> zh
		pt: "pt", // pt-BR -> pt (Portuguese is now supported)
		cn: "zh", // Handle case where only "CN" is provided
	}
	return langMap[baseLang] || baseLang
}

// Helper function to extract text from multilingual value
export function pickTextFromMultilang(value: string | Record<string, string> | undefined, lang?: string): string {
	if (!value) return ""
	if (typeof value === "string") return value
	if (typeof value === "object") {
		// Normalize language code to match backend format (zh-CN -> zh, es-ES -> es, etc.)
		const normalizedLang = normalizeLangForBackend(lang)
		
		// Always log for debugging (remove excessive logging later)
		const availableKeys = Object.keys(value).join(", ")
		console.log(`[pickTextFromMultilang] lang="${lang || "none"}", normalizedLang="${normalizedLang || "none"}", availableKeys=[${availableKeys}]`)
		
		// Try normalized preferred language first
		if (normalizedLang && value[normalizedLang]) {
			console.log(`[pickTextFromMultilang] ✅ Found normalized key "${normalizedLang}", returning value`)
			return pickTextFromMultilang(value[normalizedLang], undefined)
		}
		// Try original language code as fallback (in case backend uses full codes)
		if (lang && value[lang]) {
			console.log(`[pickTextFromMultilang] ✅ Found original key "${lang}", returning value`)
			return pickTextFromMultilang(value[lang], undefined)
		}
		// For Chinese: try to find any key that starts with "zh" (zh-CN, zh-TW, etc.)
		if (normalizedLang === "zh") {
			const zhKey = Object.keys(value).find(key => key.toLowerCase().startsWith("zh"))
			if (zhKey) {
				console.log(`[pickTextFromMultilang] ✅ Found Chinese key "${zhKey}", returning value`)
				return pickTextFromMultilang(value[zhKey], undefined)
			}
		}
		// For Portuguese: try to find any key that starts with "pt" (pt, pt-BR, etc.)
		if (normalizedLang === "pt") {
			const ptKey = Object.keys(value).find(key => key.toLowerCase().startsWith("pt"))
			if (ptKey) {
				console.log(`[pickTextFromMultilang] ✅ Found Portuguese key "${ptKey}", returning value`)
				return pickTextFromMultilang(value[ptKey], undefined)
			}
		}
		// Then try English as fallback (if not already requested)
		if (normalizedLang !== "en" && value["en"]) {
			console.log(`[pickTextFromMultilang] ⚠️ Falling back to English`)
			return pickTextFromMultilang(value["en"], undefined)
		}
		// If English was requested but not found, try Russian as fallback
		if (normalizedLang === "en" && value["ru"]) {
			console.log(`[pickTextFromMultilang] ⚠️ English not found, falling back to Russian`)
			return pickTextFromMultilang(value["ru"], undefined)
		}
		// If Russian was requested but not found, try English as fallback
		if (normalizedLang === "ru" && value["en"]) {
			console.log(`[pickTextFromMultilang] ⚠️ Russian not found, falling back to English`)
			return pickTextFromMultilang(value["en"], undefined)
		}
		// Don't fallback to random language - return empty string if requested language not found
		// This prevents showing Arabic text when Portuguese is requested but not available
		console.log(`[pickTextFromMultilang] ⚠️ Requested language "${lang || normalizedLang}" not found, returning empty string (available: ${Object.keys(value).join(", ")})`)
	}
	return ""
}

// Helper function to add API roles to modes array
function addApiRolesToModes(
	allModes: ModeConfig[],
	apiRoles: Array<{ 
		slug: string
		name: string
		emoji?: string
		target_roles: string[]
		role_definition?: string | Record<string, string>
		short_description?: Record<string, string>
		when_to_use?: Record<string, string>
	}>,
	language?: string
): void {
	console.log(`[Modes] addApiRolesToModes: processing ${apiRoles.length} roles from API, language="${language || "none"}"`)
	apiRoles.forEach((apiRole) => {
		// Определяем slug для режима:
		// slug из API используется напрямую (ask, code, debug, architect, designer, pm, helper)
		// После унификации slug = target_roles (все в нижнем регистре)
		const mappedSlug = apiRole.slug.toLowerCase()
		console.log(`[Modes] Using slug as-is: ${apiRole.slug} -> ${mappedSlug}`)
		
		console.log(`[Modes] Final mapping: ${apiRole.slug} (name: ${apiRole.name}) -> ${mappedSlug}`)
		
		// Проверяем, нет ли уже такой роли (по маппированному slug)
		const existingIndex = allModes.findIndex(
			(mode) => mode.slug.toLowerCase() === mappedSlug.toLowerCase()
		)
		
		// Извлекаем role_definition из API (может быть строкой или многоязычным объектом)
		// Используем язык для правильного извлечения текста из многоязычных объектов
		// Язык уже нормализован в getAllModes, но нормализуем еще раз на всякий случай
		const normalizedLang = language ? normalizeLangForBackend(language) : undefined
		console.log(`[Modes] Language normalization for ${mappedSlug}: original="${language || "none"}", normalized="${normalizedLang || "none"}"`)
		if (apiRole.short_description && typeof apiRole.short_description === "object") {
			console.log(`[Modes] Available keys in short_description for ${mappedSlug}: ${Object.keys(apiRole.short_description).join(", ")}`)
		}
		
		const roleDefinition = pickTextFromMultilang(apiRole.role_definition, normalizedLang)
		const whenToUse = pickTextFromMultilang(apiRole.when_to_use, normalizedLang)
		const description = pickTextFromMultilang(apiRole.short_description, normalizedLang)
		
		// Логируем short_description для отладки
		console.log(`[Modes] Processing short_description for ${mappedSlug}: raw=${JSON.stringify(apiRole.short_description)}, language=${normalizedLang || language || "none"}, extracted="${description}"`)
		
		if (existingIndex === -1) {
			// Добавляем новую роль из API (используем маппированный slug)
			// Если есть эмодзи в API - добавляем его к имени, иначе используем имя как есть
			const roleName = apiRole.emoji 
				? `${apiRole.emoji} ${apiRole.name}`
				: apiRole.name
			
			console.log(`[Modes] Adding new role from API: ${mappedSlug} (${roleName}, emoji: ${apiRole.emoji || "none"})`)
			// Сохраняем target_roles в кэш для использования в loadPromptFromApi
			if (apiRole.target_roles && apiRole.target_roles.length > 0) {
				setModeTargetRoles(mappedSlug, apiRole.target_roles)
			}
			allModes.push({
				slug: mappedSlug, // Используем маппированный slug
				name: roleName,
				roleDefinition: roleDefinition || ``,
				whenToUse: whenToUse || ``,
				description: description || "",
				customInstructions: "",
				groups: ["read", ["edit", { fileRegex: ".*" }], "browser", "mcp"],
			})
			
			// Помечаем, что обнаружена новая роль (для последующего экспорта)
			// Экспорт будет запущен после обработки всех ролей
			;(allModes as any).__hasNewRole = true
		} else {
			// Обновляем существующую роль: обновляем имя, role_definition, whenToUse, description
			// ⚠️ ВАЖНО: Если роль пришла из API, ВСЕГДА гарантируем полный набор групп
			// Сохраняем target_roles в кэш для использования в loadPromptFromApi
			if (apiRole.target_roles && apiRole.target_roles.length > 0) {
				setModeTargetRoles(mappedSlug, apiRole.target_roles)
			}
			const existingMode = allModes[existingIndex]
			let updatedMode = { ...existingMode }
			
			// Обновляем имя (всегда, даже если эмодзи нет)
			// Удаляем существующее эмодзи из имени (если есть)
			const nameWithoutEmoji = existingMode.name.replace(/^[^\w\u0400-\u04FF]+\s*/, '').trim() || existingMode.name.split(/\s+/).slice(1).join(' ')
			const baseName = apiRole.name || nameWithoutEmoji || existingMode.name
			// Если есть эмодзи в API - используем его, иначе имя без эмодзи
			const newName = apiRole.emoji ? `${apiRole.emoji} ${baseName}` : baseName
			
			console.log(`[Modes] Name update check for ${mappedSlug}: existing="${existingMode.name}", new="${newName}", apiEmoji="${apiRole.emoji || "none"}", apiName="${apiRole.name || "none"}"`)
			
			if (existingMode.name !== newName) {
				console.log(`[Modes] Updating name for ${mappedSlug}: "${existingMode.name}" -> "${newName}" (emoji: ${apiRole.emoji || "none"})`)
				updatedMode.name = newName
			} else {
				console.log(`[Modes] Name unchanged for ${mappedSlug}: "${existingMode.name}"`)
			}
			
			// Обновляем role_definition из API, если есть
			if (roleDefinition && roleDefinition !== existingMode.roleDefinition) {
				console.log(`[Modes] Updating roleDefinition for ${mappedSlug} from API`)
				updatedMode.roleDefinition = roleDefinition
			}
			
			// Обновляем whenToUse из API, если есть
			if (whenToUse && whenToUse !== existingMode.whenToUse) {
				console.log(`[Modes] Updating whenToUse for ${mappedSlug} from API`)
				updatedMode.whenToUse = whenToUse
			}
			
			// Обновляем description из API, если есть
			if (description && description !== existingMode.description) {
				console.log(`[Modes] Updating description for ${mappedSlug} from API: "${existingMode.description || "(empty)"}" -> "${description}"`)
				updatedMode.description = description
			} else if (!description && existingMode.description) {
				console.log(`[Modes] No description from API for ${mappedSlug}, keeping existing: "${existingMode.description}"`)
			} else if (description && description === existingMode.description) {
				console.log(`[Modes] Description unchanged for ${mappedSlug}: "${description}"`)
			} else {
				console.log(`[Modes] No description from API for ${mappedSlug} and no existing description`)
			}
			
			// ⚠️ КРИТИЧЕСКИ ВАЖНО: Для ролей из API ВСЕГДА устанавливаем полный набор групп
			// Это гарантирует, что даже если роль была создана вручную без групп, она получит полный функционал
			const defaultGroups: GroupEntry[] = ["read", ["edit", { fileRegex: ".*" }], "browser", "mcp"]
			console.log(`[Modes] Ensuring full tool groups for role ${mappedSlug} from API (existing groups: ${JSON.stringify(existingMode.groups)})`)
			updatedMode.groups = defaultGroups
			console.log(`[Modes] ✅ Set full default groups for ${mappedSlug} from API: read, edit(/.*/), browser, mcp`)
			
			allModes[existingIndex] = updatedMode
		}
	})
	console.log(`[Modes] addApiRolesToModes: final modes count: ${allModes.length}`)
}

// Synchronous version for backward compatibility (doesn't load API roles)
export function getAllModesSync(customModes?: ModeConfig[]): ModeConfig[] {
	// Начинаем с встроенных режимов
	const allModes = [...modes]

	// Добавляем кастомные режимы
	if (customModes?.length) {
		customModes.forEach((customMode) => {
			const index = allModes.findIndex((mode) => mode.slug === customMode.slug)
			if (index !== -1) {
				// Override existing mode
				allModes[index] = customMode
			} else {
				// Add new mode
				allModes.push(customMode)
			}
		})
	}

	return allModes
}

// Get all available modes, with custom modes overriding built-in modes
// If context is provided, also loads roles from API
// If apiRoles is provided, uses those roles instead of loading from API
export async function getAllModes(
	customModes?: ModeConfig[],
	context?: ExtensionContext,
	apiRoles?: Array<{ 
		slug: string
		name: string
		emoji?: string
		target_roles: string[]
		role_definition?: string | Record<string, string>
		short_description?: Record<string, string>
		when_to_use?: Record<string, string>
	}>,
	language?: string
): Promise<ModeConfig[]> {
	// Начинаем с синхронной версии (встроенные + кастомные режимы)
	let allModes = getAllModesSync(customModes)

	// Добавляем роли из API
	let rolesToAdd: Array<{ 
		slug: string
		name: string
		emoji?: string
		target_roles: string[]
		role_definition?: string | Record<string, string>
		short_description?: Record<string, string>
		when_to_use?: Record<string, string>
	}> = []
	
	if (apiRoles) {
		// Используем переданные роли
		rolesToAdd = apiRoles
	} else if (context) {
		// Загружаем роли из API если передан context
		// ⚠️ ВАЖНО: Не блокируем инициализацию расширения, если загрузка режимов не удалась
		try {
			// Определяем язык из VS Code настроек, если не передан
			// ⚠️ ВАЖНО: В webview vscode недоступен, поэтому используем дефолтный язык
			// В webview мы передаем apiRoles напрямую, поэтому этот код не выполняется
			const lang = language || "ru"
			// Загружаем роли с таймаутом, чтобы не блокировать инициализацию
			rolesToAdd = await Promise.race([
				getAllRolesFromApi(undefined, lang),
				new Promise<Array<{ 
					slug: string
					name: string
					emoji?: string
					target_roles: string[]
					role_definition?: string | Record<string, string>
					short_description?: Record<string, string>
					when_to_use?: Record<string, string>
				}>>((_, reject) => 
					setTimeout(() => reject(new Error("Timeout loading modes from API")), 5000)
				)
			])
		} catch (error) {
			// Не критичная ошибка - продолжаем работу с встроенными режимами
			console.warn(`[Modes] Failed to load roles from API (non-critical):`, error)
			rolesToAdd = [] // Продолжаем с пустым списком
		}
	}

	// Добавляем роли из API
	// Определяем язык для извлечения текста из многоязычных объектов
	// Нормализуем язык для соответствия формату бэкенда (zh-CN -> zh, es-ES -> es, etc.)
	const lang = language ? (normalizeLangForBackend(language) || language) : "ru" // По умолчанию русский, если язык не указан
	console.log(`[Modes] getAllModes: language normalization - original="${language || "none"}", normalized="${lang}"`)
	addApiRolesToModes(allModes, rolesToAdd, lang)

	// Если обнаружена новая роль и передан context, проверяем, действительно ли она новая
	if ((allModes as any).__hasNewRole && context) {
		// Get list of known roles from global state, initialize if empty
		let knownRoles = context.globalState.get<string[]>("knownApiRoles")
		if (!knownRoles || knownRoles.length === 0) {
			// First run: initialize with current roles
			knownRoles = allModes.map(m => m.slug.toLowerCase())
			await context.globalState.update("knownApiRoles", knownRoles)
			console.log(`[Modes] Initialized knownApiRoles with ${knownRoles.length} roles`)
		}
		
		const currentRoleSlugs = allModes.map(m => m.slug.toLowerCase())
		const newRoles = currentRoleSlugs.filter(slug => !knownRoles!.includes(slug))
		
		if (newRoles.length > 0) {
			console.log(`[Modes] 🔄 New role(s) detected: ${newRoles.join(", ")}`)
			// Update known roles list
			await context.globalState.update("knownApiRoles", currentRoleSlugs)
			// НЕ триггерим экспорт при обнаружении новой роли - экспорт происходит только при автоматическом обновлении (8-12 минут или 2 минуты с флагом)
		} else {
			console.log(`[Modes] No truly new roles detected`)
		}
	}
	
	// Удаляем временный флаг
	delete (allModes as any).__hasNewRole

	return allModes
}

// Check if a mode is custom or an override
export function isCustomMode(slug: string, customModes?: ModeConfig[]): boolean {
	return !!customModes?.some((mode) => mode.slug === slug)
}

/**
 * Find a mode by its slug, don't fall back to built-in modes
 */
export function findModeBySlug(slug: string, modes: readonly ModeConfig[] | undefined): ModeConfig | undefined {
	return modes?.find((mode) => mode.slug === slug)
}

/**
 * Get the mode selection based on the provided mode slug, prompt component, and custom modes.
 * If a custom mode is found, it takes precedence over the built-in modes.
 * If no custom mode is found, the built-in mode is used with partial merging from promptComponent.
 * If neither is found, the default mode is used.
 */
export function getModeSelection(mode: string, promptComponent?: PromptComponent, customModes?: ModeConfig[]) {
	const customMode = findModeBySlug(mode, customModes)
	const builtInMode = findModeBySlug(mode, modes)

	// If we have a custom mode, use it entirely
	if (customMode) {
		return {
			roleDefinition: customMode.roleDefinition || "",
			baseInstructions: customMode.customInstructions || "",
			description: customMode.description || "",
		}
	}

	// Otherwise, use built-in mode as base and merge with promptComponent
	const baseMode = builtInMode || modes[0] // fallback to default mode

	return {
		roleDefinition: promptComponent?.roleDefinition || baseMode.roleDefinition || "",
		baseInstructions: promptComponent?.customInstructions || baseMode.customInstructions || "",
		description: baseMode.description || "",
	}
}

// Edit operation parameters that indicate an actual edit operation
const EDIT_OPERATION_PARAMS = ["diff", "content", "operations", "search", "replace", "args", "line"] as const

// Custom error class for file restrictions
export class FileRestrictionError extends Error {
	constructor(mode: string, pattern: string, description: string | undefined, filePath: string, tool?: string) {
		const toolInfo = tool ? `Tool '${tool}' in mode '${mode}'` : `This mode (${mode})`
		super(
			`${toolInfo} can only edit files matching pattern: ${pattern}${description ? ` (${description})` : ""}. Got: ${filePath}`,
		)
		this.name = "FileRestrictionError"
	}
}

export function isToolAllowedForMode(
	tool: string,
	modeSlug: string,
	customModes: ModeConfig[],
	toolRequirements?: Record<string, boolean>,
	toolParams?: Record<string, any>, // All tool parameters
	experiments?: Record<string, boolean>,
): boolean {
	// Always allow these tools
	if (ALWAYS_AVAILABLE_TOOLS.includes(tool as any)) {
		return true
	}
	if (experiments && Object.values(EXPERIMENT_IDS).includes(tool as ExperimentId)) {
		if (!experiments[tool]) {
			return false
		}
	}

	// Check tool requirements if any exist
	if (toolRequirements && typeof toolRequirements === "object") {
		if (tool in toolRequirements && !toolRequirements[tool]) {
			return false
		}
	} else if (toolRequirements === false) {
		// If toolRequirements is a boolean false, all tools are disabled
		return false
	}

	const mode = getModeBySlug(modeSlug, customModes)
	if (!mode) {
		return false
	}

	// Check if tool is in any of the mode's groups and respects any group options
	for (const group of mode.groups) {
		const groupName = getGroupName(group)
		const options = getGroupOptions(group)

		const groupConfig = TOOL_GROUPS[groupName]

		// If the tool isn't in this group's tools, continue to next group
		if (!groupConfig.tools.includes(tool)) {
			continue
		}

		// If there are no options, allow the tool
		if (!options) {
			return true
		}

		// For the edit group, check file regex if specified
		if (groupName === "edit" && options.fileRegex) {
			const filePath = toolParams?.path
			// Check if this is an actual edit operation (not just path-only for streaming)
			const isEditOperation = EDIT_OPERATION_PARAMS.some((param) => toolParams?.[param])

			// Handle single file path validation
			if (filePath && isEditOperation && !doesFileMatchRegex(filePath, options.fileRegex)) {
				throw new FileRestrictionError(mode.name, options.fileRegex, options.description, filePath, tool)
			}

			// Handle XML args parameter (used by MULTI_FILE_APPLY_DIFF experiment)
			if (toolParams?.args && typeof toolParams.args === "string") {
				// Extract file paths from XML args with improved validation
				try {
					const filePathMatches = toolParams.args.match(/<path>([^<]+)<\/path>/g)
					if (filePathMatches) {
						for (const match of filePathMatches) {
							// More robust path extraction with validation
							const pathMatch = match.match(/<path>([^<]+)<\/path>/)
							if (pathMatch && pathMatch[1]) {
								const extractedPath = pathMatch[1].trim()
								// Validate that the path is not empty and doesn't contain invalid characters
								if (extractedPath && !extractedPath.includes("<") && !extractedPath.includes(">")) {
									if (!doesFileMatchRegex(extractedPath, options.fileRegex)) {
										throw new FileRestrictionError(
											mode.name,
											options.fileRegex,
											options.description,
											extractedPath,
											tool,
										)
									}
								}
							}
						}
					}
				} catch (error) {
					// Re-throw FileRestrictionError as it's an expected validation error
					if (error instanceof FileRestrictionError) {
						throw error
					}
					// If XML parsing fails, log the error but don't block the operation
					console.warn(`Failed to parse XML args for file restriction validation: ${error}`)
				}
			}
		}

		return true
	}

	return false
}

// Create the mode-specific default prompts
export const defaultPrompts: Readonly<CustomModePrompts> = Object.freeze(
	Object.fromEntries(
		modes.map((mode) => [
			mode.slug,
			{
				roleDefinition: mode.roleDefinition,
				whenToUse: mode.whenToUse,
				customInstructions: mode.customInstructions,
				description: mode.description,
			},
		]),
	),
)

// Helper function to get all modes with their prompt overrides from extension state
export async function getAllModesWithPrompts(context: ExtensionContext): Promise<ModeConfig[]> {
	const customModes = (await context.globalState.get<ModeConfig[]>("customModes")) || []
	const customModePrompts = (await context.globalState.get<CustomModePrompts>("customModePrompts")) || {}

	const allModes = await getAllModes(customModes, context)
	return allModes.map((mode) => ({
		...mode,
		roleDefinition: customModePrompts[mode.slug]?.roleDefinition ?? mode.roleDefinition,
		whenToUse: customModePrompts[mode.slug]?.whenToUse ?? mode.whenToUse,
		customInstructions: customModePrompts[mode.slug]?.customInstructions ?? mode.customInstructions,
		// description is not overridable via customModePrompts, so we keep the original
	}))
}

// Helper function to get complete mode details with all overrides
export async function getFullModeDetails(
	modeSlug: string,
	customModes?: ModeConfig[],
	customModePrompts?: CustomModePrompts,
	options?: {
		cwd?: string
		globalCustomInstructions?: string
		language?: string
	},
): Promise<ModeConfig> {
	// First get the base mode config from custom modes or built-in modes
	const baseMode = getModeBySlug(modeSlug, customModes) || modes.find((m) => m.slug === modeSlug) || modes[0]

	// Check for any prompt component overrides
	const promptComponent = customModePrompts?.[modeSlug]

	// Get the base custom instructions
	const baseCustomInstructions = promptComponent?.customInstructions || baseMode.customInstructions || ""
	const baseWhenToUse = promptComponent?.whenToUse || baseMode.whenToUse || ""
	// Use pickTextFromMultilang for description to support multilingual values
	const baseDescription = pickTextFromMultilang(promptComponent?.description, options?.language) || baseMode.description || ""

	// If we have cwd, load and combine all custom instructions
	let fullCustomInstructions = baseCustomInstructions
	if (options?.cwd) {
		fullCustomInstructions = await addCustomInstructions(
			baseCustomInstructions,
			options.globalCustomInstructions || "",
			options.cwd,
			modeSlug,
			{ language: options.language },
		)
	}

	// Return mode with any overrides applied
	return {
		...baseMode,
		roleDefinition: promptComponent?.roleDefinition || baseMode.roleDefinition,
		whenToUse: baseWhenToUse,
		description: baseDescription,
		customInstructions: fullCustomInstructions,
	}
}

// Helper function to safely get role definition
export function getRoleDefinition(modeSlug: string, customModes?: ModeConfig[]): string {
	const mode = getModeBySlug(modeSlug, customModes)
	if (!mode) {
		console.warn(`No mode found for slug: ${modeSlug}`)
		return ""
	}
	return mode.roleDefinition
}

// Helper function to safely get description
// Supports multilingual description from customModePrompts
export function getDescription(
	modeSlug: string, 
	customModes?: ModeConfig[],
	customModePrompts?: CustomModePrompts,
	language?: string
): string {
	const mode = getModeBySlug(modeSlug, customModes)
	if (!mode) {
		console.warn(`No mode found for slug: ${modeSlug}`)
		return ""
	}
	
	// Check if there's a multilingual description in customModePrompts
	const promptComponent = customModePrompts?.[modeSlug]
	if (promptComponent?.description !== undefined) {
		return pickTextFromMultilang(promptComponent.description, language)
	}
	
	// Fallback to mode description
	return mode.description ?? ""
}

// Helper function to safely get whenToUse
export function getWhenToUse(modeSlug: string, customModes?: ModeConfig[]): string {
	const mode = getModeBySlug(modeSlug, customModes)
	if (!mode) {
		console.warn(`No mode found for slug: ${modeSlug}`)
		return ""
	}
	return mode.whenToUse ?? ""
}

// Helper function to safely get custom instructions
export function getCustomInstructions(modeSlug: string, customModes?: ModeConfig[]): string {
	const mode = getModeBySlug(modeSlug, customModes)
	if (!mode) {
		console.warn(`No mode found for slug: ${modeSlug}`)
		return ""
	}
	return mode.customInstructions ?? ""
}
