import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import {
	loadPromptWithArtifactsFromApi,
	getAllRolesFromApi,
	roleToMode,
	loadPromptsBatchFromApi,
	getCacheKeySeparated,
	normalizeUpdatedAt,
	type CachedPromptSeparated,
} from "./prompt-api-service"
import { getProjectRooDirectoryForCwd } from "./roo-config"
import { modes } from "../shared/modes"

// Supported languages for API export
const SUPPORTED_LANGUAGES = ["ru", "en", "es", "zh", "ar", "pt"]

// Remove artifact content from prompt text to avoid duplication
export function removeArtifactContentFromPrompt(
	text: string,
	artifacts: Array<{ key: string; content: string; name?: string }>
): string {
	if (!text || !artifacts || artifacts.length === 0) {
		return text
	}

	let cleanedText = text

	for (const artifact of artifacts) {
		if (artifact.content && artifact.content.trim()) {
			const artifactContent = artifact.content.trim()
			cleanedText = cleanedText.replace(artifactContent, "").trim()
		}
	}

	cleanedText = cleanedText.replace(/\n{3,}/g, "\n\n").trim()
	return cleanedText
}

// Clean up old files and directories in .roo directory
async function cleanupRooDirectory(
	rooDir: string,
	isProject: boolean = false,
	validModeSlugs?: Set<string>
): Promise<void> {
	try {
		const dirExists = await fs
			.access(rooDir)
			.then(() => true)
			.catch(() => false)
		if (!dirExists) {
			console.log(`[cleanupRooDirectory] Directory does not exist: ${rooDir}`)
			return
		}

		if (validModeSlugs) {
			console.log(`[cleanupRooDirectory] Valid mode slugs: ${Array.from(validModeSlugs).join(", ")}`)
		}

		const entries = await fs.readdir(rooDir, { withFileTypes: true })

		for (const entry of entries) {
			const entryPath = path.join(rooDir, entry.name)

			if (entry.isDirectory()) {
				if (!SUPPORTED_LANGUAGES.includes(entry.name)) {
					if (isProject) {
						console.log(`[cleanupRooDirectory] Removing unsupported language folder: ${entry.name}`)
						await fs.rm(entryPath, { recursive: true, force: true })
					}
					continue
				}

				try {
					const langEntries = await fs.readdir(entryPath, { withFileTypes: true })

					for (const langEntry of langEntries) {
						const langEntryPath = path.join(entryPath, langEntry.name)

						if (langEntry.isFile()) {
							if (
								langEntry.name.endsWith(".md") &&
								(langEntry.name.startsWith("00_") ||
									langEntry.name.startsWith("custom-instructions-") ||
									langEntry.name.startsWith("custom_instructions_"))
							) {
								console.log(`[cleanupRooDirectory] Removing old file: ${entry.name}/${langEntry.name}`)
								await fs.unlink(langEntryPath).catch(() => {})
							}
						} else if (langEntry.isDirectory()) {
							if (langEntry.name.startsWith("rules-")) {
								if (validModeSlugs) {
									const modeSlug = langEntry.name.replace("rules-", "")
									if (!validModeSlugs.has(modeSlug)) {
										console.log(
											`[cleanupRooDirectory] Removing obsolete rules-* directory: ${entry.name}/${langEntry.name}`
										)
										await fs.rm(langEntryPath, { recursive: true, force: true }).catch(() => {})
										continue
									}
								}
							} else {
								console.log(`[cleanupRooDirectory] Removing old directory: ${entry.name}/${langEntry.name}`)
								await fs.rm(langEntryPath, { recursive: true, force: true }).catch(() => {})
							}
						}
					}
				} catch (err) {
					console.warn(`[cleanupRooDirectory] Failed to clean ${entry.name}: ${err}`)
				}
			}
		}
	} catch (error) {
		console.warn(`[cleanupRooDirectory] Failed to cleanup .roo directory: ${error}`)
	}
}

// Save combined prompt file (00_*.md)
async function saveCombinedPrompt(
	modeRulesDir: string,
	roleName: string,
	systemPrompt: string,
	customInstructions: string,
	artifacts: Array<{ key: string; content: string; name?: string }>,
	isProjectExport: boolean
): Promise<void> {
	const systemPromptClean = removeArtifactContentFromPrompt(systemPrompt || "", artifacts)
	const customInstructionsClean = removeArtifactContentFromPrompt(customInstructions || "", artifacts)

	const combinedPromptParts: string[] = []
	if (systemPromptClean) {
		combinedPromptParts.push(systemPromptClean)
	}
	if (customInstructionsClean) {
		if (combinedPromptParts.length > 0) {
			combinedPromptParts.push("\n\n---\n\n")
		}
		combinedPromptParts.push(customInstructionsClean)
	}

	if (combinedPromptParts.length === 0) {
		return
	}

	const cleanRoleName = roleName.replace(/[^a-zA-Z0-9_()\s-]/g, "").replace(/\s+/g, "_")
	const combinedPromptFile = path.join(modeRulesDir, `00_${cleanRoleName}.md`)
	const newContent = combinedPromptParts.join("")

	const fileExists = await fs
		.access(combinedPromptFile)
		.then(() => true)
		.catch(() => false)

	if (isProjectExport && fileExists) {
		console.log(`[saveCombinedPrompt] Skipping ${combinedPromptFile} - file exists in project .roo`)
		return
	}

	// Check if content changed before writing
	if (fileExists && !isProjectExport) {
		try {
			const existingContent = await fs.readFile(combinedPromptFile, "utf-8")
			if (existingContent === newContent) {
				console.log(`[saveCombinedPrompt] Content unchanged, skipping write for ${combinedPromptFile}`)
				return
			}
		} catch (err) {
			// If read fails, continue with write
		}
	}

	if (!isProjectExport) {
		try {
			const existingFiles = await fs.readdir(modeRulesDir).catch(() => [])
			for (const existingFile of existingFiles) {
				if (
					existingFile.startsWith("00_") &&
					existingFile.endsWith(".md") &&
					existingFile !== `00_${cleanRoleName}.md`
				) {
					await fs.unlink(path.join(modeRulesDir, existingFile)).catch(() => {})
				}
			}
		} catch (err) {
			/* ignore */
		}
	}

	await fs.writeFile(combinedPromptFile, newContent, "utf-8")
}

// Save artifacts to separate files (01_*.md, 02_*.md, etc.)
async function saveArtifacts(
	modeRulesDir: string,
	artifacts: Array<{ key: string; content: string; name?: string }>,
	modeSlug: string,
	lang: string,
	isProjectExport: boolean
): Promise<void> {
	console.log(`[saveArtifacts] Processing ${artifacts.length} artifacts for mode=${modeSlug}, lang=${lang}`)

	// Always clean up old artifact files first (even if no new artifacts)
	// This ensures deleted artifacts are removed
	try {
		const existingFiles = await fs.readdir(modeRulesDir)
		for (const file of existingFiles) {
			if (file.endsWith(".md") && /^\d{2}_/i.test(file) && !file.startsWith("00_")) {
				console.log(`[saveArtifacts] Removing old artifact file: ${file}`)
				await fs.unlink(path.join(modeRulesDir, file)).catch(() => {})
			}
		}
	} catch (err) {
		/* ignore */
	}

	// If no artifacts, we're done (old files already removed)
	if (artifacts.length === 0) {
		console.log(`[saveArtifacts] No artifacts to save, old files removed`)
		return
	}

	for (let i = 0; i < artifacts.length; i++) {
		const artifact = artifacts[i]
		const artifactAny = artifact as any
		const artifactKey =
			artifactAny?.key || artifactAny?.name || artifactAny?.slug || artifactAny?.title || artifactAny?.id

		if (!artifact || !artifactKey) {
			console.warn(`[saveArtifacts] Skipping invalid artifact at index ${i} - no key or name field`)
			continue
		}

		const contentLength = artifact.content?.trim().length || 0
		if (contentLength === 0) {
			console.warn(`[saveArtifacts] Skipping artifact "${artifactKey}" - content is empty`)
			continue
		}

		let cleanKey = artifactKey.trim()
		const hasNumberPrefix = /^\d{2}_/i.test(cleanKey)
		cleanKey = cleanKey.replace(/\s+/g, "_").replace(/^_+|_+$/g, "")

		const artifactFileName = hasNumberPrefix ? `${cleanKey}.md` : `${String(i + 1).padStart(2, "0")}_${cleanKey}.md`

		const artifactFile = path.join(modeRulesDir, artifactFileName)
		const newContent = artifact.content || ""

		const fileExists = await fs
			.access(artifactFile)
			.then(() => true)
			.catch(() => false)

		if (isProjectExport && fileExists) {
			console.log(`[saveArtifacts] Skipping ${artifactFileName} - file exists in project .roo`)
			continue
		}

		// Check if content changed before writing
		if (fileExists && !isProjectExport) {
			try {
				const existingContent = await fs.readFile(artifactFile, "utf-8")
				if (existingContent === newContent) {
					console.log(`[saveArtifacts] Content unchanged, skipping write for ${artifactFileName}`)
					continue
				}
			} catch (err) {
				// If read fails, continue with write
			}
		}

		console.log(`[saveArtifacts] Saving artifact "${artifactKey}" to ${artifactFile}`)

		// Clean up case-insensitive duplicates
		if (!isProjectExport) {
			try {
				const existingFiles = await fs.readdir(modeRulesDir)
				for (const existingFile of existingFiles) {
					if (existingFile.toLowerCase() === artifactFileName.toLowerCase() && existingFile !== artifactFileName) {
						await fs.unlink(path.join(modeRulesDir, existingFile)).catch(() => {})
					}
				}
			} catch (err) {
				/* ignore */
			}
		}

		await fs.writeFile(artifactFile, newContent.trim(), "utf-8")
	}
}

