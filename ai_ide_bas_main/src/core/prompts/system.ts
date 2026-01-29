import * as vscode from "vscode"
import * as os from "os"
import * as path from "path"

import type { ModeConfig, PromptComponent, CustomModePrompts, TodoItem } from "@roo-code/types"

import type { SystemPromptSettings } from "./types"

import { Mode, modes, defaultModeSlug, getModeBySlug, getGroupName, getModeSelection } from "../../shared/modes"
import { DiffStrategy } from "../../shared/tools"
import { formatLanguage } from "../../shared/language"
import { isEmpty } from "../../utils/object"

import { McpHub } from "../../services/mcp/McpHub"
import { CodeIndexManager } from "../../services/code-index/manager"
import { loadBuiltInModeRules } from "../../services/builtin-rules"
import { loadPromptFromApi, loadPromptFromApiSeparated } from "../../services/prompt-api-service"
import { getRooDirectoriesForCwd } from "../../services/roo-config"

import { PromptVariables, loadSystemPromptFile } from "./sections/custom-system-prompt"

import { getToolDescriptionsForMode } from "./tools"
import {
	getRulesSection,
	getSystemInfoSection,
	getObjectiveSection,
	getSharedToolUseSection,
	getMcpServersSection,
	getToolUseGuidelinesSection,
	getCapabilitiesSection,
	getModesSection,
	addCustomInstructions,
	markdownFormattingSection,
} from "./sections"
import { promises as fs } from "fs"

// Helper function to get prompt component, filtering out empty objects
export function getPromptComponent(
	customModePrompts: CustomModePrompts | undefined,
	mode: string,
): PromptComponent | undefined {
	const component = customModePrompts?.[mode]
	// Return undefined if component is empty
	if (isEmpty(component)) {
		return undefined
	}
	return component
}

function languagePolicySection(lang: string): string {
    return `====

LANGUAGE POLICY

Always respond and generate all natural-language content and any non-code file text in "${lang}". The language of the instructions below is meta; do not switch your output language unless the user explicitly requests it.`
}

/**
 * Load shared system prompt for new roles from .roo/rules-newmode/ directory
 * This allows using a single system prompt template for all new roles created via admin panel
 */
async function loadNewModeSystemPrompt(cwd: string, language?: string): Promise<string> {
	// If cwd is empty, try to get workspace folder
	let effectiveCwd = cwd
	if (!effectiveCwd || effectiveCwd.trim() === "") {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (workspaceFolders && workspaceFolders.length > 0) {
			effectiveCwd = workspaceFolders[0].uri.fsPath
		} else {
			return ""
		}
	}
	
	const rooDirectories = getRooDirectoriesForCwd(effectiveCwd)
	const lang = language ? formatLanguage(language) : "en"
	
	// Check directories in reverse order: workspace first (takes precedence), then global
	// This matches the documentation: "If there's a conflict, workspace rules take precedence"
	const directoriesToCheck = [...rooDirectories].reverse()
	
	// Check for .roo/<lang>/rules-newmode/ first, then .roo/rules-newmode/
	for (const rooDir of directoriesToCheck) {
		const langNewModeDir = (lang && lang !== "en") ? path.join(rooDir, lang, "rules-newmode") : ""
		let addedForThisDir = false
		
		if (langNewModeDir) {
			try {
				const stats = await fs.stat(langNewModeDir)
				if (stats.isDirectory()) {
					const files = await fs.readdir(langNewModeDir, { withFileTypes: true })
					const textFiles = files
						.filter(entry => entry.isFile() && !entry.name.startsWith("."))
						.map(entry => path.join(langNewModeDir, entry.name))
						.sort()
					
					if (textFiles.length > 0) {
						const contents = await Promise.all(
							textFiles.map(file => fs.readFile(file, "utf-8"))
						)
						const combined = contents.join("\n\n")
						if (combined.trim()) {
							return combined.trim()
						}
					}
					addedForThisDir = true
				}
			} catch (err) {
				// Directory doesn't exist, continue
			}
		}
		
		if (!addedForThisDir) {
			const newModeDir = path.join(rooDir, "rules-newmode")
			try {
				const stats = await fs.stat(newModeDir)
				if (stats.isDirectory()) {
					const files = await fs.readdir(newModeDir, { withFileTypes: true })
					const textFiles = files
						.filter(entry => entry.isFile() && !entry.name.startsWith("."))
						.map(entry => path.join(newModeDir, entry.name))
						.sort()
					
					if (textFiles.length > 0) {
						const contents = await Promise.all(
							textFiles.map(file => fs.readFile(file, "utf-8"))
						)
						const combined = contents.join("\n\n")
						if (combined.trim()) {
							return combined.trim()
						}
					}
				}
			} catch (err) {
				// Directory doesn't exist, continue
			}
		}
	}
	
	return ""
}

