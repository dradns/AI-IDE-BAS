import * as vscode from "vscode"
import * as os from "os"

import type { ModeConfig, PromptComponent, CustomModePrompts, TodoItem } from "@roo-code/types"

import type { SystemPromptSettings } from "./types"

import { Mode, modes, defaultModeSlug, getModeBySlug, getGroupName, getModeSelection } from "../../shared/modes"
import { DiffStrategy } from "../../shared/tools"
import { formatLanguage } from "../../shared/language"
import { isEmpty } from "../../utils/object"

import { McpHub } from "../../services/mcp/McpHub"
import { CodeIndexManager } from "../../services/code-index/manager"
import { loadBuiltInModeRules } from "../../services/builtin-rules"

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
	const modeConfig = getModeBySlug(mode, customModeConfigs) || modes.find((m) => m.slug === mode) || modes[0]
	const { roleDefinition, baseInstructions } = getModeSelection(mode, promptComponent, customModeConfigs)

	// Load built-in base instructions from dist/prompts if available
	async function loadBuiltInModeInstructions(context: vscode.ExtensionContext, mode: Mode, language?: string): Promise<string> {
		const base = context.extensionUri
		const lang = language ? formatLanguage(language) : "en"
		
		// Build candidates based on mode and language
		let baseCandidates: string[] = []
		switch (mode) {
			case "code":
				baseCandidates = ["ba.txt", "BA/ba.txt"]
				break
			case "architect":
				baseCandidates = ["architect.txt", "Architect/architect.txt"]
				break
			case "ask":
				baseCandidates = ["sa.txt", "SA/SA.txt"]
				break
			case "debug":
				baseCandidates = ["review.txt", "Reviewer/reviewer.txt"]
				break
			case "designer":
				baseCandidates = ["designer.txt", "Designer/designer.txt"]
				break
			case "helper":
				baseCandidates = ["helper.txt", "Helper/helper.txt"]
				break
			case "pm":
				baseCandidates = ["pm.txt", "PM/pm.txt"]
				break
			default:
				console.warn(`[loadBuiltInModeInstructions] Unknown mode: ${mode}`)
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

		console.log(`[loadBuiltInModeInstructions] mode=${mode}, lang=${lang}, trying ${candidates.length} candidates`)
		
		for (const rel of candidates) {
			try {
				const uri = vscode.Uri.joinPath(base, ...rel.split("/"))
				const content = await fs.readFile(uri.fsPath, "utf-8")
				const trimmed = content.trim()
				if (trimmed) {
					console.log(`[loadBuiltInModeInstructions] SUCCESS: loaded from ${rel}, length=${trimmed.length}`)
					return trimmed
				}
			} catch (err) {
				// Silent fail, try next candidate
			}
		}
		console.warn(`[loadBuiltInModeInstructions] FAILED: no prompt found for mode=${mode}, lang=${lang}`)
		return ""
	}

	const builtInModeInstructions = await loadBuiltInModeInstructions(context, mode, language)
	const effectiveBaseInstructions = builtInModeInstructions

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

${await addCustomInstructions(effectiveBaseInstructions, globalCustomInstructions || "", cwd, mode, {
		language: effectiveLanguage,
		rooIgnoreInstructions,
		settings,
		loadBuiltInModeRules,
	})}`

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
	console.log(`[SYSTEM_PROMPT] mode=${mode}, language=${effectiveLanguage}, cwd=${cwd}`)

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

	return generatePrompt(
		context,
		cwd,
		supportsComputerUse,
		currentMode.slug,
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
