import fs from "fs/promises"
import path from "path"
import * as os from "os"
import { Dirent } from "fs"

import { isLanguage } from "@roo-code/types"

import type { SystemPromptSettings } from "../types"

import { getLanguageName, formatLanguage } from "../../../shared/language"
import { getSectionLabel, getSectionTitle } from "../../../services/prompt-section-labels"
import { getRooDirectoriesForCwd, getGlobalRooDirectory } from "../../../services/roo-config"

// Helper function to convert path to POSIX format
function toPosixPath(p: string): string {
	// Extended-Length Paths in Windows start with "\\?\" to allow longer paths and bypass usual parsing. If detected, we return the path unmodified to maintain functionality, as altering these paths could break their special syntax.
	const isExtendedLengthPath = p.startsWith("\\\\?\\")
	if (isExtendedLengthPath) {
		return p
	}
	return p.replace(/\\/g, "/")
}

/**
 * Safely read a file and return its trimmed content
 */
async function safeReadFile(filePath: string): Promise<string> {
	try {
		const content = await fs.readFile(filePath, "utf-8")
		return content.trim()
	} catch (err) {
		const errorCode = (err as NodeJS.ErrnoException).code
		if (!errorCode || !["ENOENT", "EISDIR"].includes(errorCode)) {
			throw err
		}
		return ""
	}
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(dirPath)
		return stats.isDirectory()
	} catch (err) {
		return false
	}
}

const MAX_DEPTH = 5

/**
 * Recursively resolve directory entries and collect file paths
 */
async function resolveDirectoryEntry(
	entry: Dirent,
	dirPath: string,
	fileInfo: Array<{ originalPath: string; resolvedPath: string }>,
	depth: number,
): Promise<void> {
	// Avoid cyclic symlinks
	if (depth > MAX_DEPTH) {
		return
	}

	const fullPath = path.resolve(entry.parentPath || dirPath, entry.name)
	if (entry.isFile()) {
		// Regular file - both original and resolved paths are the same
		fileInfo.push({ originalPath: fullPath, resolvedPath: fullPath })
	} else if (entry.isSymbolicLink()) {
		// Await the resolution of the symbolic link
		await resolveSymLink(fullPath, fileInfo, depth + 1)
	}
}

/**
 * Recursively resolve a symbolic link and collect file paths
 */
async function resolveSymLink(
	symlinkPath: string,
	fileInfo: Array<{ originalPath: string; resolvedPath: string }>,
	depth: number,
): Promise<void> {
	// Avoid cyclic symlinks
	if (depth > MAX_DEPTH) {
		return
	}
	try {
		// Get the symlink target
		const linkTarget = await fs.readlink(symlinkPath)
		// Resolve the target path (relative to the symlink location)
		const resolvedTarget = path.resolve(path.dirname(symlinkPath), linkTarget)

		// Check if the target is a file
		const stats = await fs.stat(resolvedTarget)
		if (stats.isFile()) {
			// For symlinks to files, store the symlink path as original and target as resolved
			fileInfo.push({ originalPath: symlinkPath, resolvedPath: resolvedTarget })
		} else if (stats.isDirectory()) {
			const anotherEntries = await fs.readdir(resolvedTarget, { withFileTypes: true, recursive: true })
			// Collect promises for recursive calls within the directory
			const directoryPromises: Promise<void>[] = []
			for (const anotherEntry of anotherEntries) {
				directoryPromises.push(resolveDirectoryEntry(anotherEntry, resolvedTarget, fileInfo, depth + 1))
			}
			// Wait for all entries in the resolved directory to be processed
			await Promise.all(directoryPromises)
		} else if (stats.isSymbolicLink()) {
			// Handle nested symlinks by awaiting the recursive call
			await resolveSymLink(resolvedTarget, fileInfo, depth + 1)
		}
	} catch (err) {
		// Skip invalid symlinks
	}
}

/**
 * Read all text files from a directory in alphabetical order
 */