/**
 * Load prompts from project .roo and global ~/.roo directories
 * Priority: project .roo > global ~/.roo
 * Returns null if no prompts found in either directory
 */
async function loadPromptsFromRooDirectories(
	cwd: string,
	mode: string,
	modeConfig: ModeConfig,
	language?: string
): Promise<{ systemPrompt: string; customInstructions: string; artifactsInstructions: string } | null> {
	try {
		const { getRooDirectoriesForCwd, getGlobalRooDirectory, getGlobalRooRulesDirectory } = await import("../../services/roo-config")
		// Если cwd пустой, проверяем глобальные директории: ~/.roo/rules и ~/.roo (правила, выгруженные без открытой папки)
		const rooDirectories = cwd ? getRooDirectoriesForCwd(cwd) : [getGlobalRooDirectory(), getGlobalRooRulesDirectory()]
		const lang = language ? formatLanguage(language) : formatLanguage(vscode.env.language)
		const fs = await import("fs/promises")
		
		// Получаем название роли из mode (убираем emoji)
		const roleName = modeConfig.name.replace(/^[\uD83C-\uDBFF\uDC00-\uDFFF]+\s*/, "").trim() || mode
		const cleanRoleName = roleName.replace(/[^a-zA-Z0-9_()\s-]/g, "").replace(/\s+/g, "_")
		
		let systemPrompt = ""
		let customInstructions = ""
		let artifactsInstructions = ""
		
		// Проверяем директории в обратном порядке: проект сначала (имеет приоритет), затем глобальная
		const directoriesToCheck = [...rooDirectories].reverse()
		
		for (const rooDir of directoriesToCheck) {
			const langDirPath = path.join(rooDir, lang)
			// Use mode slug directly from API (e.g., code, debug)
			const modeRulesDir = path.join(langDirPath, `rules-${mode}`)
			
			try {
				// Проверяем, существует ли директория
				const stats = await fs.stat(modeRulesDir)
				if (!stats.isDirectory()) {
					continue
				}
				
				// Загружаем объединенный промпт из rules-{mode}/00_{Role Name}.md
				const combinedPromptFile = path.join(modeRulesDir, `00_${cleanRoleName}.md`)
				
				try {
					const combinedContent = await fs.readFile(combinedPromptFile, "utf-8")
					if (combinedContent && combinedContent.trim()) {
						// Разделяем по разделителю ---
						const parts = combinedContent.split(/\n\n---\n\n/)
						
						if (parts.length >= 2) {
							// Есть разделитель: parts[0] = systemPrompt, parts[1] = customInstructions
							if (parts[0].trim() && !systemPrompt) {
								systemPrompt = parts[0].trim()
							}
							if (parts[1].trim() && !customInstructions) {
								customInstructions = parts[1].trim()
							}
						} else if (parts.length === 1 && parts[0].trim()) {
							// ⚠️ FIX: Нет разделителя - весь контент файла 00_*.md идёт в customInstructions
							// Это исправляет дублирование артефактов: ранее для встроенных режимов (code, architect и т.д.)
							// контент шёл в systemPrompt, а customInstructions оставался пустым,
							// что приводило к загрузке customInstructions из API и дублированию артефактов.
							// Теперь контент всегда идёт в customInstructions, что предотвращает дублирование.
							if (!customInstructions) {
								customInstructions = parts[0].trim()
							}
						}
					}
				} catch (fileErr) {
					// File doesn't exist, continue
				}
				
				// Загружаем artifacts instructions из файлов 01_*.md, 02_*.md и т.д.
				// ВАЖНО: Контент файлов выводится как есть, БЕЗ автоматических заголовков
				// Артефакты располагаются по порядку (01, 02, etc.)
				try {
					const modeFiles = await fs.readdir(modeRulesDir)
					const artifactFiles = modeFiles
						.filter(f => f.endsWith('.md') && /^\d{2}_/.test(f) && f !== `00_${cleanRoleName}.md`)
						.sort()
					
					if (artifactFiles.length > 0 && !artifactsInstructions) {
						const artifactContents: string[] = []
						for (const artifactFile of artifactFiles) {
							try {
								const content = await fs.readFile(path.join(modeRulesDir, artifactFile), "utf-8")
								if (content && content.trim()) {
									// ВАЖНО: Контент файла идёт как есть, БЕЗ автоматических заголовков
									// Разметка уже есть в файле (из админки)
									artifactContents.push(content.trim())
								}
							} catch (err) {
								// Ignore individual file errors
							}
						}
						
						if (artifactContents.length > 0) {
							artifactsInstructions = artifactContents.join("\n\n")
						}
					}
				} catch (dirErr) {
					// Ignore directory read errors
				}
			} catch (statErr) {
				// Directory doesn't exist, continue to next directory
			}
		}
		
		// Возвращаем результат только если хотя бы что-то загрузилось
		if (systemPrompt || customInstructions || artifactsInstructions) {
			return {
				systemPrompt,
				customInstructions,
				artifactsInstructions
			}
		}
		
		return null
	} catch (error) {
		return null
	}
}

