import * as vscode from "vscode"
import delay from "delay"

import type { CommandId } from "@roo-code/types"
import { TelemetryService } from "@roo-code/telemetry"

import { Package } from "../shared/package"
import { getCommand } from "../utils/commands"
import { ClineProvider } from "../core/webview/ClineProvider"
import { ContextProxy } from "../core/config/ContextProxy"
import { focusPanel } from "../utils/focusPanel"

import { registerHumanRelayCallback, unregisterHumanRelayCallback, handleHumanRelayResponse } from "./humanRelay"
import { handleNewTask } from "./handleTask"
import { CodeIndexManager } from "../services/code-index/manager"
import { importSettingsWithFeedback } from "../core/config/importExport"
import { MdmService } from "../services/mdm/MdmService"
import { t } from "../i18n"
import { exportMarkdownToPdf } from "../integrations/misc/export-markdown-to-pdf"
import * as path from "path"
import * as fs from "fs/promises"
import { loadModeInfo } from "../services/mode-info-loader"
import { clearPromptCache, refreshAllPromptsFromApi } from "../services/prompt-api-service"
import { formatLanguage } from "../shared/language"

/**
 * Helper to get the visible ClineProvider instance or log if not found.
 */
export function getVisibleProviderOrLog(outputChannel: vscode.OutputChannel): ClineProvider | undefined {
	const visibleProvider = ClineProvider.getVisibleInstance()
	if (!visibleProvider) {
		outputChannel.appendLine("Cannot find any visible AI IDE BAS instances.")
		return undefined
	}
	return visibleProvider
}

// Store panel references in both modes
let sidebarPanel: vscode.WebviewView | undefined = undefined
let tabPanel: vscode.WebviewPanel | undefined = undefined

/**
 * Get the currently active panel
 * @returns WebviewPanel或WebviewView
 */
export function getPanel(): vscode.WebviewPanel | vscode.WebviewView | undefined {
	return tabPanel || sidebarPanel
}

/**
 * Set panel references
 */
export function setPanel(
	newPanel: vscode.WebviewPanel | vscode.WebviewView | undefined,
	type: "sidebar" | "tab",
): void {
	if (type === "sidebar") {
		sidebarPanel = newPanel as vscode.WebviewView
		tabPanel = undefined
	} else {
		tabPanel = newPanel as vscode.WebviewPanel
		sidebarPanel = undefined
	}
}

export type RegisterCommandOptions = {
	context: vscode.ExtensionContext
	outputChannel: vscode.OutputChannel
	provider: ClineProvider
}

export const registerCommands = (options: RegisterCommandOptions) => {
	const { context } = options

	for (const [id, callback] of Object.entries(getCommandsMap(options))) {
		const command = getCommand(id as CommandId)
		context.subscriptions.push(vscode.commands.registerCommand(command, callback))
	}
}