async function readTextFilesFromDirectory(dirPath: string): Promise<Array<{ filename: string; content: string }>> {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true })

		// Process all entries - regular files and symlinks that might point to files
		// Store both original path (for sorting) and resolved path (for reading)
		const fileInfo: Array<{ originalPath: string; resolvedPath: string }> = []
		// Collect promises for the initial resolution calls
		const initialPromises: Promise<void>[] = []

		for (const entry of entries) {
			initialPromises.push(resolveDirectoryEntry(entry, dirPath, fileInfo, 0))
		}

		// Wait for all asynchronous operations (including recursive ones) to complete
		await Promise.all(initialPromises)

		const fileContents = await Promise.all(
			fileInfo.map(async ({ originalPath, resolvedPath }) => {
				try {
					// Check if it's a file (not a directory)
					const stats = await fs.stat(resolvedPath)
					if (stats.isFile()) {
						// Filter out cache files and system files that shouldn't be in rules
						if (!shouldIncludeRuleFile(resolvedPath)) {
							return null
						}
						const content = await safeReadFile(resolvedPath)
						// Use resolvedPath for display to maintain existing behavior
						return { filename: resolvedPath, content, sortKey: originalPath }
					}
					return null
				} catch (err) {
					return null
				}
			}),
		)

		// Filter out null values (directories, failed reads, or excluded files)
		const filteredFiles = fileContents.filter(
			(item): item is { filename: string; content: string; sortKey: string } => item !== null,
		)

		// Sort files alphabetically by the original filename (case-insensitive) to ensure consistent order
		// For symlinks, this will use the symlink name, not the target name
		return filteredFiles
			.sort((a, b) => {
				const filenameA = path.basename(a.sortKey).toLowerCase()
				const filenameB = path.basename(b.sortKey).toLowerCase()
				return filenameA.localeCompare(filenameB)
			})
			.map(({ filename, content }) => ({ filename, content }))
	} catch (err) {
		return []
	}
}

/**
 * Format content from multiple files with filenames as headers
 */
function formatDirectoryContent(dirPath: string, files: Array<{ filename: string; content: string }>): string {
	if (files.length === 0) return ""

	return files
		.map((file) => {
			return `# Rules from ${file.filename}:\n${file.content}`
		})
		.join("\n\n")
}

/**
 * Load rule files from global and project-local directories
 * According to documentation: "The system loads rules from ALL applicable directories (both global ~/.roo/ and workspace .roo/)"
 * Rules from both directories are combined, with workspace rules appearing after global rules
 */
export async function loadRuleFiles(cwd: string, language?: string): Promise<string> {
	const rules: string[] = []
	const rooDirectories = getRooDirectoriesForCwd(cwd)

	// Load from ALL applicable directories (both global and workspace)
	// Check for .roo/<lang>/rules/ first, then fallback to .roo/rules/
	for (const rooDir of rooDirectories) {
		const lang = language ? formatLanguage(language) : "en"
		const langRulesDir = (lang && lang !== "en") ? path.join(rooDir, lang, "rules") : ""
		let addedForThisDir = false
		if (langRulesDir && (await directoryExists(langRulesDir))) {
			const files = await readTextFilesFromDirectory(langRulesDir)
			if (files.length > 0) {
				const content = formatDirectoryContent(langRulesDir, files)
				rules.push(content)
				addedForThisDir = true
			}
		}

		const rulesDir = path.join(rooDir, "rules")
		if (!addedForThisDir && (await directoryExists(rulesDir))) {
			const files = await readTextFilesFromDirectory(rulesDir)
			if (files.length > 0) {
				const content = formatDirectoryContent(rulesDir, files)
				rules.push(content)
			}
		}
	}

	// Return combined rules from all directories (global + workspace)
	if (rules.length > 0) {
		return "\n" + rules.join("\n\n")
	}

	// Fall back to existing behavior for legacy .roorules/.clinerules files
	const ruleFiles = [".roorules", ".clinerules"]

	for (const file of ruleFiles) {
		const content = await safeReadFile(path.join(cwd, file))
		if (content) {
			return `\n# Rules from ${file}:\n${content}\n`
		}
	}

	return ""
}



/**
 * Load AGENTS.md file from the project root if it exists
 */
async function loadAgentRulesFile(cwd: string): Promise<string> {
	try {
		const agentsPath = path.join(cwd, "AGENTS.md")
		const content = await safeReadFile(agentsPath)
		if (content) {
			return `# Agent Rules Standard (AGENTS.md):\n${content}`
		}
	} catch (err) {
		// Silently ignore errors - AGENTS.md is optional
	}
	return ""
}

