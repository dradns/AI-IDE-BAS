import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import {
	loadPromptWithArtifactsFromApi,
	getAllRolesFromApi,
	roleToMode,
	loadPromptsBatchFromApi,
} from "./prompt-api-service"
import { getGlobalRooDirectory, getProjectRooDirectoryForCwd, clearGlobalRooCache } from "./roo-config"
import { modes } from "../shared/modes"

// Supported languages for API export
const SUPPORTED_LANGUAGES = ["ru", "en", "es", "zh", "ar", "pt"]

// Remove artifact content from prompt text to avoid duplication
function removeArtifactContentFromPrompt(
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

	const fileExists = await fs
		.access(combinedPromptFile)
		.then(() => true)
		.catch(() => false)

	if (isProjectExport && fileExists) {
		console.log(`[saveCombinedPrompt] Skipping ${combinedPromptFile} - file exists in project .roo`)
		return
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

	await fs.writeFile(combinedPromptFile, combinedPromptParts.join(""), "utf-8")
}

// Save artifacts to separate files (01_*.md, 02_*.md, etc.)
async function saveArtifacts(
	modeRulesDir: string,
	artifacts: Array<{ key: string; content: string; name?: string }>,
	modeSlug: string,
	lang: string,
	isProjectExport: boolean
): Promise<void> {
	if (artifacts.length === 0) {
		return
	}

	console.log(`[saveArtifacts] Saving ${artifacts.length} artifacts for mode=${modeSlug}, lang=${lang}`)

	// Clean up old artifact files
	try {
		const existingFiles = await fs.readdir(modeRulesDir)
		for (const file of existingFiles) {
			if (file.endsWith(".md") && /^\d{2}_/i.test(file) && !file.startsWith("00_")) {
				await fs.unlink(path.join(modeRulesDir, file)).catch(() => {})
			}
		}
	} catch (err) {
		/* ignore */
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

		const fileExists = await fs
			.access(artifactFile)
			.then(() => true)
			.catch(() => false)

		if (isProjectExport && fileExists) {
			console.log(`[saveArtifacts] Skipping ${artifactFileName} - file exists in project .roo`)
			continue
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

		await fs.writeFile(artifactFile, artifact.content.trim(), "utf-8")
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

// Export prompts from API to file system
export async function exportPromptsFromApi(
	context: vscode.ExtensionContext,
	workspaceRoot?: string,
	showProgress: boolean = true
): Promise<{ totalExported: number; totalModes: number; totalLanguages: number }> {
	const globalRooDir = getGlobalRooDirectory()
	const projectRooDir = workspaceRoot ? getProjectRooDirectoryForCwd(workspaceRoot) : null

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

		// Setup target directories
		const rooDirs: string[] = []
		if (workspaceRoot && projectRooDir) {
			rooDirs.push(projectRooDir)
			await cleanupRooDirectory(projectRooDir, true, validModeSlugs)
			await fs.mkdir(projectRooDir, { recursive: true })
			console.log(`[exportPromptsFromApi] Exporting to project .roo: ${projectRooDir}`)
		} else {
			rooDirs.push(globalRooDir)
			await cleanupRooDirectory(globalRooDir, false, validModeSlugs)
			await fs.mkdir(globalRooDir, { recursive: true })
			clearGlobalRooCache()
			console.log(`[exportPromptsFromApi] Exporting to global ~/.roo: ${globalRooDir}`)
		}

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
	context: vscode.ExtensionContext
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

		const allModes =
			apiRoles.length > 0
				? apiRoles.map((role: { slug: string; name: string; emoji?: string; target_roles: string[] }) => {
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
				: modes.map((mode) => ({
						slug: mode.slug,
						name: mode.name,
						originalSlug: mode.slug,
						targetRoles: [mode.slug],
					}))

		const validModeSlugs = new Set<string>(allModes.map((mode) => mode.slug))

		await cleanupDistPrompts(distPromptsDir, validModeSlugs)

		try {
			await fs.mkdir(distPromptsDir, { recursive: true })
			console.log(`[exportPromptsToExtensionDist] Created/verified dist/prompts directory: ${distPromptsDir}`)
		} catch (error) {
			console.error(`[exportPromptsToExtensionDist] Failed to create dist/prompts directory: ${error}`)
			throw error
		}

		console.log(
			`[exportPromptsToExtensionDist] Exporting ${allModes.length} modes (${apiRoles.length} from API, ${modes.length} built-in)`
		)

		// Try batch endpoint first
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

				totalModes++
				let modeExported = false

				for (const lang of SUPPORTED_LANGUAGES) {
					const langData = roleData[lang]

					if (!langData) {
						console.log(`[exportPromptsToExtensionDist] No published prompt for mode=${mode.slug}, lang=${lang}`)
						await removeUnpublishedModeDir(distPromptsDir, lang, mode.slug)
						continue
					}

					totalLanguages++

					const langDirPath = path.join(distPromptsDir, lang)
					await fs.mkdir(langDirPath, { recursive: true })

					const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
					await fs.mkdir(modeRulesDir, { recursive: true })

					const roleName = (mode.name || "").replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
					const artifacts = langData.artifacts || []

					await saveCombinedPrompt(
						modeRulesDir,
						roleName,
						langData.systemPrompt || "",
						langData.customInstructions || "",
						artifacts,
						false
					)

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

						totalLanguages++

						const langDirPath = path.join(distPromptsDir, lang)
						await fs.mkdir(langDirPath, { recursive: true })

						const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
						await fs.mkdir(modeRulesDir, { recursive: true })

						const roleName = (mode.name || "").replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
						const artifacts = langData.artifacts || []

						await saveCombinedPrompt(
							modeRulesDir,
							roleName,
							langData.systemPrompt || "",
							langData.customInstructions || "",
							artifacts,
							false
						)

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

			for (const mode of allModes) {
				totalModes++

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
							console.log(`[exportPromptsToExtensionDist] No published prompt for mode=${mode.slug}, lang=${lang}`)
							await removeUnpublishedModeDir(distPromptsDir, lang, mode.slug)
							continue
						}

						totalLanguages++

						const langDirPath = path.join(distPromptsDir, lang)
						await fs.mkdir(langDirPath, { recursive: true })

						const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
						await fs.mkdir(modeRulesDir, { recursive: true })

						const roleName = mode.name.replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
						const artifacts = promptData.artifacts || []

						await saveCombinedPrompt(
							modeRulesDir,
							roleName,
							promptData.systemPrompt || "",
							promptData.customInstructions || "",
							artifacts,
							false
						)

						await saveArtifacts(modeRulesDir, artifacts, mode.slug, lang, false)
						modeExported = true
					} catch (error) {
						console.warn(`[exportPromptsToExtensionDist] Failed to export mode=${mode.slug}, lang=${lang}: ${error}`)
					}
				}

				if (modeExported) {
					totalExported++
				}
			}
		}

		// Final cleanup
		console.log(`[exportPromptsToExtensionDist] Performing final cleanup...`)
		await cleanupDistPrompts(distPromptsDir, validModeSlugs)

		return { totalExported, totalModes, totalLanguages }
	} catch (error: any) {
		console.error(`[exportPromptsToExtensionDist] Failed to fetch roles from API: ${error}`)
		console.log("[exportPromptsToExtensionDist] Falling back to built-in modes...")

		// Fallback to built-in modes
		for (const mode of modes) {
			totalModes++

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
						console.log(`[exportPromptsToExtensionDist] No published prompt for mode=${mode.slug}, lang=${lang}`)
						await removeUnpublishedModeDir(distPromptsDir, lang, mode.slug)
						continue
					}

					totalLanguages++

					const langDirPath = path.join(distPromptsDir, lang)
					await fs.mkdir(langDirPath, { recursive: true })

					const modeRulesDir = path.join(langDirPath, `rules-${mode.slug}`)
					await fs.mkdir(modeRulesDir, { recursive: true })

					const roleName = mode.name.replace(/^[\uD800-\uDFFF]+\s*/, "").trim() || mode.slug
					const artifacts = promptData.artifacts || []

					await saveCombinedPrompt(
						modeRulesDir,
						roleName,
						promptData.systemPrompt || "",
						promptData.customInstructions || "",
						artifacts,
						false
					)

					await saveArtifacts(modeRulesDir, artifacts, mode.slug, lang, false)
					modeExported = true
				} catch (error) {
					console.warn(`[exportPromptsToExtensionDist] Failed to export mode=${mode.slug}, lang=${lang}: ${error}`)
				}
			}

			if (modeExported) {
				totalExported++
			}
		}

		console.log(
			`[exportPromptsToExtensionDist] Export completed (fallback): ${totalExported} modes, ${totalLanguages} languages exported to ${distPromptsDir}`
		)
		return { totalExported, totalModes, totalLanguages }
	}
}