// Remove directory for unpublished prompt
async function removeUnpublishedModeDir(rooDir: string, lang: string, modeSlug: string): Promise<void> {
	const langDirPath = path.join(rooDir, lang)
	const modeRulesDir = path.join(langDirPath, `rules-${modeSlug}`)

	try {
		const dirExists = await fs
			.access(modeRulesDir)
			.then(() => true)
			.catch(() => false)
		if (dirExists) {
			console.log(`[removeUnpublishedModeDir] Removing directory for mode=${modeSlug}, lang=${lang}`)
			await fs.rm(modeRulesDir, { recursive: true, force: true }).catch(() => {})
		}
	} catch (err) {
		console.debug(`[removeUnpublishedModeDir] Failed to remove directory: ${err}`)
	}
}

// Process single mode export for batch data
async function processModeExportBatch(
	mode: { slug: string; name: string; originalSlug?: string; targetRoles?: string[] },
	langData: any,
	lang: string,
	rooDirs: string[],
	workspaceRoot?: string,
	projectRooDir?: string | null
): Promise<boolean> {
	if (!langData) {
		return false
	}

	for (const rooDir of rooDirs) {
		const langDirPath = path.join(rooDir, lang)
		await fs.mkdir(langDirPath, { recursive: true })

		const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
		await fs.mkdir(modeRulesDir, { recursive: true })

		const roleName = mode.name.replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
		const artifacts = langData.artifacts || []
		const isProjectExport = !!(workspaceRoot && projectRooDir && rooDirs.includes(projectRooDir))

		await saveCombinedPrompt(
			modeRulesDir,
			roleName,
			langData.systemPrompt || "",
			langData.customInstructions || "",
			artifacts,
			isProjectExport
		)

		await saveArtifacts(modeRulesDir, artifacts, mode.slug, lang, isProjectExport)
	}

	return true
}

// Find role data in batch response by various keys
function findRoleDataInBatch(
	batchData: Record<string, any>,
	batchKeys: string[],
	mode: { slug: string; originalSlug?: string; targetRoles?: string[] }
): any {
	const modeAny = mode as any
	const originalSlug = modeAny.originalSlug || mode.slug

	// Try direct slug match
	let roleData = batchData[mode.slug]
	if (roleData) {
		return roleData
	}

	// Try original slug from API
	roleData = batchData[originalSlug]
	if (roleData) {
		console.log(`[findRoleDataInBatch] Found data for mode=${mode.slug} using originalSlug="${originalSlug}"`)
		return roleData
	}

	// Try case-insensitive search
	const possibleKeys = [
		mode.slug,
		mode.slug.toUpperCase(),
		mode.slug.toLowerCase(),
		originalSlug,
		originalSlug.toUpperCase(),
		originalSlug.toLowerCase(),
		...batchKeys.filter(
			(key) => key.toLowerCase() === mode.slug.toLowerCase() || key.toLowerCase() === originalSlug.toLowerCase()
		),
	]

	for (const key of possibleKeys) {
		if (batchData[key]) {
			console.log(`[findRoleDataInBatch] Found data for mode=${mode.slug} using key="${key}"`)
			return batchData[key]
		}
	}

	return null
}

// Export prompts from API to project .roo directory
// NOTE: This function now ONLY exports to project .roo, NOT to global ~/.roo
// For dist/prompts export, use exportPromptsToExtensionDist
export async function exportPromptsFromApi(
	context: vscode.ExtensionContext,
	workspaceRoot?: string,
	showProgress: boolean = true
): Promise<{ totalExported: number; totalModes: number; totalLanguages: number }> {
	// IMPORTANT: Reject export to global ~/.roo - only allow project .roo export
	if (!workspaceRoot) {
		console.log(`[exportPromptsFromApi] Skipping - global ~/.roo export is disabled, use exportPromptsToExtensionDist instead`)
		return { totalExported: 0, totalModes: 0, totalLanguages: 0 }
	}

	const projectRooDir = getProjectRooDirectoryForCwd(workspaceRoot)

	let totalExported = 0
	let totalModes = 0
	let totalLanguages = 0

	const exportFunction = async (
		progress?: vscode.Progress<{ message?: string; increment?: number }>
	): Promise<{ totalExported: number; totalModes: number; totalLanguages: number }> => {
		// Get all roles from API
		let allModes: Array<{ slug: string; name: string; originalSlug?: string; targetRoles?: string[] }> = []

		try {
			const apiRoles = await getAllRolesFromApi(undefined, "ru")

			allModes =
				apiRoles.length > 0
					? apiRoles.map((role: { slug: string; name: string; emoji?: string; target_roles: string[] }) => {
							const mappedSlug = role.slug.toLowerCase()
							console.log(
								`[exportPromptsFromApi] Using slug "${role.slug}" -> "${mappedSlug}", target_roles: ${role.target_roles.join(", ")}`
							)
							return {
								slug: mappedSlug,
								name: role.emoji ? `${role.emoji} ${role.name}` : role.name,
								originalSlug: role.slug,
								targetRoles: role.target_roles,
							}
						})
					: modes.map((mode) => ({
							slug: mode.slug,
							name: mode.name,
							originalSlug: mode.slug,
							targetRoles: [mode.slug],
						}))
		} catch (error) {
			allModes = modes.map((mode) => ({
				slug: mode.slug,
				name: mode.name,
			}))
		}

		const validModeSlugs = new Set<string>(allModes.map((mode) => mode.slug))

		// Setup target directory (project .roo only)
		const rooDirs: string[] = [projectRooDir]
		await cleanupRooDirectory(projectRooDir, true, validModeSlugs)
		await fs.mkdir(projectRooDir, { recursive: true })
		console.log(`[exportPromptsFromApi] Exporting to project .roo: ${projectRooDir}`)

		// Try batch endpoint first
		const roleSlugs = allModes.map((m) => m.slug)
		let batchData = await loadPromptsBatchFromApi(roleSlugs, "all", undefined, "vscode")

		if (batchData) {
			console.log(
				`[exportPromptsFromApi] Using batch endpoint (1 request instead of ${allModes.length * SUPPORTED_LANGUAGES.length})`
			)

			const batchKeys = Object.keys(batchData)
			console.log(
				`[exportPromptsFromApi] Available keys in batch response: ${batchKeys.slice(0, 20).join(", ")}${batchKeys.length > 20 ? ` ... (total: ${batchKeys.length})` : ""}`
			)

			if (progress) {
				progress.report({ increment: 0, message: `Processing batch data...` })
			}

			for (const mode of allModes) {
				const roleData = findRoleDataInBatch(batchData, batchKeys, mode)

				if (!roleData) {
					console.log(`[exportPromptsFromApi] No data for mode=${mode.slug} in batch response - skipping`)
					continue
				}

				totalModes++
				let modeExported = false

				for (const lang of SUPPORTED_LANGUAGES) {
					const langData = roleData[lang]

					if (!langData) {
						console.log(`[exportPromptsFromApi] No published prompt for mode=${mode.slug}, lang=${lang}`)
						for (const rooDir of rooDirs) {
							await removeUnpublishedModeDir(rooDir, lang, mode.slug)
						}
						continue
					}

					const success = await processModeExportBatch(
						mode,
						langData,
						lang,
						rooDirs,
						workspaceRoot,
						projectRooDir
					)

					if (success) {
						totalLanguages++
						modeExported = true
					}
				}

				if (modeExported) {
					totalExported++
				}
			}
		} else {
			// Fallback to individual requests
			console.log(`[exportPromptsFromApi] Batch endpoint unavailable, falling back to individual requests`)

			for (const mode of allModes) {
				totalModes++
				if (progress) {
					progress.report({ increment: 0, message: `Mode: ${mode.slug} (${totalModes}/${allModes.length})` })
				}

				if (totalModes > 1) {
					await new Promise((resolve) => setTimeout(resolve, 500))
				}

				let modeExported = false

				for (const lang of SUPPORTED_LANGUAGES) {
					try {
						if (lang !== SUPPORTED_LANGUAGES[0]) {
							await new Promise((resolve) => setTimeout(resolve, 200))
						}

						const promptData = await loadPromptWithArtifactsFromApi(mode.slug, lang, undefined, context, true)

						if (!promptData) {
							console.log(`[exportPromptsFromApi] No published prompt for mode=${mode.slug}, lang=${lang}`)
							for (const rooDir of rooDirs) {
								await removeUnpublishedModeDir(rooDir, lang, mode.slug)
							}
							continue
						}

						totalLanguages++

						for (const rooDir of rooDirs) {
							const langDirPath = path.join(rooDir, lang)
							await fs.mkdir(langDirPath, { recursive: true })

							const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
							await fs.mkdir(modeRulesDir, { recursive: true })

							const roleName = mode.name.replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
							const artifacts = promptData.artifacts || []
							const isProjectExport = !!(workspaceRoot && projectRooDir && rooDirs.includes(projectRooDir))

							await saveCombinedPrompt(
								modeRulesDir,
								roleName,
								promptData.systemPrompt || "",
								promptData.customInstructions || "",
								artifacts,
								isProjectExport
							)

							await saveArtifacts(modeRulesDir, artifacts, mode.slug, lang, isProjectExport)
						}

						modeExported = true
					} catch (error) {
						console.warn(`[exportPromptsFromApi] Failed to export mode=${mode.slug}, lang=${lang}: ${error}`)
					}
				}

				if (modeExported) {
					totalExported++
				}
			}
		}

		// Final cleanup
		console.log(`[exportPromptsFromApi] Performing final cleanup...`)
		for (const rooDir of rooDirs) {
			await cleanupRooDirectory(rooDir, workspaceRoot !== undefined, validModeSlugs)
		}

		return { totalExported, totalModes, totalLanguages }
	}

	if (showProgress) {
		const result = await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: "Exporting prompts from API",
				cancellable: false,
			},
			exportFunction
		)
		return result
	} else {
		return await exportFunction()
	}
}