async function generatePrompt(
	context: vscode.ExtensionContext,
	cwd: string,
	supportsComputerUse: boolean,
	mode: Mode,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	browserViewportSize?: string,
	promptComponent?: PromptComponent,
	customModeConfigs?: ModeConfig[],
	globalCustomInstructions?: string,
	diffEnabled?: boolean,
	experiments?: Record<string, boolean>,
	enableMcpServerCreation?: boolean,
	language?: string,
	rooIgnoreInstructions?: string,
	partialReadsEnabled?: boolean,
	settings?: SystemPromptSettings,
	todoList?: TodoItem[],
): Promise<string> {
	if (!context) {
		throw new Error("Extension context is required for generating system prompt")
	}

	// If diff is disabled, don't pass the diffStrategy
	const effectiveDiffStrategy = diffEnabled ? diffStrategy : undefined

	// Resolve effective language once
	const effectiveLanguage = language ?? formatLanguage(vscode.env.language)

	// Get the full mode config to ensure we have the role definition (used for groups, etc.)
	// ⚠️ ВАЖНО: customModeConfigs может содержать роли из API (allModes), поэтому сначала проверяем его
	const modeConfig = getModeBySlug(mode, customModeConfigs) || modes.find((m) => m.slug === mode) || modes[0]
	const { roleDefinition, baseInstructions } = getModeSelection(mode, promptComponent, customModeConfigs)

	// Load built-in base instructions from dist/prompts if available
	async function loadBuiltInModeInstructions(context: vscode.ExtensionContext, mode: Mode, language?: string): Promise<string> {
		const base = context.extensionUri
		const lang = language ? formatLanguage(language) : "en"
		
		// Build candidates based on mode and language
		// ⚠️ ВАЖНО: Имена файлов соответствуют slug из БД (code, ask, debug и т.д.)
		let baseCandidates: string[] = []
		switch (mode) {
			case "code":
				baseCandidates = ["code.txt", "code/code.txt"]
				break
			case "architect":
				baseCandidates = ["architect.txt", "architect/architect.txt"]
				break
			case "ask":
				baseCandidates = ["ask.txt", "ask/ask.txt"]
				break
			case "debug":
				baseCandidates = ["debug.txt", "debug/debug.txt"]
				break
			case "designer":
				baseCandidates = ["designer.txt", "designer/designer.txt"]
				break
			case "helper":
				baseCandidates = ["helper.txt", "helper/helper.txt"]
				break
			case "pm":
				baseCandidates = ["pm.txt", "pm/pm.txt"]
				break
			default:
		return ""
	}

		// Build full candidate list with language fallbacks
		const candidates: string[] = []
		// Try language-specific first (if not English)
		if (lang && lang !== "en") {
			for (const candidate of baseCandidates) {
				candidates.push(`dist/prompts/${lang}/${candidate}`)
			}
		}
		// Then English fallback
		for (const candidate of baseCandidates) {
			candidates.push(`dist/prompts/en/${candidate}`)
		}
		// Finally legacy location
		for (const candidate of baseCandidates) {
			candidates.push(`dist/prompts/${candidate}`)
		}
		
		for (const rel of candidates) {
			try {
				const uri = vscode.Uri.joinPath(base, ...rel.split("/"))
				const content = await fs.readFile(uri.fsPath, "utf-8")
				const trimmed = content.trim()
				if (trimmed) {
					return trimmed
				}
			} catch (err) {
				// Silent fail, try next candidate
			}
		}
		return ""
	}

	// Проверяем, является ли это новой ролью из API (не встроенной)
	const knownModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
	const isBuiltInMode = knownModes.includes(mode)
	
	// Сначала пытаемся загрузить из API
	// ⚠️ В тестовой ветке используется тестовый API (api-test.aiidebas.com)
	// API URL определяется через AIIDEBAS_PROMPTS_API_BASE_URL из constants.ts
	let effectiveBaseInstructions = ""
	let apiPromptLoaded = false
	// Объявляем rooPrompts в начале функции для использования во всей функции
	let rooPrompts: { systemPrompt: string; customInstructions: string; artifactsInstructions: string } | null = null
	
	// Для новых ролей сначала проверяем .roo/rules-newmode/, затем API
	// Для встроенных ролей сначала API, затем встроенные правила
	let apiCustomInstructions = "" // Для новых ролей: основные инструкции из API (role, project, tasks)
	let apiArtifactsInstructions = "" // Для новых ролей: инструкции по артефактам из API (instructions с полями)
	
	if (!isBuiltInMode) {
		// ✅ FIX: Для новых ролей сначала проверяем project .roo (имеет приоритет над API),
		// чтобы выгруженные пользователем правила применялись сразу, а не только после явного запроса.
		console.log(`[SystemPrompt] 🔍 Loading data for NEW role: mode=${mode}, language=${language}`)
		
		rooPrompts = await loadPromptsFromRooDirectories(cwd, mode, modeConfig, language ?? effectiveLanguage)
		console.log(`[SystemPrompt] 🔍 rooPrompts for NEW role:`, rooPrompts ? {
			hasSystemPrompt: !!rooPrompts.systemPrompt,
			systemPromptLength: rooPrompts.systemPrompt?.length || 0,
			hasCustomInstructions: !!rooPrompts.customInstructions,
			customInstructionsLength: rooPrompts.customInstructions?.length || 0,
			hasArtifactsInstructions: !!rooPrompts.artifactsInstructions,
			artifactsInstructionsLength: rooPrompts.artifactsInstructions?.length || 0,
		} : "null")
		
		if (rooPrompts) {
			// NOTE: systemPromptSection сейчас не используется, поэтому чтобы не терять контент файла,
			// склеиваем systemPrompt + customInstructions в единый блок инструкций.
			const localSystemPrompt = rooPrompts.systemPrompt?.trim() || ""
			const localCustomInstructions = rooPrompts.customInstructions?.trim() || ""
			const mergedLocalCustomInstructions = [localSystemPrompt, localCustomInstructions].filter(Boolean).join("\n\n")
			
			if (mergedLocalCustomInstructions && !apiCustomInstructions) {
				apiCustomInstructions = mergedLocalCustomInstructions
				apiPromptLoaded = true
				console.log(`[SystemPrompt] ✅ NEW role: custom instructions loaded from project .roo, length=${apiCustomInstructions.length}`)
			}
			
			if (rooPrompts.artifactsInstructions && rooPrompts.artifactsInstructions.trim() && !apiArtifactsInstructions) {
				apiArtifactsInstructions = rooPrompts.artifactsInstructions.trim()
				apiPromptLoaded = true
				console.log(`[SystemPrompt] ✅ NEW role: artifacts instructions loaded from project .roo, length=${apiArtifactsInstructions.length}`)
			}
		}
		
		// Если не всё найдено в project .roo — догружаем из API/кэша.
		const needsApiData = !apiCustomInstructions || !apiArtifactsInstructions
		if (needsApiData) {
			console.log(`[SystemPrompt] 🔍 Fetching from API for NEW role: mode=${mode}, needsApiData=${needsApiData}`)
			try {
				const apiPromptData = await loadPromptFromApiSeparated(mode, language ?? effectiveLanguage, undefined, context, false)
				console.log(`[SystemPrompt] 🔍 API response for NEW role:`, apiPromptData ? {
					hasSystemPrompt: !!apiPromptData.systemPrompt,
					systemPromptLength: apiPromptData.systemPrompt?.length || 0,
					hasCustomInstructions: !!apiPromptData.customInstructions,
					customInstructionsLength: apiPromptData.customInstructions?.length || 0,
					hasArtifactsInstructions: !!apiPromptData.artifactsInstructions,
					artifactsInstructionsLength: apiPromptData.artifactsInstructions?.length || 0,
				} : "null")
				if (apiPromptData) {
					// Для новых ролей system_prompt не используется (его нет в админке)
					// role, project, tasks, instructions.content идут в custom instructions
					if (apiPromptData.customInstructions && apiPromptData.customInstructions.trim() && !apiCustomInstructions) {
						apiCustomInstructions = apiPromptData.customInstructions.trim()
						apiPromptLoaded = true
						console.log(`[SystemPrompt] ✅ NEW role: apiCustomInstructions loaded, length=${apiCustomInstructions.length}`)
					}
					
					// instructions (артефакты) идут в отдельную секцию Artifacts
					if (apiPromptData.artifactsInstructions && apiPromptData.artifactsInstructions.trim() && !apiArtifactsInstructions) {
						apiArtifactsInstructions = apiPromptData.artifactsInstructions.trim()
						apiPromptLoaded = true
						console.log(`[SystemPrompt] ✅ NEW role: apiArtifactsInstructions loaded, length=${apiArtifactsInstructions.length}`)
					}
				}
			} catch (error) {
				// API недоступен, продолжаем без API данных
				console.warn(`[SystemPrompt] ⚠️ API error for NEW role:`, error)
			}
		}
		
		// Для новых ролей effectiveBaseInstructions всегда пустой
		effectiveBaseInstructions = ""
	} else {
		// Для встроенных ролей: приоритет проект .roo -> API/кэш -> ~/.roo -> встроенные правила
		// ВАЖНО: Если пользователь выгрузил правила в проект, они имеют приоритет над API
		// ВАЖНО: Если данные есть в API (или в кэше) и нет в проекте - используем API
		// ВАЖНО: Если API недоступен и кэш устарел - используем встроенные правила (fallback)
		console.log(`[SystemPrompt] 🔍 Loading data for BUILT-IN role: mode=${mode}, language=${language}`)
		
		// СНАЧАЛА проверяем проект .roo (если пользователь выгрузил правила)
		// Сохраняем результат для использования позже
		rooPrompts = await loadPromptsFromRooDirectories(cwd, mode, modeConfig, language)
		console.log(`[SystemPrompt] 🔍 rooPrompts from project .roo:`, rooPrompts ? {
			hasSystemPrompt: !!rooPrompts.systemPrompt,
			systemPromptLength: rooPrompts.systemPrompt?.length || 0,
			hasCustomInstructions: !!rooPrompts.customInstructions,
			customInstructionsLength: rooPrompts.customInstructions?.length || 0,
			hasArtifactsInstructions: !!rooPrompts.artifactsInstructions,
			artifactsInstructionsLength: rooPrompts.artifactsInstructions?.length || 0,
		} : "null")
		if (rooPrompts) {
			if (rooPrompts.systemPrompt && rooPrompts.systemPrompt.trim()) {
				effectiveBaseInstructions = rooPrompts.systemPrompt.trim()
				apiPromptLoaded = true
			}
			
			if (rooPrompts.customInstructions && rooPrompts.customInstructions.trim()) {
				apiCustomInstructions = rooPrompts.customInstructions.trim()
				apiPromptLoaded = true
			}
			
			if (rooPrompts.artifactsInstructions && rooPrompts.artifactsInstructions.trim()) {
				apiArtifactsInstructions = rooPrompts.artifactsInstructions.trim()
				apiPromptLoaded = true
			}
		}
		
		// Если не загрузили из проекта .roo или не все данные загружены, проверяем API/кэш
		// ВАЖНО: Загружаем из API, если customInstructions или artifactsInstructions не загружены из проекта .roo
		const needsApiData = !apiPromptLoaded || !apiCustomInstructions || !apiArtifactsInstructions
		console.log(`[SystemPrompt] 🔍 needsApiData=${needsApiData}, apiPromptLoaded=${apiPromptLoaded}, apiCustomInstructions=${!!apiCustomInstructions} (${apiCustomInstructions?.length || 0}), apiArtifactsInstructions=${!!apiArtifactsInstructions} (${apiArtifactsInstructions?.length || 0})`)
		if (needsApiData) {
			console.log(`[SystemPrompt] 🔍 Fetching from API for BUILT-IN role: mode=${mode}`)
			try {
				const apiPromptData = await loadPromptFromApiSeparated(mode, language, undefined, context, false)
				console.log(`[SystemPrompt] 🔍 API response for BUILT-IN role:`, apiPromptData ? {
					hasSystemPrompt: !!apiPromptData.systemPrompt,
					systemPromptLength: apiPromptData.systemPrompt?.length || 0,
					hasCustomInstructions: !!apiPromptData.customInstructions,
					customInstructionsLength: apiPromptData.customInstructions?.length || 0,
					hasArtifactsInstructions: !!apiPromptData.artifactsInstructions,
					artifactsInstructionsLength: apiPromptData.artifactsInstructions?.length || 0,
				} : "null")
			if (apiPromptData) {
				// system_prompt идет в системный промпт
				if (apiPromptData.systemPrompt && apiPromptData.systemPrompt.trim() && !effectiveBaseInstructions) {
					effectiveBaseInstructions = apiPromptData.systemPrompt.trim()
					apiPromptLoaded = true
				}
				
				// role, project, tasks идут в custom instructions
				// ВАЖНО: Загружаем из API только если не загружено из проекта .roo
				if (apiPromptData.customInstructions && apiPromptData.customInstructions.trim() && !apiCustomInstructions) {
					apiCustomInstructions = apiPromptData.customInstructions.trim()
					apiPromptLoaded = true
				}
				
				// instructions (артефакты) идут в отдельную секцию Artifacts
				// ВАЖНО: Загружаем из API только если не загружено из проекта .roo
				if (apiPromptData.artifactsInstructions && apiPromptData.artifactsInstructions.trim() && !apiArtifactsInstructions) {
					apiArtifactsInstructions = apiPromptData.artifactsInstructions.trim()
					apiPromptLoaded = true
				}
				
				// Если хотя бы что-то загрузилось из API/кэша, помечаем что API данные есть
				if (effectiveBaseInstructions || apiCustomInstructions || apiArtifactsInstructions) {
					apiPromptLoaded = true
				}
			} else {
				// API вернул null - либо нет данных, либо API недоступен и кэш устарел
				// Пытаемся загрузить из глобального ~/.roo (fallback после API)
				const globalRooPrompts = await loadPromptsFromRooDirectories("", mode, modeConfig, language)
				if (globalRooPrompts) {
					if (globalRooPrompts.systemPrompt && globalRooPrompts.systemPrompt.trim() && !effectiveBaseInstructions) {
						effectiveBaseInstructions = globalRooPrompts.systemPrompt.trim()
						apiPromptLoaded = true
					}
					
					if (globalRooPrompts.customInstructions && globalRooPrompts.customInstructions.trim() && !apiCustomInstructions) {
						apiCustomInstructions = globalRooPrompts.customInstructions.trim()
						apiPromptLoaded = true
					}
					
					if (globalRooPrompts.artifactsInstructions && globalRooPrompts.artifactsInstructions.trim() && !apiArtifactsInstructions) {
						apiArtifactsInstructions = globalRooPrompts.artifactsInstructions.trim()
						apiPromptLoaded = true
					}
				}
			}
			} catch (error) {
				// Ошибка при загрузке из API - проверяем глобальный ~/.roo как fallback
				const globalRooPrompts = await loadPromptsFromRooDirectories("", mode, modeConfig, language)
				if (globalRooPrompts) {
					if (globalRooPrompts.systemPrompt && globalRooPrompts.systemPrompt.trim() && !effectiveBaseInstructions) {
						effectiveBaseInstructions = globalRooPrompts.systemPrompt.trim()
						apiPromptLoaded = true
					}
					
					if (globalRooPrompts.customInstructions && globalRooPrompts.customInstructions.trim() && !apiCustomInstructions) {
						apiCustomInstructions = globalRooPrompts.customInstructions.trim()
						apiPromptLoaded = true
					}
					
					if (globalRooPrompts.artifactsInstructions && globalRooPrompts.artifactsInstructions.trim() && !apiArtifactsInstructions) {
						apiArtifactsInstructions = globalRooPrompts.artifactsInstructions.trim()
						apiPromptLoaded = true
					}
				}
			}
		}
		
		// Если ничего не загрузилось, проверяем dist/prompts перед fallback к встроенным промптам
		if (!apiPromptLoaded) {
			// СНАЧАЛА пытаемся загрузить из dist/prompts (расширение)
			const distPromptsPath = path.join(context.extensionPath, "dist", "prompts")
			let distPrompts: { systemPrompt: string; customInstructions: string; artifactsInstructions: string } | null = null
			try {
				// Используем ту же логику, что и для .roo, но для dist/prompts
				const lang = language ? formatLanguage(language) : "en"
				const langDirPath = path.join(distPromptsPath, lang)
				const modeRulesDir = path.join(langDirPath, `rules-${mode}`)
				const fs = await import("fs/promises")
				
				const stats = await fs.stat(modeRulesDir).catch(() => null)
				if (stats && stats.isDirectory()) {
					let systemPrompt = ""
					let customInstructions = ""
					let artifactsInstructions = ""
					
					try {
						// Ищем любой файл начинающийся с 00_ (основной промпт роли)
						const modeFiles = await fs.readdir(modeRulesDir)
						const mainPromptFile = modeFiles.find(f => f.startsWith('00_') && f.endsWith('.md'))
						
						if (mainPromptFile) {
							const combinedContent = await fs.readFile(path.join(modeRulesDir, mainPromptFile), "utf-8")
							if (combinedContent && combinedContent.trim()) {
								const parts = combinedContent.split(/\n\n---\n\n/)
								if (parts.length >= 2) {
									systemPrompt = parts[0].trim()
									customInstructions = parts[1].trim()
								} else if (parts.length === 1 && parts[0].trim()) {
									customInstructions = parts[0].trim()
								}
							}
						}
						
						// Артефакты - все файлы 01_*, 02_*, ... (кроме 00_*)
						const artifactFiles = modeFiles
							.filter(f => f.endsWith('.md') && /^0[1-9]_|^[1-9]\d*_/.test(f))
							.sort()
						
						if (artifactFiles.length > 0) {
							const artifactContents: string[] = []
							for (const artifactFile of artifactFiles) {
								try {
									const content = await fs.readFile(path.join(modeRulesDir, artifactFile), "utf-8")
									if (content && content.trim()) {
										artifactContents.push(content.trim())
									}
								} catch (err) {
									// Ignore
								}
							}
							if (artifactContents.length > 0) {
								artifactsInstructions = artifactContents.join("\n\n")
							}
						}
					} catch (dirErr) {
						// Ignore
					}
					
					if (systemPrompt || customInstructions || artifactsInstructions) {
						distPrompts = { systemPrompt, customInstructions, artifactsInstructions }
					}
				}
			} catch (err) {
				// Ignore errors
			}
			
			if (distPrompts) {
				if (distPrompts.systemPrompt && distPrompts.systemPrompt.trim() && !effectiveBaseInstructions) {
					effectiveBaseInstructions = distPrompts.systemPrompt.trim()
					apiPromptLoaded = true
				}
				if (distPrompts.customInstructions && distPrompts.customInstructions.trim() && !apiCustomInstructions) {
					apiCustomInstructions = distPrompts.customInstructions.trim()
					apiPromptLoaded = true
				}
				if (distPrompts.artifactsInstructions && distPrompts.artifactsInstructions.trim() && !apiArtifactsInstructions) {
					apiArtifactsInstructions = distPrompts.artifactsInstructions.trim()
					apiPromptLoaded = true
				}
				if (apiPromptLoaded) {
					console.log(`[PromptAPI] Loaded prompts from dist/prompts for mode=${mode}`)
				}
			}
			
			// Если все еще ничего не загрузилось, используем встроенные промпты как последний fallback
			if (!apiPromptLoaded) {
				const hasExportedBefore = context.globalState.get<boolean>("promptsExportedFromApi")
				let hasDistPrompts = false
				try {
					const stats = await fs.stat(distPromptsPath).catch(() => null)
					if (stats && stats.isDirectory()) {
						const contents = await fs.readdir(distPromptsPath).catch(() => [])
						const lang = language ? formatLanguage(language) : "en"
						const langDir = path.join(distPromptsPath, lang)
						const langStats = await fs.stat(langDir).catch(() => null)
						if (langStats && langStats.isDirectory()) {
							const modeFiles = await fs.readdir(langDir).catch(() => [] as string[])
							const modeDir = `rules-${mode}`
							hasDistPrompts = modeFiles.includes(modeDir)
						}
					}
				} catch (err) {
					// Ignore errors
				}
				
				if (!hasExportedBefore && !hasDistPrompts) {
					effectiveBaseInstructions = ""
					console.log(`[PromptAPI] First install, no exported prompts yet, using empty string instead of built-in`)
				} else if (hasDistPrompts) {
					console.warn(`[PromptAPI] Prompts exist in dist/prompts but failed to load, using empty string`)
					effectiveBaseInstructions = ""
				} else {
					console.log(`[PromptAPI] Using built-in prompts as fallback (export completed but files missing)`)
					const builtInModeInstructions = await loadBuiltInModeInstructions(context, mode, language)
					effectiveBaseInstructions = builtInModeInstructions
				}
			}
		}
	}

	// Check if MCP functionality should be included
	const hasMcpGroup = modeConfig.groups.some((groupEntry) => getGroupName(groupEntry) === "mcp")
	const hasMcpServers = mcpHub && mcpHub.getServers().length > 0
	const shouldIncludeMcp = hasMcpGroup && hasMcpServers

	const [modesSection, mcpServersSection] = await Promise.all([
		getModesSection(context),
		shouldIncludeMcp
			? getMcpServersSection(mcpHub, effectiveDiffStrategy, enableMcpServerCreation)
			: Promise.resolve(""),
	])

	const codeIndexManager = CodeIndexManager.getInstance(context)

	// ВАЖНО: systemPromptSection убран - для новых ролей его нет в админке, для встроенных ролей
	// используются встроенные правила как fallback (но они уже включены в другие секции)
	// effectiveBaseInstructions используется только для встроенных ролей как fallback

	// Объединяем apiCustomInstructions с изменениями из админки (promptComponent)
	const modeCustomInstructionsFromAdmin = promptComponent?.customInstructions || ""
	// Если есть и API инструкции, и изменения из админки - объединяем их
	const combinedModeCustomInstructions = modeCustomInstructionsFromAdmin
		? (apiCustomInstructions ? `${apiCustomInstructions}\n\n${modeCustomInstructionsFromAdmin}` : modeCustomInstructionsFromAdmin)
		: (apiCustomInstructions || "")

	// 🔍 DEBUG: Логируем что будет передано в addCustomInstructions
	console.log(`[SystemPrompt] 🔍 USER'S CUSTOM INSTRUCTIONS input:`, {
		mode,
		language: effectiveLanguage,
		promptComponentCustomInstructions: modeCustomInstructionsFromAdmin?.length || 0,
		apiCustomInstructions: apiCustomInstructions?.length || 0,
		combinedModeCustomInstructions: combinedModeCustomInstructions?.length || 0,
		globalCustomInstructions: (globalCustomInstructions || "").length || 0,
		apiArtifactsInstructions: apiArtifactsInstructions?.length || 0,
	})

	// Генерируем секцию "USER'S CUSTOM INSTRUCTIONS" с учетом всех изменений
	// ВАЖНО: Приоритет проект .roo -> API -> глобальный ~/.roo -> встроенные правила
	// Проверяем, были ли промпты загружены из проекта .roo (если да, они имеют приоритет над API)
	// Используем уже загруженные rooPrompts, если они есть
	if (!rooPrompts) {
		rooPrompts = await loadPromptsFromRooDirectories(cwd, mode, modeConfig, language)
	}
	const hasProjectRooPrompts = rooPrompts && !!(rooPrompts.systemPrompt || rooPrompts.customInstructions || rooPrompts.artifactsInstructions)
	const hasApiData = !hasProjectRooPrompts && (apiPromptLoaded || !!(apiCustomInstructions || apiArtifactsInstructions))
	
	const customInstructionsSection = await addCustomInstructions(
		combinedModeCustomInstructions,
		globalCustomInstructions || "",
		cwd,
		mode,
		{
			language: effectiveLanguage,
			rooIgnoreInstructions,
			settings,
			loadBuiltInModeRules,
			artifactsInstructions: apiArtifactsInstructions || "",
			useApiDataOnly: hasApiData, // Если есть данные из API и НЕТ промптов из проекта .roo, не используем правила из .roo
		}
	)

	const basePrompt = `${languagePolicySection(effectiveLanguage)}

${roleDefinition}

${markdownFormattingSection()}

${getSharedToolUseSection()}

${getToolDescriptionsForMode(
		mode,
		cwd,
		supportsComputerUse,
		codeIndexManager,
		effectiveDiffStrategy,
		browserViewportSize,
		shouldIncludeMcp ? mcpHub : undefined,
		customModeConfigs,
		experiments,
		partialReadsEnabled,
		settings,
		effectiveLanguage,
	)}

${getToolUseGuidelinesSection(codeIndexManager)}

${mcpServersSection}

${getCapabilitiesSection(cwd, supportsComputerUse, shouldIncludeMcp ? mcpHub : undefined, effectiveDiffStrategy, codeIndexManager)}

${modesSection}

${getRulesSection(cwd, supportsComputerUse, effectiveDiffStrategy, codeIndexManager)}

${getSystemInfoSection(cwd)}

${getObjectiveSection(codeIndexManager, experiments)}

${customInstructionsSection}`

	return basePrompt
}