const getCommandsMap = ({ context, outputChannel, provider }: RegisterCommandOptions): Record<CommandId, any> => ({
	activationCompleted: () => {},
	accountButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("account")

		visibleProvider.postMessageToWebview({ type: "action", action: "accountButtonClicked" })
	},
	plusButtonClicked: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("plus")

		await visibleProvider.removeClineFromStack()
		await visibleProvider.postStateToWebview()
		await visibleProvider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })
	},
	mcpButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("mcp")

		visibleProvider.postMessageToWebview({ type: "action", action: "mcpButtonClicked" })
	},
	promptsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("prompts")

		visibleProvider.postMessageToWebview({ type: "action", action: "promptsButtonClicked" })
	},
	popoutButtonClicked: () => {
		TelemetryService.instance.captureTitleButtonClicked("popout")

		return openClineInNewTab({ context, outputChannel })
	},
	openInNewTab: () => openClineInNewTab({ context, outputChannel }),
	settingsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("settings")

		visibleProvider.postMessageToWebview({ type: "action", action: "settingsButtonClicked" })
		// Also explicitly post the visibility message to trigger scroll reliably
		visibleProvider.postMessageToWebview({ type: "action", action: "didBecomeVisible" })
	},
	showWelcome: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		// Navigate explicitly to the Welcome tab by sending an action the App understands
		visibleProvider.postMessageToWebview({ type: "action", action: "switchTab", tab: "settings" })
		// And target the providers section to mimic welcome configuration area
		visibleProvider.postMessageToWebview({ type: "action", action: "settingsButtonClicked" })
	},
	historyButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("history")

		visibleProvider.postMessageToWebview({ type: "action", action: "historyButtonClicked" })
	},
	marketplaceButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return
		visibleProvider.postMessageToWebview({ type: "action", action: "marketplaceButtonClicked" })
	},
	filesButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		TelemetryService.instance.captureTitleButtonClicked("files")

		visibleProvider.postMessageToWebview({ type: "action", action: "filesButtonClicked" })
	},
	exportRoleInstructions: async () => {
		try {
			const visibleProvider = getVisibleProviderOrLog(outputChannel)
			if (!visibleProvider) return

			const workspaceRoot = visibleProvider.cwd || (await import("../utils/path")).getWorkspacePath()
			if (!workspaceRoot) {
				vscode.window.showErrorMessage("Нет открытой рабочей папки")
				return
			}

			// Source: packaged dist/prompts directory
			const srcPromptsUri = vscode.Uri.joinPath(context.extensionUri, "dist", "prompts")
			let srcStats: any
			try {
				srcStats = await fs.stat(srcPromptsUri.fsPath)
				if (!srcStats.isDirectory()) throw new Error("Папка dist/prompts не найдена в пакете")
			} catch (e) {
				vscode.window.showErrorMessage("В пакете не найдена папка dist/prompts")
				return
			}

			// Target: workspace prompts at root
			const dstPromptsDir = path.join(workspaceRoot, "prompts")
			await fs.mkdir(dstPromptsDir, { recursive: true })

			// Recursive copy of entire dist/prompts to project /prompts (overwrite)
			const copyRecursive = async (src: string, dst: string) => {
				const entries = await fs.readdir(src, { withFileTypes: true })
				for (const entry of entries) {
					const srcPath = path.join(src, entry.name)
					const dstPath = path.join(dst, entry.name)
					if (entry.isDirectory()) {
						await fs.mkdir(dstPath, { recursive: true })
						await copyRecursive(srcPath, dstPath)
					} else if (entry.isFile()) {
						await fs.copyFile(srcPath, dstPath)
					}
				}
			}
			await copyRecursive(srcPromptsUri.fsPath, dstPromptsDir)

			vscode.window.showInformationMessage("Папка dist/prompts экспортирована в корень проекта как 'prompts'") 
		} catch (error) {
			vscode.window.showErrorMessage(`Не удалось экспортировать инструкции: ${error instanceof Error ? error.message : String(error)}`)
		}
	},
	exportAllRoleRules: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		try {
			if (!visibleProvider) return

			// workspaceRoot is REQUIRED - prompts are NOT exported to global ~/.roo
			const workspaceRoot = visibleProvider.cwd || (await import("../utils/path")).getWorkspacePath()

			if (!workspaceRoot) {
				// No workspace - show warning and return
				vscode.window.showWarningMessage(t("prompts:exportAllRoleRules.noWorkspace") || "Open a workspace to export prompts to project .roo directory")
				return
			}

			// Ensure language is up to date before showing notifications
			const currentLanguage = visibleProvider.contextProxy.getValue("language") || formatLanguage(vscode.env.language)
			const { changeLanguage, getCurrentLanguage } = await import("../i18n")
			changeLanguage(currentLanguage)
			
			// Debug: log current language
			const actualLang = getCurrentLanguage()
			console.log(`[exportAllRoleRules] Language: requested=${currentLanguage}, actual=${actualLang}`)
			console.log(`[exportAllRoleRules] Target: project .roo (${workspaceRoot}/.roo)`)

			// Import copy function
			const { copyPromptsFromGlobalToProject } = await import("../services/prompt-export-service")
			
			// Copy prompts from dist/prompts to project .roo directory ONLY
			// NOTE: Global ~/.roo export is disabled - prompts are stored in dist/prompts
			const result = await copyPromptsFromGlobalToProject(workspaceRoot, actualLang, context)
			
			if (result.totalCopied > 0) {
				const successMessage = t("prompts:exportAllRoleRules.success")
				vscode.window.showInformationMessage(`${successMessage} (${result.totalCopied} режимов → ${workspaceRoot}/.roo, язык: ${actualLang})`)
			} else {
				const warningMessage = t("prompts:exportAllRoleRules.warning")
				vscode.window.showWarningMessage(warningMessage)
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			outputChannel.appendLine(`[exportAllRoleRules] Error: ${errorMessage}`)
			const currentLanguage = visibleProvider?.contextProxy?.getValue("language") || formatLanguage(vscode.env.language)
			const { changeLanguage } = await import("../i18n")
			changeLanguage(currentLanguage)
			const errorMsg = t("prompts:exportAllRoleRules.error")
			vscode.window.showErrorMessage(errorMsg)
		}
	},
	loadModeInfo: async (modeSlug: string) => {
		try {
			const visibleProvider = getVisibleProviderOrLog(outputChannel)
			if (!visibleProvider) return null

			const workspaceRoot = visibleProvider.cwd || (await import("../utils/path")).getWorkspacePath()
			
			const modeInfo = await loadModeInfo(modeSlug, {
				cwd: workspaceRoot,
				customModes: await visibleProvider.customModesManager.getCustomModes(),
				builtInMode: (await import("../shared/modes")).modes.find(m => m.slug === modeSlug)
			})

			return modeInfo
		} catch (error) {
			console.error(`Failed to load mode info for ${modeSlug}:`, error)
			return null
		}
	},
	showHumanRelayDialog: (params: { requestId: string; promptText: string }) => {
		const panel = getPanel()

		if (panel) {
			panel?.webview.postMessage({
				type: "showHumanRelayDialog",
				requestId: params.requestId,
				promptText: params.promptText,
			})
		}
	},
	registerHumanRelayCallback: registerHumanRelayCallback,
	unregisterHumanRelayCallback: unregisterHumanRelayCallback,
	handleHumanRelayResponse: handleHumanRelayResponse,
	newTask: handleNewTask,
	setCustomStoragePath: async () => {
		const { promptForCustomStoragePath } = await import("../utils/storage")
		await promptForCustomStoragePath()
	},
	importSettings: async (filePath?: string) => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}

		await importSettingsWithFeedback(
			{
				providerSettingsManager: visibleProvider.providerSettingsManager,
				contextProxy: visibleProvider.contextProxy,
				customModesManager: visibleProvider.customModesManager,
				provider: visibleProvider,
			},
			filePath,
		)
	},
	focusInput: async () => {
		try {
			await focusPanel(tabPanel, sidebarPanel)

			// Send focus input message only for sidebar panels
			if (sidebarPanel && getPanel() === sidebarPanel) {
				provider.postMessageToWebview({ type: "action", action: "focusInput" })
			}
		} catch (error) {
			outputChannel.appendLine(`Error focusing input: ${error}`)
		}
	},
	focusPanel: async () => {
		try {
			await focusPanel(tabPanel, sidebarPanel)
		} catch (error) {
			outputChannel.appendLine(`Error focusing panel: ${error}`)
		}
	},
	acceptInput: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)

		if (!visibleProvider) {
			return
		}

		visibleProvider.postMessageToWebview({ type: "acceptInput" })
	},
	exportMarkdownToPdf: () => exportMarkdownToPdf(),
	clearFeedbackState: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return
		await visibleProvider.clearFeedbackState()
		vscode.window.showInformationMessage("Feedback state cleared. Next task completion will show feedback dialog.")
	},
	clearPromptCache: async () => {
		try {
			await clearPromptCache(context)
			const language = formatLanguage(vscode.env.language)
			// После очистки кэша сразу обновляем промпты из API
			await refreshAllPromptsFromApi(context, language)
			vscode.window.showInformationMessage("Prompt cache cleared and refreshed from API.")
		} catch (error) {
			outputChannel.appendLine(`[ClearPromptCache] Error: ${error instanceof Error ? error.message : String(error)}`)
			vscode.window.showErrorMessage(`Failed to clear prompt cache: ${error instanceof Error ? error.message : String(error)}`)
		}
	},
	forceRefreshPrompt: async (mode?: string) => {
		try {
			const { forceRefreshPrompt } = await import("../services/prompt-api-service")
			const language = formatLanguage(vscode.env.language)
			
			// Если mode не указан, спрашиваем пользователя
			if (!mode) {
				mode = await vscode.window.showQuickPick(
					["ask", "code", "architect", "debug", "designer", "helper", "pm"],
					{ placeHolder: "Select mode to refresh" }
				)
			}
			
			if (!mode) {
				return // User cancelled
			}
			
			const result = await forceRefreshPrompt(context, mode, language)
			
			if (result) {
				vscode.window.showInformationMessage(`Prompt for mode "${mode}" refreshed successfully.`)
			} else {
				vscode.window.showWarningMessage(`Failed to refresh prompt for mode "${mode}".`)
			}
		} catch (error) {
			outputChannel.appendLine(`[ForceRefreshPrompt] Error: ${error instanceof Error ? error.message : String(error)}`)
			vscode.window.showErrorMessage(`Failed to refresh prompt: ${error instanceof Error ? error.message : String(error)}`)
		}
	},
})