// Clean up old files from dist/prompts directory
async function cleanupDistPrompts(distPromptsDir: string, validModeSlugs?: Set<string>): Promise<void> {
	try {
		const dirExists = await fs
			.access(distPromptsDir)
			.then(() => true)
			.catch(() => false)
		if (!dirExists) {
			console.log(`[cleanupDistPrompts] Directory does not exist: ${distPromptsDir}`)
			return
		}

		if (validModeSlugs) {
			console.log(`[cleanupDistPrompts] Valid mode slugs: ${Array.from(validModeSlugs).join(", ")}`)
		}

		const entries = await fs.readdir(distPromptsDir, { withFileTypes: true })

		for (const entry of entries) {
			const entryPath = path.join(distPromptsDir, entry.name)

			if (entry.isDirectory()) {
				// Remove all rules-* directories at top level (should only be inside language folders)
				if (entry.name.startsWith("rules-")) {
					console.log(`[cleanupDistPrompts] Removing rules-* directory at top level: ${entry.name}`)
					await fs.rm(entryPath, { recursive: true, force: true })
					continue
				}
				
				if (!SUPPORTED_LANGUAGES.includes(entry.name)) {
					console.log(`[cleanupDistPrompts] Removing unsupported language folder: ${entry.name}`)
					await fs.rm(entryPath, { recursive: true, force: true })
					continue
				}

				try {
					const langEntries = await fs.readdir(entryPath, { withFileTypes: true })

					for (const langEntry of langEntries) {
						const langEntryPath = path.join(entryPath, langEntry.name)

						if (langEntry.isFile()) {
							console.log(`[cleanupDistPrompts] Removing old file: ${entry.name}/${langEntry.name}`)
							await fs.unlink(langEntryPath).catch(() => {})
						} else if (langEntry.isDirectory()) {
							if (langEntry.name.startsWith("rules-")) {
								if (validModeSlugs) {
									const modeSlug = langEntry.name.replace("rules-", "")
									if (!validModeSlugs.has(modeSlug)) {
										console.log(
											`[cleanupDistPrompts] Removing obsolete rules-* directory: ${entry.name}/${langEntry.name}`
										)
										await fs.rm(langEntryPath, { recursive: true, force: true }).catch(() => {})
										continue
									}
								}
							} else {
								console.log(`[cleanupDistPrompts] Removing old directory: ${entry.name}/${langEntry.name}`)
								await fs.rm(langEntryPath, { recursive: true, force: true }).catch(() => {})
							}
						}
					}
				} catch (err) {
					console.warn(`[cleanupDistPrompts] Failed to clean ${entry.name}: ${err}`)
				}
			} else if (entry.isFile()) {
				console.log(`[cleanupDistPrompts] Removing file in dist/prompts/: ${entry.name}`)
				await fs.unlink(entryPath).catch(() => {})
			}
		}
	} catch (error) {
		console.warn(`[cleanupDistPrompts] Failed to cleanup dist/prompts: ${error}`)
	}
}

