import * as vscode from "vscode"
import { WebviewMessage } from "../../shared/WebviewMessage"
import { defaultModeSlug, getModeBySlug, getGroupName, getAllModes } from "../../shared/modes"
import { buildApiHandler } from "../../api"
import { experiments as experimentsModule, EXPERIMENT_IDS } from "../../shared/experiments"

import { SYSTEM_PROMPT } from "../prompts/system"
import { MultiSearchReplaceDiffStrategy } from "../diff/strategies/multi-search-replace"
import { MultiFileSearchReplaceDiffStrategy } from "../diff/strategies/multi-file-search-replace"

import { ClineProvider } from "./ClineProvider"

export const generateSystemPrompt = async (provider: ClineProvider, message: WebviewMessage, useCacheOnly: boolean = false, forceRefresh: boolean = false) => {
	const {
		apiConfiguration,
		customModePrompts,
		customInstructions,
		browserViewportSize,
		diffEnabled,
		mcpEnabled,
		fuzzyMatchThreshold,
		experiments,
		enableMcpServerCreation,
		browserToolEnabled,
		language,
		maxReadFileLine,
		maxConcurrentFileReads,
	} = await provider.getState()

	// Check experiment to determine which diff strategy to use
	const isMultiFileApplyDiffEnabled = experimentsModule.isEnabled(
		experiments ?? {},
		EXPERIMENT_IDS.MULTI_FILE_APPLY_DIFF,
	)

	const diffStrategy = isMultiFileApplyDiffEnabled
		? new MultiFileSearchReplaceDiffStrategy(fuzzyMatchThreshold)
		: new MultiSearchReplaceDiffStrategy(fuzzyMatchThreshold)

	// Получаем cwd - если пустой, используем workspace folder
	let cwd = provider.cwd
	if (!cwd || cwd.trim() === "") {
		const workspaceFolders = vscode.workspace.workspaceFolders
		if (workspaceFolders && workspaceFolders.length > 0) {
			cwd = workspaceFolders[0].uri.fsPath
		}
	}

	const mode = message.mode ?? defaultModeSlug
	const customModes = await provider.customModesManager.getCustomModes()

	// Загружаем все режимы, включая роли из API, чтобы правильно найти режим
	// При useCacheOnly используем кэшированные роли из globalState и НЕ передаем context,
	// чтобы не триггерить запрос к API в getAllModes
	let cachedApiRoles: Array<{ 
		slug: string
		name: string
		emoji?: string
		target_roles: string[]
		role_definition?: string | Record<string, string>
		short_description?: Record<string, string>
		when_to_use?: Record<string, string>
	}> | undefined = undefined
	
	if (useCacheOnly && provider.context) {
		const cached = provider.context.globalState.get<Array<{ 
			slug: string
			name: string
			emoji?: string
			target_roles: string[]
			role_definition?: string | Record<string, string>
			short_description?: Record<string, string>
			when_to_use?: Record<string, string>
		}>>("cachedApiRoles")
		// Используем кэш только если он существует (не null/undefined)
		// Если кэш пуст, передаем undefined, чтобы getAllModes не делал запрос
		if (cached && cached.length > 0) {
			cachedApiRoles = cached
		}
	}
	// При useCacheOnly не передаем context, чтобы getAllModes не делал запрос к API
	const allModes = await getAllModes(customModes, useCacheOnly ? undefined : provider.context, cachedApiRoles, language)
	const modeConfig = allModes.find((m) => m.slug === mode) || getModeBySlug(mode, customModes)

	const rooIgnoreInstructions = provider.getCurrentCline()?.rooIgnoreController?.getInstructions()

	// Determine if browser tools can be used based on model support, mode, and user settings
	let modelSupportsComputerUse = false

	// Create a temporary API handler to check if the model supports computer use
	// This avoids relying on an active Cline instance which might not exist during preview
	try {
		const tempApiHandler = buildApiHandler(apiConfiguration)
		modelSupportsComputerUse = tempApiHandler.getModel().info.supportsComputerUse ?? false
	} catch (error) {
		console.error("Error checking if model supports computer use:", error)
	}

	// Check if the current mode includes the browser tool group
	const modeSupportsBrowser = modeConfig?.groups.some((group) => getGroupName(group) === "browser") ?? false

	// Only enable browser tools if the model supports it, the mode includes browser tools,
	// and browser tools are enabled in settings
	const canUseBrowserTool = modelSupportsComputerUse && modeSupportsBrowser && (browserToolEnabled ?? true)

	// ⚠️ ВАЖНО: Передаем allModes вместо customModes, чтобы новые роли из API были доступны
	const systemPrompt = await SYSTEM_PROMPT(
		provider.context,
		cwd,
		canUseBrowserTool,
		mcpEnabled ? provider.getMcpHub() : undefined,
		diffStrategy,
		browserViewportSize ?? "900x600",
		mode,
		customModePrompts,
		allModes, // Используем allModes вместо customModes, чтобы включить роли из API
		customInstructions,
		diffEnabled,
		experiments,
		enableMcpServerCreation,
		language,
		rooIgnoreInstructions,
		maxReadFileLine !== -1,
		{
			maxConcurrentFileReads: maxConcurrentFileReads ?? 5,
			todoListEnabled: apiConfiguration?.todoListEnabled ?? true,
			useAgentRules: vscode.workspace.getConfiguration("roo-cline").get<boolean>("useAgentRules") ?? true,
			useRooRulesOnly: vscode.workspace.getConfiguration("roo-cline").get<boolean>("useRooRulesOnly") ?? false,
		},
		undefined, // todoList
		useCacheOnly, // useCacheOnly - использовать только кэш при просмотре системного промпта
		forceRefresh, // forceRefresh - принудительно обновить данные из API
	)

	return systemPrompt
}