export async function addCustomInstructions(
	modeCustomInstructions: string,
	globalCustomInstructions: string,
	cwd: string,
	mode: string,
	options: {
		language?: string
		rooIgnoreInstructions?: string
		settings?: SystemPromptSettings
		loadBuiltInModeRules?: (mode: string) => Promise<string>
		artifactsInstructions?: string // Инструкции по артефактам из API (для новых ролей)
		useApiDataOnly?: boolean // Если true, не используем встроенные правила (данные из API имеют приоритет)
		skipModeRulesFiles?: boolean // Если true, не загружаем rules-{mode}/ файлы (для экспорта, когда они уже в rulesFiles)
	} = {},
): Promise<string> {
	const sections = []

	// Load mode-specific rules if mode is provided
	let modeRuleContent = ""
	let usedRuleFile = ""

	// Если skipModeRulesFiles=true, пропускаем загрузку mode-specific rules (они уже в rulesFiles при экспорте)
	if (mode && !options.skipModeRulesFiles) {
		const modeRules: string[] = []
		const rooDirectories = getRooDirectoriesForCwd(cwd)
		
		// ⚠️ ВАЖНО: Для новых ролей из API (не встроенных) НЕ используем встроенные правила
		const knownModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
		const isBuiltInMode = knownModes.includes(mode)
		
		// Для новых ролей сначала проверяем rules-newmode/ для дополнительных правил
		// (системный промпт уже загружен в generatePrompt)
		if (!isBuiltInMode) {
			
			// Согласно документации: "The system loads rules from ALL applicable directories (both global ~/.roo/ and workspace .roo/)"
			// Загружаем из обеих директорий: сначала global, затем workspace (workspace имеет приоритет при конфликтах)
			// ВАЖНО: Файлы должны быть отсортированы так, чтобы User Instructions шли первыми, затем инструкции по артефактам
			const newModeRules: string[] = []
			for (const rooDir of rooDirectories) {
				const newModeRulesDir = path.join(rooDir, "rules-newmode")
				if (await directoryExists(newModeRulesDir)) {
					const files = await readTextFilesFromDirectory(newModeRulesDir)
					// Исключаем системный промпт (00_system_prompt.md), так как он уже загружен
					const additionalFiles = files.filter(file => !file.filename.includes("00_system_prompt"))
					
					if (additionalFiles.length > 0) {
						// Сортируем файлы так, чтобы файлы с User Instructions (начинающиеся с 00_ или содержащие "User Instructions") шли первыми
						// Затем идут файлы с инструкциями по артефактам (01_, 02_, и т.д.)
						const sortedFiles = additionalFiles.sort((a, b) => {
							const filenameA = path.basename(a.filename).toLowerCase()
							const filenameB = path.basename(b.filename).toLowerCase()
							
							// Файлы, начинающиеся с 00_ или содержащие "user instructions", идут первыми
							const aIsUserInstructions = filenameA.startsWith("00_") || filenameA.includes("user instructions")
							const bIsUserInstructions = filenameB.startsWith("00_") || filenameB.includes("user instructions")
							
							if (aIsUserInstructions && !bIsUserInstructions) return -1
							if (!aIsUserInstructions && bIsUserInstructions) return 1
							
							// Остальные файлы сортируются по алфавиту (01_, 02_, и т.д.)
							return filenameA.localeCompare(filenameB)
						})
						
						const content = formatDirectoryContent(newModeRulesDir, sortedFiles)
						newModeRules.push(content)
					}
				}
			}
			
			if (newModeRules.length > 0) {
				// Объединяем правила из всех директорий (global + workspace)
				modeRuleContent = "\n" + newModeRules.join("\n\n")
				usedRuleFile = `rules-newmode directory (additional rules)`
			}
			
			// ВАЖНО: Добавляем указание о том, где сохранять артефакты для новых ролей
			// Это предотвращает проблему, когда артефакты сохраняются в .roo/rules-newmode/ вместо рабочей директории
			// Добавляем эту инструкцию только если есть правила из .roo/rules-newmode/, чтобы не дублировать с инструкциями из API
			const artifactSaveInstruction = `\n\n## Сохранение артефактов\n\nВсе артефакты (файлы, диаграммы, документы) должны сохраняться в **рабочую директорию проекта** (${toPosixPath(cwd)}), а НЕ в директорию \`.roo/rules-newmode/\` или любые другие директории \`.roo/\`. Директория \`.roo/rules-newmode/\` используется только для хранения правил и системных промптов, но не для артефактов проекта.\n\nПри создании артефактов используйте пути относительно рабочей директории проекта. Например:\n- \`artifact_name.md\` (в корне проекта)\n- \`docs/artifact_name.md\` (в папке docs)\n- \`reports/artifact_name_report.md\` (в папке reports)\n\nНЕ используйте пути типа \`.roo/rules-newmode/artifact_name.md\` или подобные.\n`
			// Добавляем инструкцию только если есть правила из .roo/rules-newmode/
			// Если инструкции приходят из API, они уже должны содержать эту информацию
			if (modeRuleContent && modeRuleContent.trim()) {
				modeRuleContent += artifactSaveInstruction
			}
			
			// Для новых ролей НЕ загружаем встроенные правила - выходим раньше
			// Для новых ролей system_prompt не используется (его нет в админке)
		} else {
			// Для встроенных режимов проверяем mode-specific правила
			// ВАЖНО: Приоритет проект .roo -> API -> глобальный ~/.roo -> встроенные правила
			// Сначала проверяем проект .roo (если пользователь выгрузил правила)
			// Согласно документации: "The system loads rules from ALL applicable directories (both global ~/.roo/ and workspace .roo/)"
			// Проверяем директории в обратном порядке: проект сначала (имеет приоритет), затем глобальная
			const directoriesToCheck = [...rooDirectories].reverse()
			const lang = options.language ? formatLanguage(options.language) : "en"
			
			for (const rooDir of directoriesToCheck) {
				// Use mode slug directly from API (e.g., code, debug)
				const langModeRulesDir = (lang && lang !== "en") ? path.join(rooDir, lang, `rules-${mode}`) : ""
				let addedForThisDir = false
				if (langModeRulesDir && (await directoryExists(langModeRulesDir))) {
					const files = await readTextFilesFromDirectory(langModeRulesDir)
					if (files.length > 0) {
						const content = formatDirectoryContent(langModeRulesDir, files)
						modeRules.push(content)
						addedForThisDir = true
					}
				}

				const modeRulesDir = path.join(rooDir, `rules-${mode}`)
				if (!addedForThisDir && (await directoryExists(modeRulesDir))) {
					const files = await readTextFilesFromDirectory(modeRulesDir)
					if (files.length > 0) {
						const content = formatDirectoryContent(modeRulesDir, files)
						modeRules.push(content)
					}
				}
			}
			
			// Определяем, были ли правила загружены из проекта .roo
			// Проект - это вторая директория в массиве rooDirectories (после глобальной)
			const hasProjectRooRules = modeRules.length > 0 && rooDirectories.length > 1
			const hasApiData = options.useApiDataOnly || (options.artifactsInstructions && options.artifactsInstructions.trim())
			
			// If we found mode-specific rules in .roo/rules-${mode}/ directories, use them
			// ВАЖНО: Правила из проекта .roo имеют приоритет над API
			if (modeRules.length > 0) {
				modeRuleContent = "\n" + modeRules.join("\n\n")
				usedRuleFile = `rules-${mode} directories`
			}
			
			// Если не нашли правила в .roo, проверяем legacy файлы только если нет данных из API
			if (modeRules.length === 0) {
				const hasApiData = options.useApiDataOnly || (options.artifactsInstructions && options.artifactsInstructions.trim())
				if (!hasApiData) {
				// Fall back to existing behavior for legacy files
				const rooModeRuleFile = `.roorules-${mode}`
				modeRuleContent = await safeReadFile(path.join(cwd, rooModeRuleFile))
				if (modeRuleContent) {
					usedRuleFile = rooModeRuleFile
				} else {
					const clineModeRuleFile = `.clinerules-${mode}`
					modeRuleContent = await safeReadFile(path.join(cwd, clineModeRuleFile))
					if (modeRuleContent) {
						usedRuleFile = clineModeRuleFile
						} else if (options.loadBuiltInModeRules) {
						// Final fallback: try to load built-in rules from extension bundle
							// ⚠️ ВАЖНО: Не используем встроенные правила, если данные пришли из API
						// ⚠️ ВАЖНО: Для новых ролей из API (не встроенных) не используем fallback к встроенным правилам
						// Это предотвращает использование промпта из встроенных режимов для новых ролей
						const knownModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
						const isBuiltInMode = knownModes.includes(mode)
						
							if (isBuiltInMode && !hasApiData) {
							// Только для встроенных режимов и только если нет данных из API используем fallback к встроенным правилам
							const builtInRules = await options.loadBuiltInModeRules(mode)
							if (builtInRules) {
								modeRuleContent = "\n" + builtInRules
								usedRuleFile = `built-in rules-${mode}`
							}
							}
						}
					}
				}
			}
		}
	}

	// Если useRooRulesOnly === true, загружаем только правила из .roo, БЕЗ USER'S CUSTOM INSTRUCTIONS
	if (options.settings?.useRooRulesOnly === true) {
		const rules: string[] = []

		// Add mode-specific rules first if they exist
		if (modeRuleContent && modeRuleContent.trim()) {
			if (usedRuleFile.includes(path.join(".roo", `rules-${mode}`)) || usedRuleFile.includes("rules-newmode")) {
				rules.push(modeRuleContent.trim())
			} else {
				rules.push(`# Rules from ${usedRuleFile}:\n${modeRuleContent}`)
			}
		}

		if (options.rooIgnoreInstructions) {
			rules.push(options.rooIgnoreInstructions)
		}

		// Add AGENTS.md content if enabled (default: true)
		if (options.settings?.useAgentRules !== false) {
			const agentRulesContent = await loadAgentRulesFile(cwd)
			if (agentRulesContent && agentRulesContent.trim()) {
				rules.push(agentRulesContent.trim())
			}
		}

		// Add generic rules
		const genericRuleContent = await loadRuleFiles(cwd, options.language)
		if (genericRuleContent && genericRuleContent.trim()) {
			rules.push(genericRuleContent.trim())
		}

		if (rules.length > 0) {
			const rulesHeader = getSectionLabel("rulesFromRoo", options.language)
			return `====

${rulesHeader}

${rules.join("\n\n")}`
		}

		return ""
	}

	// Обычный режим (useRooRulesOnly === false/undefined): USER'S CUSTOM INSTRUCTIONS БЕЗ правил из .roo
	// Add language preference if provided
	// ВАЖНО: "Language Preference:" остается на английском
	if (options.language) {
		const languageName = getLanguageName(options.language)
		sections.push(
			`Language Preference:\nYou should always speak and think in the "${languageName}" (${options.language}) language unless the user gives you instructions below to do otherwise.`,
		)
	}

	// Add global instructions first (if provided by user)
	if (typeof globalCustomInstructions === "string" && globalCustomInstructions.trim()) {
		const globalInstructionsLabel = getSectionTitle("globalInstructions", options.language)
		sections.push(`${globalInstructionsLabel}\n${globalCustomInstructions.trim()}`)
	}

	// Add mode-specific instructions (prompt content from API/DB)
	// These should go directly without any wrapper - markdown from admin is preserved as-is
	if (typeof modeCustomInstructions === "string" && modeCustomInstructions.trim()) {
		// Don't wrap in any label - the content already has proper markdown from admin
		sections.push(modeCustomInstructions.trim())
	}

	// Add artifacts instructions after prompt content (для новых ролей из API)
	// ⚠️ ВАЖНО: Артефакты выводятся как есть из админки, без автоматических заголовков ##Artifacts
	// Разметка markdown берётся строго из админки
	if (options.artifactsInstructions && typeof options.artifactsInstructions === "string" && options.artifactsInstructions.trim()) {
		// Output artifacts directly - markdown formatting comes from admin as-is
		sections.push(options.artifactsInstructions.trim())
	}

	// В обычном режиме НЕ загружаем правила из .roo
	// Пропускаем всю логику загрузки modeRuleContent, genericRuleContent и т.д.

	const joinedSections = sections.join("\n\n")

	if (joinedSections) {
		// ВАЖНО: "USER'S CUSTOM INSTRUCTIONS" остается на английском
		return `
====

USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

${joinedSections}`
	}
	
	return ""
}

/**
 * Check if a file should be included in rule compilation.
 * Excludes cache files and system files that shouldn't be processed as rules.
 */
function shouldIncludeRuleFile(filename: string): boolean {
	const basename = path.basename(filename)

	const cachePatterns = [
		"*.DS_Store",
		"*.bak",
		"*.cache",
		"*.crdownload",
		"*.db",
		"*.dmp",
		"*.dump",
		"*.eslintcache",
		"*.lock",
		"*.log",
		"*.old",
		"*.part",
		"*.partial",
		"*.pyc",
		"*.pyo",
		"*.stackdump",
		"*.swo",
		"*.swp",
		"*.temp",
		"*.tmp",
		"Thumbs.db",
	]

	return !cachePatterns.some((pattern) => {
		if (pattern.startsWith("*.")) {
			const extension = pattern.slice(1)
			return basename.endsWith(extension)
		} else {
			return basename === pattern
		}
	})
}