export const openClineInNewTab = async ({ context, outputChannel }: Omit<RegisterCommandOptions, "provider">) => {
	// (This example uses webviewProvider activation event which is necessary to
	// deserialize cached webview, but since we use retainContextWhenHidden, we
	// don't need to use that event).
	// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
	const contextProxy = await ContextProxy.getInstance(context)
	const codeIndexManager = CodeIndexManager.getInstance(context)

	// Get the existing MDM service instance to ensure consistent policy enforcement
	let mdmService: MdmService | undefined
	try {
		mdmService = MdmService.getInstance()
	} catch (error) {
		// MDM service not initialized, which is fine - extension can work without it
		mdmService = undefined
	}

	const tabProvider = new ClineProvider(context, outputChannel, "editor", contextProxy, codeIndexManager, mdmService)
	const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))

	// Check if there are any visible text editors, otherwise open a new group
	// to the right.
	const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0

	if (!hasVisibleEditors) {
		await vscode.commands.executeCommand("workbench.action.newGroupRight")
	}

	const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

	const newPanel = vscode.window.createWebviewPanel(ClineProvider.tabPanelId, "AI IDE BAS", targetCol, {
		enableScripts: true,
		retainContextWhenHidden: true,
		localResourceRoots: [context.extensionUri],
	})

	// Save as tab type panel.
	setPanel(newPanel, "tab")

	// TODO: Use better svg icon with light and dark variants (see
	// https://stackoverflow.com/questions/58365687/vscode-extension-iconpath).
	newPanel.iconPath = {
		light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "panel_light.png"),
		dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "panel_dark.png"),
	}

	await tabProvider.resolveWebviewView(newPanel)

	// Add listener for visibility changes to notify webview
	newPanel.onDidChangeViewState(
		(e) => {
			const panel = e.webviewPanel
			if (panel.visible) {
				panel.webview.postMessage({ type: "action", action: "didBecomeVisible" }) // Use the same message type as in SettingsView.tsx
			}
		},
		null, // First null is for `thisArgs`
		context.subscriptions, // Register listener for disposal
	)

	// Handle panel closing events.
	newPanel.onDidDispose(
		() => {
			setPanel(undefined, "tab")
		},
		null,
		context.subscriptions, // Also register dispose listener
	)

	// Lock the editor group so clicking on files doesn't open them over the panel.
	await delay(100)
	await vscode.commands.executeCommand("workbench.action.lockEditorGroup")

	return tabProvider
}