export const SYSTEM_PROMPT = async (
	context: vscode.ExtensionContext,
	cwd: string,
	supportsComputerUse: boolean,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	browserViewportSize?: string,
	mode: Mode = defaultModeSlug,
	customModePrompts?: CustomModePrompts,
	customModes?: ModeConfig[],
	globalCustomInstructions?: string,
	diffEnabled?: boolean,
	experiments?: Record<string, boolean>,
	enableMcpServerCreation?: boolean,
	language?: string,
	rooIgnoreInstructions?: string,
	partialReadsEnabled?: boolean,
	settings?: SystemPromptSettings,
	todoList?: TodoItem[],
): Promise<string> => {
	if (!context) {
		throw new Error("Extension context is required for generating system prompt")
	}
	
	const effectiveLanguage = language ?? formatLanguage(vscode.env.language)

	// Try to load custom system prompt from file
	const variablesForPrompt: PromptVariables = {
		workspace: cwd,
		mode: mode,
		language: language ?? formatLanguage(vscode.env.language),
		shell: vscode.env.shell,
		operatingSystem: os.type(),
	}
	const fileCustomSystemPrompt = await loadSystemPromptFile(cwd, mode, variablesForPrompt)

	// Check if it's a custom mode
	const promptComponent = getPromptComponent(customModePrompts, mode)

	// Get full mode config from custom modes or fall back to built-in modes
	const currentMode = getModeBySlug(mode, customModes) || modes.find((m) => m.slug === mode) || modes[0]

	// If a file-based custom system prompt exists, use it
	if (fileCustomSystemPrompt) {
		const { roleDefinition } = getModeSelection(
			mode,
			promptComponent,
			customModes,
		)

		const customInstructions = await addCustomInstructions(
			"",
			globalCustomInstructions || "",
			cwd,
			mode,
			{
				language: language ?? formatLanguage(vscode.env.language),
				rooIgnoreInstructions,
				settings,
				loadBuiltInModeRules,
			},
		)

		// For file-based prompts, don't include the tool sections
		return `${roleDefinition}

${fileCustomSystemPrompt}

${customInstructions}`
	}

	// If diff is disabled, don't pass the diffStrategy
	const effectiveDiffStrategy = diffEnabled ? diffStrategy : undefined

	// ⚠️ ВАЖНО: Используем исходный mode, а не currentMode.slug, чтобы сохранить правильный режим для новых ролей
	// currentMode.slug может быть fallback на modes[0] (code), если режим не найден
	return generatePrompt(
		context,
		cwd,
		supportsComputerUse,
		mode,
		mcpHub,
		effectiveDiffStrategy,
		browserViewportSize,
		promptComponent,
		customModes,
		globalCustomInstructions,
		diffEnabled,
		experiments,
		enableMcpServerCreation,
		language,
		rooIgnoreInstructions,
		partialReadsEnabled,
		settings,
		todoList,
	)
}