// Export prompts from API to extension's dist/prompts directory
export async function exportPromptsToExtensionDist(
	context: vscode.ExtensionContext,
	onlyRoles?: string[] // Optional: export only these roles (for selective updates)
): Promise<{ totalExported: number; totalModes: number; totalLanguages: number }> {
	const extensionPath = context.extensionPath
	const distPromptsDir = path.join(extensionPath, "dist", "prompts")

	console.log(`[exportPromptsToExtensionDist] Extension path: ${extensionPath}`)
	console.log(`[exportPromptsToExtensionDist] Target dist/prompts directory: ${distPromptsDir}`)

	let totalExported = 0
	let totalModes = 0
	let totalLanguages = 0

	try {
		console.log("[exportPromptsToExtensionDist] Fetching all roles from API...")
		const apiRoles = await getAllRolesFromApi(undefined, "ru")

		if (apiRoles.length === 0) {
			console.warn(`[exportPromptsToExtensionDist] API returned no roles - nothing to export`)
			return { totalExported: 0, totalModes: 0, totalLanguages: 0 }
		}

		let allModes = apiRoles.map((role: { slug: string; name: string; emoji?: string; target_roles: string[] }) => {
			const mappedSlug = role.slug.toLowerCase()
			console.log(
				`[exportPromptsToExtensionDist] Using slug "${role.slug}" -> "${mappedSlug}", target_roles: ${role.target_roles.join(", ")}`
			)
			return {
				slug: mappedSlug,
				name: role.emoji ? `${role.emoji} ${role.name}` : role.name,
				originalSlug: role.slug,
				targetRoles: role.target_roles,
			}
		})
		
		// Filter to only specified roles if provided
		if (onlyRoles && onlyRoles.length > 0) {
			const onlyRolesLower = onlyRoles.map(r => r.toLowerCase())
			allModes = allModes.filter(mode => onlyRolesLower.includes(mode.slug))
			console.log(`[exportPromptsToExtensionDist] Filtered to ${allModes.length} roles: ${onlyRoles.join(", ")}`)
		}

		try {
			await fs.mkdir(distPromptsDir, { recursive: true })
			console.log(`[exportPromptsToExtensionDist] Created/verified dist/prompts directory: ${distPromptsDir}`)
		} catch (error) {
			console.error(`[exportPromptsToExtensionDist] Failed to create dist/prompts directory: ${error}`)
			throw error
		}

		console.log(
			`[exportPromptsToExtensionDist] Exporting ${allModes.length} modes from API`
		)

		// For cleanup: need to check ALL roles from API (not just filtered ones) to determine which have published prompts
		// This prevents deletion of other roles when onlyRoles is specified
		const allApiRoleSlugs = apiRoles.map((role: { slug: string }) => role.slug.toLowerCase())
		
		// Try batch endpoint for ALL roles from API (to collect complete list of roles with published prompts for cleanup)
		let batchDataForCleanup = await loadPromptsBatchFromApi(allApiRoleSlugs, "all", undefined, "vscode")
		
		// Collect ALL roles with published prompts from batch data (for cleanup)
		// IMPORTANT: Use apiRoles as the source of truth - if a role is not in apiRoles, it should be removed
		// (archived roles won't be in apiRoles, so they will be removed)
		const rolesWithPublishedPrompts = new Set<string>(allApiRoleSlugs) // Start with all roles from API

		if (batchDataForCleanup) {
			const batchKeysForCleanup = Object.keys(batchDataForCleanup)
			
			// Remove roles that don't have published prompts in batch response
			// (archived roles won't be in batch response, so they'll be removed from the set)
			for (const roleSlug of allApiRoleSlugs) {
				// Try to find role data in batch
				let roleData = batchDataForCleanup[roleSlug]
				if (!roleData) {
					// Try original slug from API
					const originalRole = apiRoles.find((r: { slug: string }) => r.slug.toLowerCase() === roleSlug)
					if (originalRole) {
						roleData = batchDataForCleanup[originalRole.slug]
					}
				}
				if (!roleData) {
					// Try to find by any key that matches
					for (const key of batchKeysForCleanup) {
						if (key.toLowerCase() === roleSlug) {
							roleData = batchDataForCleanup[key]
							break
						}
					}
				}
				
				if (roleData) {
					// Check if role has at least one published prompt (for any language)
					const hasPublishedPrompt = SUPPORTED_LANGUAGES.some(lang => roleData[lang] !== null && roleData[lang] !== undefined)
					if (!hasPublishedPrompt) {
						// Role exists in batch but has no published prompts - remove it
						rolesWithPublishedPrompts.delete(roleSlug)
					}
				} else {
					// Role not found in batch response - likely archived, remove it
					rolesWithPublishedPrompts.delete(roleSlug)
				}
			}
		} else {
			// No batch data - use all roles from API as valid (they should have published prompts if they're in the list)
			// This is safe because getAllRolesFromApi should only return roles with published prompts
			console.log(`[exportPromptsToExtensionDist] No batch data for cleanup, using all ${allApiRoleSlugs.length} roles from API`)
		}
		
		// Try batch endpoint for filtered roles (for actual export)
		// IMPORTANT: Always request separate batch for filtered roles, don't reuse batchDataForCleanup
		// This ensures we get fresh data only for roles we need to export, preventing unnecessary updates
		const roleSlugs = allModes.map((m) => m.slug)
		let batchData = await loadPromptsBatchFromApi(roleSlugs, "all", undefined, "vscode")

		if (batchData) {
			console.log(
				`[exportPromptsToExtensionDist] Using batch endpoint (1 request instead of ${allModes.length * SUPPORTED_LANGUAGES.length})`
			)

			const batchKeys = Object.keys(batchData)
			console.log(
				`[exportPromptsToExtensionDist] Available keys in batch response: ${batchKeys.slice(0, 20).join(", ")}${batchKeys.length > 20 ? ` ... (total: ${batchKeys.length})` : ""}`
			)

			for (const mode of allModes) {
				const roleData = findRoleDataInBatch(batchData, batchKeys, mode)

				if (!roleData) {
					console.log(`[exportPromptsToExtensionDist] No data for mode=${mode.slug} in batch response - skipping`)
					continue
				}
				
				// Check if role has at least one published prompt (for any language)
				const hasPublishedPrompt = SUPPORTED_LANGUAGES.some(lang => roleData[lang] !== null && roleData[lang] !== undefined)
				if (hasPublishedPrompt) {
					rolesWithPublishedPrompts.add(mode.slug)
				}

				totalModes++
				let modeExported = false

				for (const lang of SUPPORTED_LANGUAGES) {
					const langData = roleData[lang]

					if (!langData) {
						console.log(`[exportPromptsToExtensionDist] No published prompt for mode=${mode.slug}, lang=${lang}`)
						await removeUnpublishedModeDir(distPromptsDir, lang, mode.slug)
						continue
					}

						// Check updated_at from cache first (optimization - skip file read if unchanged)
						const cacheKey = getCacheKeySeparated(mode.slug, lang)
						const cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
						const cachedUpdatedAt = normalizeUpdatedAt(cached?.updated_at)
						const responseUpdatedAt = normalizeUpdatedAt(langData.updated_at)
						
						const langDirPath = path.join(distPromptsDir, lang)
						const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
						
						// Check if directory exists
						const modeRulesDirExists = await fs.access(modeRulesDir).then(() => true).catch(() => false)
						
						// If updated_at unchanged, still check artifacts (cache might be stale or artifacts might have changed)
						let shouldSkipDueToUnchanged = false
						if (cachedUpdatedAt === responseUpdatedAt && cachedUpdatedAt !== undefined && modeRulesDirExists) {
							// Check artifacts even if updated_at unchanged (artifacts might have changed)
							try {
								const existingFiles = await fs.readdir(modeRulesDir)
								const existingArtifactFiles = existingFiles.filter(f => f.endsWith(".md") && /^\d{2}_/i.test(f) && !f.startsWith("00_"))
								const newArtifacts = langData.artifacts || []
								const newArtifactCount = newArtifacts.length
								
								// If artifact count changed, need to update (don't skip)
								if (existingArtifactFiles.length !== newArtifactCount) {
									console.log(`[exportPromptsToExtensionDist] Artifact count changed for mode=${mode.slug}, lang=${lang} (${existingArtifactFiles.length} -> ${newArtifactCount}), updating despite unchanged updated_at`)
									// Continue with update - don't skip
								} else if (existingArtifactFiles.length === newArtifactCount && newArtifactCount > 0) {
									// Same count, check if all artifacts exist and match
									let allArtifactsMatch = true
									
									for (let i = 0; i < newArtifacts.length; i++) {
										const artifact = newArtifacts[i]
										const artifactKey = artifact.key || artifact.name || ""
										const cleanKey = artifactKey.trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
										const hasNumberPrefix = /^\d{2}_/i.test(cleanKey)
										const artifactFileName = hasNumberPrefix ? `${cleanKey}.md` : `${String(i + 1).padStart(2, "0")}_${cleanKey}.md`
										const artifactFile = path.join(modeRulesDir, artifactFileName)
										
										try {
											const existingContent = await fs.readFile(artifactFile, "utf-8")
											if (existingContent.trim() !== (artifact.content || "").trim()) {
												allArtifactsMatch = false
												break
											}
										} catch {
											// File doesn't exist - artifact changed
											allArtifactsMatch = false
											break
										}
									}
									
									if (allArtifactsMatch) {
										// Both updated_at and artifacts unchanged, skip completely
										console.log(`[exportPromptsToExtensionDist] updated_at and artifacts unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
										shouldSkipDueToUnchanged = true
									} else {
										console.log(`[exportPromptsToExtensionDist] Artifacts changed for mode=${mode.slug}, lang=${lang}, updating despite unchanged updated_at`)
									}
								} else if (existingArtifactFiles.length > 0 && newArtifactCount === 0) {
									// All artifacts were deleted
									console.log(`[exportPromptsToExtensionDist] All artifacts deleted for mode=${mode.slug}, lang=${lang}, updating despite unchanged updated_at`)
								}
							} catch (err) {
								// If check fails, proceed with update
							}
						} else if (cachedUpdatedAt === responseUpdatedAt && cachedUpdatedAt !== undefined) {
							// updated_at unchanged and directory doesn't exist, skip
							console.log(`[exportPromptsToExtensionDist] updated_at unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
							shouldSkipDueToUnchanged = true
						}
						
						if (shouldSkipDueToUnchanged) {
							continue
						}
					
					// Check if content changed before creating directories and processing
					// modeRulesDirExists already declared above
					
					let shouldUpdateMainFile = true
					let shouldUpdateArtifacts = true
					
					if (modeRulesDirExists) {
						// Check if main file content changed
						const roleName = (mode.name || "").replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
						const cleanRoleName = roleName.replace(/[^a-zA-Z0-9_()\s-]/g, "").replace(/\s+/g, "_")
						const combinedPromptFile = path.join(modeRulesDir, `00_${cleanRoleName}.md`)
						const fileExists = await fs.access(combinedPromptFile).then(() => true).catch(() => false)
						
						if (fileExists) {
							try {
								// Build new content to compare
								const artifacts = langData.artifacts || []
								const systemPromptClean = removeArtifactContentFromPrompt(langData.systemPrompt || "", artifacts)
								const customInstructionsClean = removeArtifactContentFromPrompt(langData.customInstructions || "", artifacts)
								const combinedPromptParts: string[] = []
								if (systemPromptClean) {
									combinedPromptParts.push(systemPromptClean)
								}
								if (customInstructionsClean) {
									if (combinedPromptParts.length > 0) {
										combinedPromptParts.push("\n\n---\n\n")
									}
									combinedPromptParts.push(customInstructionsClean)
								}
								const newContent = combinedPromptParts.join("")
								
								const existingContent = await fs.readFile(combinedPromptFile, "utf-8")
								if (existingContent === newContent) {
									// Main file content unchanged, but still check artifacts
									console.log(`[exportPromptsToExtensionDist] Main file content unchanged for mode=${mode.slug}, lang=${lang}, but checking artifacts`)
									shouldUpdateMainFile = false
								}
							} catch (err) {
								// If read fails, continue with export
							}
						}
						
						// Check if artifacts changed by comparing count and content
						if (shouldUpdateMainFile === false) {
							try {
								const existingFiles = await fs.readdir(modeRulesDir)
								const existingArtifactFiles = existingFiles.filter(f => f.endsWith(".md") && /^\d{2}_/i.test(f) && !f.startsWith("00_"))
								const newArtifacts = langData.artifacts || []
								const newArtifactCount = newArtifacts.length
								
								// If artifact count changed (including deletion), need to update
								if (existingArtifactFiles.length !== newArtifactCount) {
									// Artifact count changed, need to update (will remove deleted artifacts)
									console.log(`[exportPromptsToExtensionDist] Artifact count changed for mode=${mode.slug}, lang=${lang} (${existingArtifactFiles.length} -> ${newArtifactCount})`)
								} else if (existingArtifactFiles.length === newArtifactCount && newArtifactCount > 0) {
									// Same count, check if all artifacts exist and match
									let allArtifactsMatch = true
									
									for (let i = 0; i < newArtifacts.length; i++) {
										const artifact = newArtifacts[i]
										const artifactKey = artifact.key || artifact.name || ""
										const cleanKey = artifactKey.trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
										const hasNumberPrefix = /^\d{2}_/i.test(cleanKey)
										const artifactFileName = hasNumberPrefix ? `${cleanKey}.md` : `${String(i + 1).padStart(2, "0")}_${cleanKey}.md`
										const artifactFile = path.join(modeRulesDir, artifactFileName)
										
										try {
											const existingContent = await fs.readFile(artifactFile, "utf-8")
											if (existingContent.trim() !== (artifact.content || "").trim()) {
												allArtifactsMatch = false
												break
											}
										} catch {
											allArtifactsMatch = false
											break
										}
									}
									
									if (allArtifactsMatch) {
										// Both main file and artifacts unchanged, skip completely
										console.log(`[exportPromptsToExtensionDist] Content and artifacts unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
										continue
									}
								} else if (existingArtifactFiles.length > 0 && newArtifactCount === 0) {
									// All artifacts were deleted, need to update to remove them
									console.log(`[exportPromptsToExtensionDist] All artifacts deleted for mode=${mode.slug}, lang=${lang}, will remove old files`)
								}
							} catch (err) {
								// If check fails, proceed with update
							}
						}
					}
					
					// Only create directories if we're actually going to write files
					await fs.mkdir(langDirPath, { recursive: true })
					await fs.mkdir(modeRulesDir, { recursive: true })

					totalLanguages++

					const roleName = (mode.name || "").replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
					const artifacts = langData.artifacts || []

					if (shouldUpdateMainFile) {
						await saveCombinedPrompt(
							modeRulesDir,
							roleName,
							langData.systemPrompt || "",
							langData.customInstructions || "",
							artifacts,
							false
						)
					}

					await saveArtifacts(modeRulesDir, artifacts, mode.slug, lang, false)
					modeExported = true
				}

				if (modeExported) {
					totalExported++
				}
			}

			// Process roles from batch response that are not in allModes
			const processedModeSlugs = new Set(allModes.map((m) => m.slug.toLowerCase()))
			const missingRoles = batchKeys.filter((key) => {
				const keyLower = key.toLowerCase()
				return !processedModeSlugs.has(keyLower)
			})

			if (missingRoles.length > 0) {
				console.log(
					`[exportPromptsToExtensionDist] Found ${missingRoles.length} roles in batch response not in allModes: ${missingRoles.join(", ")}`
				)

				for (const roleKey of missingRoles) {
					const roleData = batchData[roleKey]
					if (!roleData) continue

					const mode = {
						slug: roleKey.toLowerCase(),
						name: roleKey,
						originalSlug: roleKey,
						targetRoles: [roleKey.toLowerCase()],
					}

					console.log(`[exportPromptsToExtensionDist] Processing missing role: ${roleKey}`)

					totalModes++
					let modeExported = false

					for (const lang of SUPPORTED_LANGUAGES) {
						const langData = roleData[lang]
						if (!langData) {
							continue
						}

					// Check updated_at from cache first (optimization - skip file read if unchanged)
					const cacheKey = getCacheKeySeparated(mode.slug, lang)
					const cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
					const cachedUpdatedAt = normalizeUpdatedAt(cached?.updated_at)
					const responseUpdatedAt = normalizeUpdatedAt(langData.updated_at)
					
					const langDirPath = path.join(distPromptsDir, lang)
					const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
					
					// Check if content changed before creating directories and processing
					const modeRulesDirExists = await fs.access(modeRulesDir).then(() => true).catch(() => false)
					
					// If updated_at unchanged, still check artifacts (cache might be stale or artifacts might have changed)
					let shouldSkipDueToUnchanged = false
					if (cachedUpdatedAt === responseUpdatedAt && cachedUpdatedAt !== undefined && modeRulesDirExists) {
						// Check artifacts even if updated_at unchanged (artifacts might have changed)
						try {
							const existingFiles = await fs.readdir(modeRulesDir)
							const existingArtifactFiles = existingFiles.filter(f => f.endsWith(".md") && /^\d{2}_/i.test(f) && !f.startsWith("00_"))
							const newArtifacts = langData.artifacts || []
							const newArtifactCount = newArtifacts.length
							
							// If artifact count changed, need to update (don't skip)
							if (existingArtifactFiles.length !== newArtifactCount) {
								console.log(`[exportPromptsToExtensionDist] Artifact count changed for mode=${mode.slug}, lang=${lang} (${existingArtifactFiles.length} -> ${newArtifactCount}), updating despite unchanged updated_at`)
								// Continue with update - don't skip
							} else if (existingArtifactFiles.length === newArtifactCount && newArtifactCount > 0) {
								// Same count, check if all artifacts exist and match
								let allArtifactsMatch = true
								
								for (let i = 0; i < newArtifacts.length; i++) {
									const artifact = newArtifacts[i]
									const artifactKey = artifact.key || artifact.name || ""
									const cleanKey = artifactKey.trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
									const hasNumberPrefix = /^\d{2}_/i.test(cleanKey)
									const artifactFileName = hasNumberPrefix ? `${cleanKey}.md` : `${String(i + 1).padStart(2, "0")}_${cleanKey}.md`
									const artifactFile = path.join(modeRulesDir, artifactFileName)
									
									try {
										const existingContent = await fs.readFile(artifactFile, "utf-8")
										if (existingContent.trim() !== (artifact.content || "").trim()) {
											allArtifactsMatch = false
											break
										}
									} catch {
										// File doesn't exist - artifact changed
										allArtifactsMatch = false
										break
									}
								}
								
								if (allArtifactsMatch) {
									// Both updated_at and artifacts unchanged, skip completely
									console.log(`[exportPromptsToExtensionDist] updated_at and artifacts unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
									shouldSkipDueToUnchanged = true
								} else {
									console.log(`[exportPromptsToExtensionDist] Artifacts changed for mode=${mode.slug}, lang=${lang}, updating despite unchanged updated_at`)
								}
							} else if (existingArtifactFiles.length > 0 && newArtifactCount === 0) {
								// All artifacts were deleted
								console.log(`[exportPromptsToExtensionDist] All artifacts deleted for mode=${mode.slug}, lang=${lang}, updating despite unchanged updated_at`)
							}
						} catch (err) {
							// If check fails, proceed with update
						}
						
						// Also check main file if artifacts are unchanged
						if (!shouldSkipDueToUnchanged && modeRulesDirExists) {
							const roleName = (mode.name || "").replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
							const cleanRoleName = roleName.replace(/[^a-zA-Z0-9_()\s-]/g, "").replace(/\s+/g, "_")
							const combinedPromptFile = path.join(modeRulesDir, `00_${cleanRoleName}.md`)
							const fileExists = await fs.access(combinedPromptFile).then(() => true).catch(() => false)
							
							if (fileExists) {
								try {
									const artifacts = langData.artifacts || []
									const systemPromptClean = removeArtifactContentFromPrompt(langData.systemPrompt || "", artifacts)
									const customInstructionsClean = removeArtifactContentFromPrompt(langData.customInstructions || "", artifacts)
									const combinedPromptParts: string[] = []
									if (systemPromptClean) {
										combinedPromptParts.push(systemPromptClean)
									}
									if (customInstructionsClean) {
										if (combinedPromptParts.length > 0) {
											combinedPromptParts.push("\n\n---\n\n")
										}
										combinedPromptParts.push(customInstructionsClean)
									}
									const newContent = combinedPromptParts.join("")
									
									const existingContent = await fs.readFile(combinedPromptFile, "utf-8")
									if (existingContent === newContent) {
										// Both main file and artifacts unchanged, skip completely
										console.log(`[exportPromptsToExtensionDist] Content and artifacts unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
										shouldSkipDueToUnchanged = true
									}
								} catch (err) {
									// If read fails, continue with export
								}
							}
						}
					} else if (cachedUpdatedAt === responseUpdatedAt && cachedUpdatedAt !== undefined) {
						// updated_at unchanged and directory doesn't exist, skip
						console.log(`[exportPromptsToExtensionDist] updated_at unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
						shouldSkipDueToUnchanged = true
					}
					
					if (shouldSkipDueToUnchanged) {
						continue
					}
					
					let shouldUpdateMainFile = true
					
					if (modeRulesDirExists) {
						// Check if main file content changed
						const roleName = (mode.name || "").replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
						const cleanRoleName = roleName.replace(/[^a-zA-Z0-9_()\s-]/g, "").replace(/\s+/g, "_")
						const combinedPromptFile = path.join(modeRulesDir, `00_${cleanRoleName}.md`)
						const fileExists = await fs.access(combinedPromptFile).then(() => true).catch(() => false)
						
						if (fileExists) {
							try {
								// Build new content to compare
								const artifacts = langData.artifacts || []
								const systemPromptClean = removeArtifactContentFromPrompt(langData.systemPrompt || "", artifacts)
								const customInstructionsClean = removeArtifactContentFromPrompt(langData.customInstructions || "", artifacts)
								const combinedPromptParts: string[] = []
								if (systemPromptClean) {
									combinedPromptParts.push(systemPromptClean)
								}
								if (customInstructionsClean) {
									if (combinedPromptParts.length > 0) {
										combinedPromptParts.push("\n\n---\n\n")
									}
									combinedPromptParts.push(customInstructionsClean)
								}
								const newContent = combinedPromptParts.join("")
								
								const existingContent = await fs.readFile(combinedPromptFile, "utf-8")
								if (existingContent === newContent) {
									// Main file content unchanged, but still check artifacts
									console.log(`[exportPromptsToExtensionDist] Main file content unchanged for mode=${mode.slug}, lang=${lang}, but checking artifacts`)
									shouldUpdateMainFile = false
								}
							} catch (err) {
								// If read fails, continue with export
							}
						}
						
						// Check if artifacts changed by comparing count and content
						if (shouldUpdateMainFile === false) {
							try {
								const existingFiles = await fs.readdir(modeRulesDir)
								const existingArtifactFiles = existingFiles.filter(f => f.endsWith(".md") && /^\d{2}_/i.test(f) && !f.startsWith("00_"))
								const newArtifacts = langData.artifacts || []
								const newArtifactCount = newArtifacts.length
								
								// If artifact count changed (including deletion), need to update
								if (existingArtifactFiles.length !== newArtifactCount) {
									// Artifact count changed, need to update (will remove deleted artifacts)
									console.log(`[exportPromptsToExtensionDist] Artifact count changed for mode=${mode.slug}, lang=${lang} (${existingArtifactFiles.length} -> ${newArtifactCount})`)
								} else if (existingArtifactFiles.length === newArtifactCount && newArtifactCount > 0) {
									// Same count, check if all artifacts exist and match
									let allArtifactsMatch = true
									
									for (let i = 0; i < newArtifacts.length; i++) {
										const artifact = newArtifacts[i]
										const artifactKey = artifact.key || artifact.name || ""
										const cleanKey = artifactKey.trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
										const hasNumberPrefix = /^\d{2}_/i.test(cleanKey)
										const artifactFileName = hasNumberPrefix ? `${cleanKey}.md` : `${String(i + 1).padStart(2, "0")}_${cleanKey}.md`
										const artifactFile = path.join(modeRulesDir, artifactFileName)
										
										try {
											const existingContent = await fs.readFile(artifactFile, "utf-8")
											if (existingContent.trim() !== (artifact.content || "").trim()) {
												allArtifactsMatch = false
												break
											}
										} catch {
											// File doesn't exist - artifact changed
											allArtifactsMatch = false
											break
										}
									}
									
									if (allArtifactsMatch) {
										// Both main file and artifacts unchanged, skip completely
										console.log(`[exportPromptsToExtensionDist] Content and artifacts unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
										continue
									}
								} else if (existingArtifactFiles.length > 0 && newArtifactCount === 0) {
									// All artifacts were deleted, need to update to remove them
									console.log(`[exportPromptsToExtensionDist] All artifacts deleted for mode=${mode.slug}, lang=${lang}, will remove old files`)
								}
							} catch (err) {
								// If check fails, proceed with update
							}
						}
					}
						
						// Only create directories if we're actually going to write files
						await fs.mkdir(langDirPath, { recursive: true })
						await fs.mkdir(modeRulesDir, { recursive: true })

						totalLanguages++

						const roleName = (mode.name || "").replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
						const artifacts = langData.artifacts || []

						if (shouldUpdateMainFile) {
							await saveCombinedPrompt(
								modeRulesDir,
								roleName,
								langData.systemPrompt || "",
								langData.customInstructions || "",
								artifacts,
								false
							)
						}

						await saveArtifacts(modeRulesDir, artifacts, mode.slug, lang, false)
						modeExported = true
					}

					if (modeExported) {
						totalExported++
					}
				}
			}
		} else {
			// Fallback to individual requests
			console.log(`[exportPromptsToExtensionDist] Batch endpoint unavailable, falling back to individual requests`)
			
			// If we don't have batch data for cleanup, need to check all roles from API (not just filtered ones)
			// to determine which have published prompts for cleanup
			if (!batchDataForCleanup && rolesWithPublishedPrompts.size === 0) {
				console.log(`[exportPromptsToExtensionDist] No batch data for cleanup, checking all roles from API for cleanup`)
				// Check all roles from API (not just filtered ones) to build complete list for cleanup
				for (const apiRole of apiRoles) {
					const roleSlug = apiRole.slug.toLowerCase()
					// Check if role has at least one published prompt for any language
					let hasPublishedPrompt = false
					for (const lang of SUPPORTED_LANGUAGES) {
						try {
							const promptData = await loadPromptWithArtifactsFromApi(roleSlug, lang, undefined, context, true)
							if (promptData) {
								hasPublishedPrompt = true
								break
							}
						} catch (err) {
							// Continue checking other languages
						}
					}
					if (hasPublishedPrompt) {
						rolesWithPublishedPrompts.add(roleSlug)
					}
				}
			}

			for (const mode of allModes) {
				totalModes++

				if (totalModes > 1) {
					await new Promise((resolve) => setTimeout(resolve, 500))
				}

				let modeExported = false
				let hasPublishedPromptForMode = false

				for (const lang of SUPPORTED_LANGUAGES) {
					try {
						if (lang !== SUPPORTED_LANGUAGES[0]) {
							await new Promise((resolve) => setTimeout(resolve, 200))
						}

						// Check updated_at from cache first (optimization - skip API call if unchanged)
						const cacheKey = getCacheKeySeparated(mode.slug, lang)
						const cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
						const cachedUpdatedAt = normalizeUpdatedAt(cached?.updated_at)
						
						// Load prompt data (this will update cache with latest updated_at)
						const promptData = await loadPromptWithArtifactsFromApi(mode.slug, lang, undefined, context, true)

						if (!promptData) {
							console.log(`[exportPromptsToExtensionDist] No published prompt for mode=${mode.slug}, lang=${lang}`)
							await removeUnpublishedModeDir(distPromptsDir, lang, mode.slug)
							continue
						}
						
						// Mark that this role has at least one published prompt
						hasPublishedPromptForMode = true

						// Check if updated_at changed after API call
						const cachedAfter = context.globalState.get<CachedPromptSeparated>(cacheKey)
						const responseUpdatedAt = normalizeUpdatedAt(cachedAfter?.updated_at)
						
						const langDirPath = path.join(distPromptsDir, lang)
						const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
						
						// Check if content changed before creating directories and processing
						const modeRulesDirExists = await fs.access(modeRulesDir).then(() => true).catch(() => false)
						
						// If updated_at unchanged, still check artifacts (cache might be stale or artifacts might have changed)
						let shouldSkipDueToUnchanged = false
						if (cachedUpdatedAt === responseUpdatedAt && cachedUpdatedAt !== undefined && modeRulesDirExists) {
							// Check artifacts even if updated_at unchanged (artifacts might have changed)
							try {
								const existingFiles = await fs.readdir(modeRulesDir)
								const existingArtifactFiles = existingFiles.filter(f => f.endsWith(".md") && /^\d{2}_/i.test(f) && !f.startsWith("00_"))
								const newArtifacts = promptData.artifacts || []
								const newArtifactCount = newArtifacts.length
								
								// If artifact count changed, need to update (don't skip)
								if (existingArtifactFiles.length !== newArtifactCount) {
									console.log(`[exportPromptsToExtensionDist] Artifact count changed for mode=${mode.slug}, lang=${lang} (${existingArtifactFiles.length} -> ${newArtifactCount}), updating despite unchanged updated_at`)
									// Continue with update - don't skip
								} else if (existingArtifactFiles.length === newArtifactCount && newArtifactCount > 0) {
									// Same count, check if all artifacts exist and match
									let allArtifactsMatch = true
									
									for (let i = 0; i < newArtifacts.length; i++) {
										const artifact = newArtifacts[i]
										const artifactKey = artifact.key || artifact.name || ""
										const cleanKey = artifactKey.trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
										const hasNumberPrefix = /^\d{2}_/i.test(cleanKey)
										const artifactFileName = hasNumberPrefix ? `${cleanKey}.md` : `${String(i + 1).padStart(2, "0")}_${cleanKey}.md`
										const artifactFile = path.join(modeRulesDir, artifactFileName)
										
										try {
											const existingContent = await fs.readFile(artifactFile, "utf-8")
											if (existingContent.trim() !== (artifact.content || "").trim()) {
												allArtifactsMatch = false
												break
											}
										} catch {
											// File doesn't exist - artifact changed
											allArtifactsMatch = false
											break
										}
									}
									
									if (allArtifactsMatch) {
										// Both updated_at and artifacts unchanged, skip completely
										console.log(`[exportPromptsToExtensionDist] updated_at and artifacts unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
										shouldSkipDueToUnchanged = true
									} else {
										console.log(`[exportPromptsToExtensionDist] Artifacts changed for mode=${mode.slug}, lang=${lang}, updating despite unchanged updated_at`)
									}
								} else if (existingArtifactFiles.length > 0 && newArtifactCount === 0) {
									// All artifacts were deleted
									console.log(`[exportPromptsToExtensionDist] All artifacts deleted for mode=${mode.slug}, lang=${lang}, updating despite unchanged updated_at`)
								}
							} catch (err) {
								// If check fails, proceed with update
							}
							
							// Also check main file if artifacts are unchanged
							if (!shouldSkipDueToUnchanged && modeRulesDirExists) {
								const roleName = mode.name.replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
								const cleanRoleName = roleName.replace(/[^a-zA-Z0-9_()\s-]/g, "").replace(/\s+/g, "_")
								const combinedPromptFile = path.join(modeRulesDir, `00_${cleanRoleName}.md`)
								const fileExists = await fs.access(combinedPromptFile).then(() => true).catch(() => false)
								
								if (fileExists) {
									try {
										const artifacts = promptData.artifacts || []
										const systemPromptClean = removeArtifactContentFromPrompt(promptData.systemPrompt || "", artifacts)
										const customInstructionsClean = removeArtifactContentFromPrompt(promptData.customInstructions || "", artifacts)
										const combinedPromptParts: string[] = []
										if (systemPromptClean) {
											combinedPromptParts.push(systemPromptClean)
										}
										if (customInstructionsClean) {
											if (combinedPromptParts.length > 0) {
												combinedPromptParts.push("\n\n---\n\n")
											}
											combinedPromptParts.push(customInstructionsClean)
										}
										const newContent = combinedPromptParts.join("")
										
										const existingContent = await fs.readFile(combinedPromptFile, "utf-8")
										if (existingContent === newContent) {
											// Both main file and artifacts unchanged, skip completely
											console.log(`[exportPromptsToExtensionDist] Content and artifacts unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
											shouldSkipDueToUnchanged = true
										}
									} catch (err) {
										// If read fails, continue with export
									}
								}
							}
						} else if (cachedUpdatedAt === responseUpdatedAt && cachedUpdatedAt !== undefined) {
							// updated_at unchanged and directory doesn't exist, skip
							console.log(`[exportPromptsToExtensionDist] updated_at unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
							shouldSkipDueToUnchanged = true
						}
						
						if (shouldSkipDueToUnchanged) {
							continue
						}
						
						let shouldUpdateMainFile = true
						
						if (modeRulesDirExists) {
							// Check if main file content changed
							const roleName = mode.name.replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
							const cleanRoleName = roleName.replace(/[^a-zA-Z0-9_()\s-]/g, "").replace(/\s+/g, "_")
							const combinedPromptFile = path.join(modeRulesDir, `00_${cleanRoleName}.md`)
							const fileExists = await fs.access(combinedPromptFile).then(() => true).catch(() => false)
							
							if (fileExists) {
								try {
									// Build new content to compare
									const artifacts = promptData.artifacts || []
									const systemPromptClean = removeArtifactContentFromPrompt(promptData.systemPrompt || "", artifacts)
									const customInstructionsClean = removeArtifactContentFromPrompt(promptData.customInstructions || "", artifacts)
									const combinedPromptParts: string[] = []
									if (systemPromptClean) {
										combinedPromptParts.push(systemPromptClean)
									}
									if (customInstructionsClean) {
										if (combinedPromptParts.length > 0) {
											combinedPromptParts.push("\n\n---\n\n")
										}
										combinedPromptParts.push(customInstructionsClean)
									}
									const newContent = combinedPromptParts.join("")
									
									const existingContent = await fs.readFile(combinedPromptFile, "utf-8")
									if (existingContent === newContent) {
										// Main file content unchanged, but still check artifacts
										console.log(`[exportPromptsToExtensionDist] Main file content unchanged for mode=${mode.slug}, lang=${lang}, but checking artifacts`)
										shouldUpdateMainFile = false
									}
								} catch (err) {
									// If read fails, continue with export
								}
							}
							
							// Check if artifacts changed by comparing count and content
							if (shouldUpdateMainFile === false) {
								try {
									const existingFiles = await fs.readdir(modeRulesDir)
									const existingArtifactFiles = existingFiles.filter(f => f.endsWith(".md") && /^\d{2}_/i.test(f) && !f.startsWith("00_"))
									const newArtifacts = promptData.artifacts || []
									const newArtifactCount = newArtifacts.length
									
									// If artifact count changed (including deletion), need to update
									if (existingArtifactFiles.length !== newArtifactCount) {
										// Artifact count changed, need to update (will remove deleted artifacts)
										console.log(`[exportPromptsToExtensionDist] Artifact count changed for mode=${mode.slug}, lang=${lang} (${existingArtifactFiles.length} -> ${newArtifactCount})`)
									} else if (existingArtifactFiles.length === newArtifactCount && newArtifactCount > 0) {
										// Same count, check if all artifacts exist and match
										let allArtifactsMatch = true
										
										for (let i = 0; i < newArtifacts.length; i++) {
											const artifact = newArtifacts[i]
											const artifactKey = artifact.key || artifact.name || ""
											const cleanKey = artifactKey.trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
											const hasNumberPrefix = /^\d{2}_/i.test(cleanKey)
											const artifactFileName = hasNumberPrefix ? `${cleanKey}.md` : `${String(i + 1).padStart(2, "0")}_${cleanKey}.md`
											const artifactFile = path.join(modeRulesDir, artifactFileName)
											
											try {
												const existingContent = await fs.readFile(artifactFile, "utf-8")
												if (existingContent.trim() !== (artifact.content || "").trim()) {
													allArtifactsMatch = false
													break
												}
											} catch {
												allArtifactsMatch = false
												break
											}
										}
										
										if (allArtifactsMatch) {
											// Both main file and artifacts unchanged, skip completely
											console.log(`[exportPromptsToExtensionDist] Content and artifacts unchanged for mode=${mode.slug}, lang=${lang}, skipping`)
											continue
										}
									} else if (existingArtifactFiles.length > 0 && newArtifactCount === 0) {
										// All artifacts were deleted, need to update to remove them
										console.log(`[exportPromptsToExtensionDist] All artifacts deleted for mode=${mode.slug}, lang=${lang}, will remove old files`)
									}
								} catch (err) {
									// If check fails, proceed with update
								}
							}
						}
						
						// Only create directories if we're actually going to write files
						await fs.mkdir(langDirPath, { recursive: true })
						await fs.mkdir(modeRulesDir, { recursive: true })

						totalLanguages++

						const roleName = mode.name.replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
						const artifacts = promptData.artifacts || []

						if (shouldUpdateMainFile) {
							await saveCombinedPrompt(
								modeRulesDir,
								roleName,
								promptData.systemPrompt || "",
								promptData.customInstructions || "",
								artifacts,
								false
							)
						}

						await saveArtifacts(modeRulesDir, artifacts, mode.slug, lang, false)
						modeExported = true
					} catch (error) {
						console.warn(`[exportPromptsToExtensionDist] Failed to export mode=${mode.slug}, lang=${lang}: ${error}`)
					}
				}

				if (modeExported) {
					totalExported++
				}
				
				// Add role to set of roles with published prompts (for cleanup) if it has at least one published prompt
				if (hasPublishedPromptForMode) {
					rolesWithPublishedPrompts.add(mode.slug)
				}
			}
		}

		// Final cleanup - use only roles that are in apiRoles AND have published prompts
		// This ensures archived roles (not in apiRoles) are removed from dist/prompts
		console.log(`[exportPromptsToExtensionDist] Performing final cleanup with ${rolesWithPublishedPrompts.size} valid roles (out of ${allApiRoleSlugs.length} from API)...`)
		await cleanupDistPrompts(distPromptsDir, rolesWithPublishedPrompts.size > 0 ? rolesWithPublishedPrompts : undefined)

		return { totalExported, totalModes, totalLanguages }
	} catch (error: any) {
		console.error(`[exportPromptsToExtensionDist] Failed to fetch roles from API: ${error}`)
		console.warn(`[exportPromptsToExtensionDist] NOT using built-in prompts fallback - only API data should be exported`)
		// Do NOT export built-in prompts - this function should only export API data
		// Return empty result instead of falling back to built-in prompts
		return { totalExported: 0, totalModes: 0, totalLanguages: 0 }
	}
}

// Check if prompts have been exported and export if needed
// Exports ONLY to dist/prompts directory (NOT to ~/.roo)
export async function exportPromptsOnFirstInstall(
	context: vscode.ExtensionContext,
	_workspaceRoot?: string
): Promise<void> {
	const hasExportedBefore = context.globalState.get<boolean>("promptsExportedFromApi")
	const lastExportedVersion = context.globalState.get<string>("lastExportedExtensionVersion")
	const currentVersion = context.extension.packageJSON.version

	const distPromptsPath = path.join(context.extensionPath, "dist", "prompts")

	const isExtensionUpdate = lastExportedVersion && lastExportedVersion !== currentVersion
	if (isExtensionUpdate) {
		console.log(
			`[exportPromptsOnFirstInstall] Extension updated from ${lastExportedVersion} to ${currentVersion}, will export`
		)
	}

	let needsExport = !hasExportedBefore || isExtensionUpdate
	if (hasExportedBefore && !isExtensionUpdate) {
		try {
			const stats = await fs.stat(distPromptsPath).catch(() => null)
			if (!stats || !stats.isDirectory()) {
				console.log(`[exportPromptsOnFirstInstall] dist/prompts directory doesn't exist, will export`)
				needsExport = true
			} else {
				const contents = await fs.readdir(distPromptsPath).catch(() => [])
				const hasLanguageFolders = contents.some((item) => {
					return ["ru", "en", "es", "zh", "ar", "pt"].includes(item)
				})
				// Check for rules-* folders at top level (incorrect structure - should be inside language folders)
				const hasRulesFoldersAtTopLevel = contents.some((item) => {
					return item.startsWith("rules-")
				})
				if (!hasLanguageFolders) {
					console.log(`[exportPromptsOnFirstInstall] dist/prompts directory is empty, will export`)
					needsExport = true
				} else if (hasRulesFoldersAtTopLevel) {
					console.log(`[exportPromptsOnFirstInstall] Found rules-* folders at top level (incorrect structure), will re-export`)
					needsExport = true
				} else {
					console.log(`[exportPromptsOnFirstInstall] dist/prompts directory exists with correct structure, skipping export`)
				}
			}
		} catch (err) {
			console.warn(`[exportPromptsOnFirstInstall] Failed to check dist/prompts directory: ${err}`)
			needsExport = true
		}
	}

	if (!needsExport) {
		console.log("[exportPromptsOnFirstInstall] Prompts already exported, skipping")
		return
	}

	try {
		console.log("[exportPromptsOnFirstInstall] Exporting prompts from API...")

		// Export ONLY to extension's dist/prompts directory (NOT to ~/.roo)
		console.log("[exportPromptsOnFirstInstall] Exporting to dist/prompts...")
		const distResult = await exportPromptsToExtensionDist(context)

		if (distResult.totalExported > 0) {
			await context.globalState.update("promptsExportedFromApi", true)
			await context.globalState.update("lastExportedExtensionVersion", currentVersion)
			console.log(`[exportPromptsOnFirstInstall] Exported ${distResult.totalExported} modes, ${distResult.totalLanguages} languages to dist/prompts`)
			if (isExtensionUpdate) {
				console.log(
					`[exportPromptsOnFirstInstall] Prompts updated after extension update (${lastExportedVersion} -> ${currentVersion})`
				)
			}
		} else {
			console.warn("[exportPromptsOnFirstInstall] No prompts exported, API may be unavailable")
		}
	} catch (error) {
		console.error("[exportPromptsOnFirstInstall] Failed to export prompts on first install:", error)
	}
}

// Normalize language code to match directory format
function normalizeLangForDirectory(lang?: string): string {
	if (!lang) return "ru"

	const baseLang = lang.split("-")[0].toLowerCase()

	const langMap: Record<string, string> = {
		ru: "ru",
		en: "en",
		es: "es",
		zh: "zh",
		ar: "ar",
		pt: "pt",
	}

	return langMap[baseLang] || "ru"
}

// Copy prompts from dist/prompts to project .roo directory
// NOTE: Global ~/.roo export is DISABLED - prompts are stored ONLY in dist/prompts
// workspaceRoot is REQUIRED - without it, function returns early
export async function copyPromptsFromGlobalToProject(
	workspaceRoot?: string,
	currentLanguage?: string,
	context?: vscode.ExtensionContext
): Promise<{ totalCopied: number; totalModes: number; totalLanguages: number; targetDir: string }> {
	// IMPORTANT: Reject export to global ~/.roo - prompts live ONLY in dist/prompts
	if (!workspaceRoot) {
		console.log(`[copyPromptsToRoo] Skipping - global ~/.roo export is disabled, prompts are stored in dist/prompts only`)
		return { totalCopied: 0, totalModes: 0, totalLanguages: 0, targetDir: "" }
	}

	// Determine source directory: dist/prompts if context available, otherwise try to find extension path
	let sourceDir: string
	if (context) {
		sourceDir = path.join(context.extensionPath, "dist", "prompts")
	} else {
		// Fallback: try to find dist/prompts relative to this file
		sourceDir = path.join(__dirname, "..", "prompts")
	}
	
	// Target directory: project .roo ONLY
	const targetRooDir = getProjectRooDirectoryForCwd(workspaceRoot)

	const normalizedLang = normalizeLangForDirectory(currentLanguage)

	console.log(`[copyPromptsToRoo] Copying from dist/prompts to project .roo`)
	console.log(`[copyPromptsToRoo]   Source: ${sourceDir}`)
	console.log(`[copyPromptsToRoo]   Target: ${targetRooDir}`)
	console.log(`[copyPromptsToRoo]   Language filter: ${normalizedLang}`)

	const sourceExists = await fs
		.access(sourceDir)
		.then(() => true)
		.catch(() => false)
	if (!sourceExists) {
		console.warn(`[copyPromptsToRoo] dist/prompts directory does not exist: ${sourceDir}`)
		return { totalCopied: 0, totalModes: 0, totalLanguages: 0, targetDir: targetRooDir }
	}

	await fs.mkdir(targetRooDir, { recursive: true })

	let totalCopied = 0
	let totalModes = 0
	let totalLanguages = 0

	try {
		const sourceEntries = await fs.readdir(sourceDir, { withFileTypes: true })

		for (const entry of sourceEntries) {
			if (!entry.isDirectory()) {
				continue
			}

			const lang = entry.name

			// Only copy current user language
			if (lang !== normalizedLang) {
				console.log(`[copyPromptsToRoo] Skipping language: ${lang} (only copying ${normalizedLang})`)
				continue
			}

			if (!SUPPORTED_LANGUAGES.includes(lang)) {
				continue
			}

			const sourceLangDir = path.join(sourceDir, lang)
			const targetLangDir = path.join(targetRooDir, lang)
			await fs.mkdir(targetLangDir, { recursive: true })

			totalLanguages = 1

			const langEntries = await fs.readdir(sourceLangDir, { withFileTypes: true })

			for (const langEntry of langEntries) {
				if (!langEntry.isDirectory()) {
					continue
				}

				const modeDirName = langEntry.name

				if (!modeDirName.startsWith("rules-")) {
					continue
				}

				totalModes++

				const sourceModeDir = path.join(sourceLangDir, modeDirName)
				const targetModeDir = path.join(targetLangDir, modeDirName)
				await fs.mkdir(targetModeDir, { recursive: true })

				const modeFiles = await fs.readdir(sourceModeDir, { withFileTypes: true })

				for (const file of modeFiles) {
					if (file.isFile() && file.name.endsWith(".md")) {
						const sourceFile = path.join(sourceModeDir, file.name)
						const targetFile = path.join(targetModeDir, file.name)

						const targetExists = await fs
							.access(targetFile)
							.then(() => true)
							.catch(() => false)

						if (targetExists) {
							try {
								const sourceContent = await fs.readFile(sourceFile, "utf-8")
								const targetContent = await fs.readFile(targetFile, "utf-8")

								if (sourceContent !== targetContent) {
									console.log(`[copyPromptsToRoo] Skipping ${file.name} - modified by user`)
									continue
								}
								continue
							} catch (err) {
								console.warn(`[copyPromptsToRoo] Failed to compare ${file.name}: ${err}`)
								continue
							}
						}

						try {
							const content = await fs.readFile(sourceFile, "utf-8")
							await fs.writeFile(targetFile, content, "utf-8")
							console.log(`[copyPromptsToRoo] Copied ${file.name} to project .roo`)
						} catch (err) {
							console.warn(`[copyPromptsToRoo] Failed to copy ${file.name}: ${err}`)
						}
					}
				}

				totalCopied++
			}
		}

		console.log(
			`[copyPromptsToRoo] Copied ${totalCopied} modes for language ${normalizedLang} from dist/prompts to project .roo`
		)
		return { totalCopied, totalModes, totalLanguages, targetDir: targetRooDir }
	} catch (error) {
		console.error(`[copyPromptsToRoo] Failed to copy prompts: ${error}`)
		return { totalCopied, totalModes, totalLanguages, targetDir: targetRooDir }
	}
}