// Check if prompts have been exported and export if needed
export async function exportPromptsOnFirstInstall(
	context: vscode.ExtensionContext,
	_workspaceRoot?: string
): Promise<void> {
	const hasExportedBefore = context.globalState.get<boolean>("promptsExportedFromApi")
	const lastExportedVersion = context.globalState.get<string>("lastExportedExtensionVersion")
	const currentVersion = context.extension.packageJSON.version

	const { getGlobalRooDirectory } = await import("./roo-config")
	const globalRooPath = getGlobalRooDirectory()

	const isExtensionUpdate = lastExportedVersion && lastExportedVersion !== currentVersion
	if (isExtensionUpdate) {
		console.log(
			`[exportPromptsOnFirstInstall] Extension updated from ${lastExportedVersion} to ${currentVersion}, will export`
		)
	}

	let needsExport = !hasExportedBefore || isExtensionUpdate
	if (hasExportedBefore && !isExtensionUpdate) {
		try {
			const stats = await fs.stat(globalRooPath).catch(() => null)
			if (!stats || !stats.isDirectory()) {
				console.log(`[exportPromptsOnFirstInstall] Global .roo directory doesn't exist, will export`)
				needsExport = true
			} else {
				const contents = await fs.readdir(globalRooPath).catch(() => [])
				const hasLanguageFolders = contents.some((item) => {
					return ["ru", "en", "es", "zh", "ar", "pt"].includes(item)
				})
				if (!hasLanguageFolders) {
					console.log(`[exportPromptsOnFirstInstall] Global .roo directory is empty, will export`)
					needsExport = true
				} else {
					console.log(`[exportPromptsOnFirstInstall] Global .roo directory exists with content, skipping export`)
				}
			}
		} catch (err) {
			console.warn(`[exportPromptsOnFirstInstall] Failed to check global .roo directory: ${err}`)
			needsExport = true
		}
	}

	if (!needsExport) {
		console.log("[exportPromptsOnFirstInstall] Prompts already exported, skipping")
		return
	}

	try {
		console.log("[exportPromptsOnFirstInstall] Exporting prompts from API...")

		// Export to extension's dist/prompts directory
		console.log("[exportPromptsOnFirstInstall] Exporting to dist/prompts...")
		const distResult = await exportPromptsToExtensionDist(context)

		// Export to global .roo directory
		console.log("[exportPromptsOnFirstInstall] Exporting to global .roo directory...")
		console.log(`[exportPromptsOnFirstInstall] Global .roo path: ${globalRooPath}`)

		const globalRooResult = await exportPromptsFromApi(context, undefined, false)

		// Verify directory was created
		try {
			const stats = await fs.stat(globalRooPath)
			if (stats.isDirectory()) {
				console.log(`[exportPromptsOnFirstInstall] Verified global .roo directory exists: ${globalRooPath}`)
				const contents = await fs.readdir(globalRooPath)
				console.log(`[exportPromptsOnFirstInstall] Global .roo directory contents: ${contents.join(", ")}`)
			}
		} catch (err) {
			console.error(`[exportPromptsOnFirstInstall] Failed to verify global .roo directory: ${err}`)
		}

		const totalExported = distResult.totalExported + globalRooResult.totalExported
		const totalLanguages = distResult.totalLanguages + globalRooResult.totalLanguages

		if (totalExported > 0) {
			await context.globalState.update("promptsExportedFromApi", true)
			await context.globalState.update("lastExportedExtensionVersion", currentVersion)
			console.log(`[exportPromptsOnFirstInstall] Exported ${totalExported} modes, ${totalLanguages} languages`)
			console.log(
				`[exportPromptsOnFirstInstall]   - dist/prompts: ${distResult.totalExported} modes, ${distResult.totalLanguages} languages`
			)
			console.log(
				`[exportPromptsOnFirstInstall]   - ~/.roo: ${globalRooResult.totalExported} modes, ${globalRooResult.totalLanguages} languages`
			)
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

// Copy prompts from global ~/.roo to project .roo directory
export async function copyPromptsFromGlobalToProject(
	workspaceRoot: string,
	currentLanguage?: string
): Promise<{ totalCopied: number; totalModes: number; totalLanguages: number }> {
	const globalRooDir = getGlobalRooDirectory()
	const projectRooDir = getProjectRooDirectoryForCwd(workspaceRoot)

	const normalizedLang = normalizeLangForDirectory(currentLanguage)

	console.log(`[copyPromptsFromGlobalToProject] Copying from global ~/.roo to project .roo`)
	console.log(`[copyPromptsFromGlobalToProject]   Source: ${globalRooDir}`)
	console.log(`[copyPromptsFromGlobalToProject]   Target: ${projectRooDir}`)
	console.log(`[copyPromptsFromGlobalToProject]   Language filter: ${normalizedLang}`)

	const globalExists = await fs
		.access(globalRooDir)
		.then(() => true)
		.catch(() => false)
	if (!globalExists) {
		console.warn(`[copyPromptsFromGlobalToProject] Global .roo directory does not exist: ${globalRooDir}`)
		return { totalCopied: 0, totalModes: 0, totalLanguages: 0 }
	}

	await fs.mkdir(projectRooDir, { recursive: true })

	let totalCopied = 0
	let totalModes = 0
	let totalLanguages = 0

	try {
		const globalEntries = await fs.readdir(globalRooDir, { withFileTypes: true })

		for (const entry of globalEntries) {
			if (!entry.isDirectory()) {
				continue
			}

			const lang = entry.name

			// Only copy current user language
			if (lang !== normalizedLang) {
				console.log(`[copyPromptsFromGlobalToProject] Skipping language: ${lang} (only copying ${normalizedLang})`)
				continue
			}

			if (!SUPPORTED_LANGUAGES.includes(lang)) {
				continue
			}

			const globalLangDir = path.join(globalRooDir, lang)
			const projectLangDir = path.join(projectRooDir, lang)
			await fs.mkdir(projectLangDir, { recursive: true })

			totalLanguages = 1

			const langEntries = await fs.readdir(globalLangDir, { withFileTypes: true })

			for (const langEntry of langEntries) {
				if (!langEntry.isDirectory()) {
					continue
				}

				const modeDirName = langEntry.name

				if (!modeDirName.startsWith("rules-")) {
					continue
				}

				totalModes++

				const globalModeDir = path.join(globalLangDir, modeDirName)
				const projectModeDir = path.join(projectLangDir, modeDirName)
				await fs.mkdir(projectModeDir, { recursive: true })

				const modeFiles = await fs.readdir(globalModeDir, { withFileTypes: true })

				for (const file of modeFiles) {
					if (file.isFile() && file.name.endsWith(".md")) {
						const sourceFile = path.join(globalModeDir, file.name)
						const targetFile = path.join(projectModeDir, file.name)

						const targetExists = await fs
							.access(targetFile)
							.then(() => true)
							.catch(() => false)

						if (targetExists) {
							try {
								const globalContent = await fs.readFile(sourceFile, "utf-8")
								const projectContent = await fs.readFile(targetFile, "utf-8")

								if (globalContent !== projectContent) {
									console.log(`[copyPromptsFromGlobalToProject] Skipping ${file.name} - modified by user`)
									continue
								}
								continue
							} catch (err) {
								console.warn(`[copyPromptsFromGlobalToProject] Failed to compare ${file.name}: ${err}`)
								continue
							}
						}

						try {
							const content = await fs.readFile(sourceFile, "utf-8")
							await fs.writeFile(targetFile, content, "utf-8")
							console.log(`[copyPromptsFromGlobalToProject] Copied ${file.name} to project .roo`)
						} catch (err) {
							console.warn(`[copyPromptsFromGlobalToProject] Failed to copy ${file.name}: ${err}`)
						}
					}
				}

				totalCopied++
			}
		}

		console.log(
			`[copyPromptsFromGlobalToProject] Copied ${totalCopied} modes for language ${normalizedLang} from global ~/.roo to project .roo`
		)
		return { totalCopied, totalModes, totalLanguages }
	} catch (error) {
		console.error(`[copyPromptsFromGlobalToProject] Failed to copy prompts: ${error}`)
		return { totalCopied, totalModes, totalLanguages }
	}
}
