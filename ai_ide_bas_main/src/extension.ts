import * as vscode from "vscode"
import * as dotenvx from "@dotenvx/dotenvx"
import * as path from "path"
import fs from "fs"
import * as os from "os"
import { TelemetryReporter } from "@vscode/extension-telemetry"

// Load environment variables from .env file
try {
	// Specify path to .env file in the project root directory
	const envPath = path.join(__dirname, "..", ".env")
	dotenvx.config({ path: envPath })
} catch (e) {
	// Silently handle environment loading errors
	console.warn("Failed to load environment variables:", e)
}

// Load build config from extension-build-config.json
interface IBuildConfig {
    featureFlags: {
        updateSec: number | null
    }
}
let buildConfig: IBuildConfig = {
    featureFlags: {
        updateSec: null
    }
}
try {
	const configPath = path.join(__dirname, "..", "extension-build-config.json")
	const raw = fs.readFileSync(configPath, 'utf8')
	buildConfig = JSON.parse(raw)
	console.log("Successfully parsed build config")
	console.log(`[Extension] isImmediateUpdate=${buildConfig.featureFlags.isImmediateUpdate}`)
} catch (e) {
	console.warn("Failed to load build configuration, using defaults:", e)
}

import { CloudService } from "@roo-code/cloud"
import { TelemetryService, PostHogTelemetryClient } from "@roo-code/telemetry"

import "./utils/path" // Necessary to have access to String.prototype.toPosix.
import { createOutputChannelLogger, createDualLogger } from "./utils/outputChannelLogger"

import { Package } from "./shared/package"
import { formatLanguage } from "./shared/language"
import { ContextProxy } from "./core/config/ContextProxy"
import { ClineProvider } from "./core/webview/ClineProvider"
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"
import { TerminalRegistry } from "./integrations/terminal/TerminalRegistry"
import { McpServerManager } from "./services/mcp/McpServerManager"
import { CodeIndexManager } from "./services/code-index/manager"
import { MdmService } from "./services/mdm/MdmService"
import { migrateSettings } from "./utils/migrateSettings"
import { autoImportSettings } from "./utils/autoImportSettings"
import { API } from "./extension/api"
import { refreshAllPromptsFromApi, getCacheKeySeparated, initPromptCache } from "./services/prompt-api-service"
import { exportPromptsOnFirstInstall } from "./services/prompt-export-service"

import {
	handleUri,
	registerCommands,
	registerCodeActions,
	registerTerminalActions,
	CodeActionProvider,
} from "./activate"
import { initializeI18n } from "./i18n"

/**
 * Built using https://github.com/microsoft/vscode-webview-ui-toolkit
 *
 * Inspired by:
 *  - https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
 *  - https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra
 */

let outputChannel: vscode.OutputChannel
let extensionContext: vscode.ExtensionContext
let azureTelemetryReporter: TelemetryReporter | undefined

// This method is called when your extension is activated.
// Your extension is activated the very first time the command is executed.
export async function activate(context: vscode.ExtensionContext) {
	extensionContext = context
	outputChannel = vscode.window.createOutputChannel(Package.outputChannel)
	context.subscriptions.push(outputChannel)
	outputChannel.appendLine(`${Package.name} extension activated - ${JSON.stringify(Package)}`)
	// Initialize Azure telemetry if aiKey is available
	try {
		const { id, packageJSON } = context.extension
		if (packageJSON.aiKey) {
			azureTelemetryReporter = new TelemetryReporter(packageJSON.aiKey)
			context.subscriptions.push(azureTelemetryReporter)

			// Send install telemetry if not already sent
			if (!context.globalState.get("azureInstallTelemetrySent")) {
				azureTelemetryReporter.sendTelemetryEvent("install", {
					vscodeVersion: vscode.version,
					platform: process.platform,
					arch: process.arch,
					release: os.release(),
					uiKind: String(vscode.env.uiKind),
				})
				context.globalState.update("azureInstallTelemetrySent", true)
			}

			// Send daily active telemetry
			const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
			const lastActive = context.globalState.get<string>("azureLastActiveDate")
			if (lastActive !== today) {
				azureTelemetryReporter.sendTelemetryEvent("dailyActive", {
					machineId: vscode.env.machineId,
					vscodeVersion: vscode.version,
					platform: process.platform,
				})
				context.globalState.update("azureLastActiveDate", today)
			}
		}
	} catch (error) {
		console.warn("Failed to initialize Azure telemetry:", error)
	}

	// Migrate old settings to new
	await migrateSettings(context, outputChannel)

	// Initialize telemetry service.
	const telemetryService = TelemetryService.createInstance()

	try {
		telemetryService.register(new PostHogTelemetryClient())
	} catch (error) {
		console.warn("Failed to register PostHogTelemetryClient:", error)
	}

	// Create logger for cloud services
	const cloudLogger = createDualLogger(createOutputChannelLogger(outputChannel))

	// Initialize Roo Code Cloud service.
	await CloudService.createInstance(context, {
		stateChanged: () => ClineProvider.getVisibleInstance()?.postStateToWebview(),
		log: cloudLogger,
	})

	// Initialize MDM service
	const mdmService = await MdmService.createInstance(cloudLogger)

	// Initialize i18n for internationalization support
	initializeI18n(context.globalState.get("language") ?? formatLanguage(vscode.env.language))

	// Initialize terminal shell execution handlers.
	TerminalRegistry.initialize()

	// Initialize file-based prompt cache (to avoid large extension state)
	try {
		await initPromptCache(context)
		outputChannel.appendLine("[PromptCache] File-based cache initialized")
	} catch (error) {
		outputChannel.appendLine(`[PromptCache] Failed to initialize file cache: ${error}`)
	}

	// Get default commands from configuration.
	const defaultCommands = vscode.workspace.getConfiguration(Package.name).get<string[]>("allowedCommands") || []

	// Initialize global state if not already set.
	if (!context.globalState.get("allowedCommands")) {
		context.globalState.update("allowedCommands", defaultCommands)
	}

	const contextProxy = await ContextProxy.getInstance(context)
	const codeIndexManager = CodeIndexManager.getInstance(context)

	try {
		await codeIndexManager?.initialize(contextProxy)
	} catch (error) {
		outputChannel.appendLine(
			`[CodeIndexManager] Error during background CodeIndexManager configuration/indexing: ${error.message || error}`,
		)
	}

	const provider = new ClineProvider(context, outputChannel, "sidebar", contextProxy, codeIndexManager, mdmService)
	TelemetryService.instance.setProvider(provider)

	if (codeIndexManager) {
		context.subscriptions.push(codeIndexManager)
	}

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ClineProvider.sideBarId, provider, {
			webviewOptions: { retainContextWhenHidden: true },
		}),
	)

	// Auto-import configuration if specified in settings
	try {
		await autoImportSettings(outputChannel, {
			providerSettingsManager: provider.providerSettingsManager,
			contextProxy: provider.contextProxy,
			customModesManager: provider.customModesManager,
		})
	} catch (error) {
		outputChannel.appendLine(
			`[AutoImport] Error during auto-import: ${error instanceof Error ? error.message : String(error)}`,
		)
	}

	registerCommands({ context, outputChannel, provider })

	/**
	 * We use the text document content provider API to show the left side for diff
	 * view by creating a virtual document for the original content. This makes it
	 * readonly so users know to edit the right side if they want to keep their changes.
	 *
	 * This API allows you to create readonly documents in VSCode from arbitrary
	 * sources, and works by claiming an uri-scheme for which your provider then
	 * returns text contents. The scheme must be provided when registering a
	 * provider and cannot change afterwards.
	 *
	 * Note how the provider doesn't create uris for virtual documents - its role
	 * is to provide contents given such an uri. In return, content providers are
	 * wired into the open document logic so that providers are always considered.
	 *
	 * https://code.visualstudio.com/api/extension-guides/virtual-documents
	 */
	const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return Buffer.from(uri.query, "base64").toString("utf-8")
		}
	})()

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider),
	)

	context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))

	// Register code actions provider.
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider({ pattern: "**/*" }, new CodeActionProvider(), {
			providedCodeActionKinds: CodeActionProvider.providedCodeActionKinds,
		}),
	)

	registerCodeActions(context)
	registerTerminalActions(context)

	// Allows other extensions to activate once Roo is ready.
	vscode.commands.executeCommand(`${Package.name}.activationCompleted`)

	// Implements the `RooCodeAPI` interface.
	const socketPath = process.env.ROO_CODE_IPC_SOCKET_PATH
	const enableLogging = typeof socketPath === "string"

	// Watch the core files and automatically reload the extension host.
	if (process.env.NODE_ENV === "development") {
		const pattern = "**/*.ts"

		const watchPaths = [
			{ path: context.extensionPath, name: "extension" },
			{ path: path.join(context.extensionPath, "../packages/types"), name: "types" },
			{ path: path.join(context.extensionPath, "../packages/telemetry"), name: "telemetry" },
			{ path: path.join(context.extensionPath, "../packages/cloud"), name: "cloud" },
		]

		console.log(
			`♻️♻️♻️ Core auto-reloading is ENABLED. Watching for changes in: ${watchPaths.map(({ name }) => name).join(", ")}`,
		)

		watchPaths.forEach(({ path: watchPath, name }) => {
			const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(watchPath, pattern))

			watcher.onDidChange((uri) => {
				console.log(`♻️ ${name} file changed: ${uri.fsPath}. Reloading host…`)
				vscode.commands.executeCommand("workbench.action.reloadWindow")
			})

			context.subscriptions.push(watcher)
		})
	}

	// ========================================
	// PROMPT EXPORT ON FIRST INSTALL/UPDATE
	// ========================================
	// При первой установке или обновлении версии расширения - загружаем промпты из API
	// С jitter для распределения нагрузки при массовом обновлении
	// Вшитые промпты используются как fallback при недоступности API
	const hasExportedBefore = context.globalState.get<boolean>("promptsExportedFromApi")
	const lastExportedVersion = context.globalState.get<string>("lastExportedExtensionVersion")
	const currentVersion = context.extension.packageJSON.version
	const isFirstInstall = !hasExportedBefore
	const isExtensionUpdate = !!(lastExportedVersion && lastExportedVersion !== currentVersion)
	
	if (isFirstInstall || isExtensionUpdate) {
		// Jitter для распределения нагрузки при массовом обновлении (0-60 секунд)
		// Детерминированный на основе machineId - каждый пользователь получает своё время
		const EXPORT_JITTER_RANGE_MS = 60 * 1000 // 60 секунд максимум
		const machineId = vscode.env.machineId
		const machineHash = machineId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
		const exportJitter = machineHash % EXPORT_JITTER_RANGE_MS
		
		outputChannel.appendLine(`[PromptExport] ${isFirstInstall ? "First install" : `Update from ${lastExportedVersion} to ${currentVersion}`} detected`)
		outputChannel.appendLine(`[PromptExport] Will load prompts from API in ${Math.round(exportJitter / 1000)}s (jitter to distribute API load)`)
		outputChannel.appendLine(`[PromptExport] Using bundled prompts until API sync completes`)
		
		// Асинхронная загрузка с jitter - не блокирует запуск расширения
		setTimeout(async () => {
			try {
				outputChannel.appendLine(`[PromptExport] Starting API sync...`)
				await exportPromptsOnFirstInstall(context)
				outputChannel.appendLine(`[PromptExport] ✅ Prompts loaded from API and cached to dist/prompts`)
			} catch (error: any) {
				outputChannel.appendLine(`[PromptExport] ⚠️ Failed to load prompts from API: ${error.message || error}`)
				outputChannel.appendLine(`[PromptExport] Bundled prompts will continue to be used`)
			}
		}, exportJitter)
	} else {
		outputChannel.appendLine(`[PromptExport] Prompts already cached (version: ${currentVersion}), using cached prompts`)
	}

	// ========================================
	// AUTO-REFRESH PROMPTS FROM API
	// ========================================
	// Автоматическое обновление промптов из API с рандомным интервалом 8-12 минут
	const MIN_REFRESH_INTERVAL_MS = 8 * 60 * 1000 // 8 минут минимум
	const MAX_REFRESH_INTERVAL_MS = 12 * 60 * 1000 // 12 минут максимум
	const INITIAL_JITTER_RANGE_MS = 5 * 60 * 1000 // 0-5 минут начальный разброс
	const IMMEDIATE_UPDATE_MS = 2 * 60 * 1000 // 2 minutes

	// Функция для получения текущего языка из настроек
	// Используется динамически при каждом обновлении, чтобы учитывать смену языка
	const getCurrentLanguage = () => formatLanguage(context.globalState.get("language") ?? vscode.env.language)
	
	// Генерируем детерминированный jitter на основе machineId для стабильности
	// Это гарантирует, что каждый клиент получает свое уникальное время обновления
	const machineId = vscode.env.machineId
	const machineHash = machineId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
	const initialDelay = machineHash % INITIAL_JITTER_RANGE_MS
	
	outputChannel.appendLine(`[AutoRefresh] Initial refresh scheduled in ${Math.round(initialDelay / 1000)}s (machineId hash-based distribution)`)
	
	let refreshTimeoutHandle: NodeJS.Timeout | undefined
	
	// Helper to update UI after refresh
	// Обновляет кэш и UI с новыми ролями
	const notifyWebviewAboutRolesUpdate = async (roles: Awaited<ReturnType<typeof refreshAllPromptsFromApi>>["roles"], language?: string) => {
		try {
			// Обновляем список ролей из API (все опубликованные роли) в кэше
			// Удаленные роли (которых нет в списке из API) автоматически исчезнут
			await context.globalState.update("cachedApiRoles", roles)
			
			// Get current language from settings if not provided
			const currentLanguage = language || getCurrentLanguage()
			// Сохраняем язык кэша
			await context.globalState.update("cachedApiRolesLanguage", currentLanguage)
			
			// Обновляем UI с новыми ролями
			outputChannel.appendLine(`[AutoRefresh] Sending ${roles.length} roles to UI: ${roles.map(r => r.slug).join(", ")}`)
			provider.postMessageToWebview({
				type: "apiRoles",
				apiRoles: roles,
				language: currentLanguage, // Передаем язык, который использовался для запроса
			})
			
			// Also send promptsUpdated message so UI knows to refresh
			provider.postMessageToWebview({
				type: "promptsUpdated",
				timestamp: Date.now(),
			})
			
			outputChannel.appendLine(`[AutoRefresh] UI notified about ${roles.length} roles`)
		} catch (error) {
			outputChannel.appendLine(`[AutoRefresh] Failed to update: ${error}`)
		}
	}
	
	// Планирование следующего обновления с рандомным интервалом 8-12 минут
	const scheduleNextRefresh = () => {
		const isImmediate = buildConfig.featureFlags.isImmediateUpdate
		outputChannel.appendLine(`[AutoRefresh] isImmediateUpdate=${isImmediate}`)
		const nextInterval = isImmediate ?
			IMMEDIATE_UPDATE_MS :
			// Рандомный интервал от 8 до 12 минут
			MIN_REFRESH_INTERVAL_MS + Math.random() * (MAX_REFRESH_INTERVAL_MS - MIN_REFRESH_INTERVAL_MS)
		
		outputChannel.appendLine(`[AutoRefresh] Next refresh scheduled in ${Math.round(nextInterval / 1000)}s (${Math.round(nextInterval / 60000)}min)`)
		
		refreshTimeoutHandle = setTimeout(async () => {
			outputChannel.appendLine(`[AutoRefresh] Starting automatic refresh...`)
			try {
				// Получаем текущий язык динамически при каждом обновлении
				const currentLanguage = getCurrentLanguage()
				const result = await refreshAllPromptsFromApi(context, currentLanguage, undefined, true) // shouldExport=true для автоматического обновления
				outputChannel.appendLine(`[AutoRefresh] Refreshed ${result.modesRefreshed} modes, ${result.roles.length} roles loaded (language: ${currentLanguage})`)
				
				// Обновляем кэш и UI с новыми ролями
				await notifyWebviewAboutRolesUpdate(result.roles, currentLanguage)
			} catch (error: any) {
				outputChannel.appendLine(`[AutoRefresh] Failed to refresh prompts: ${error.message || error}`)
			} finally {
				// Планируем следующее обновление после завершения текущего
				scheduleNextRefresh()
			}
		}, nextInterval)
	}
	
	// Первая загрузка с детерминированной задержкой (распределяем пользователей по времени)
	// ВАЖНО: При первой установке/обновлении версии initial refresh ПРОПУСКАЕТСЯ,
	// так как exportPromptsOnFirstInstall уже загружает промпты из API
	const initialRefreshHandle = setTimeout(async () => {
		// Проверяем, была ли первая установка/обновление - если да, пропускаем initial refresh
		// exportPromptsOnFirstInstall уже запущен параллельно и делает всю работу
		if (isFirstInstall || isExtensionUpdate) {
			outputChannel.appendLine(`[AutoRefresh] Skipping initial refresh - exportPromptsOnFirstInstall handles API sync`)
			// Просто запускаем цикл обновлений
			scheduleNextRefresh()
			return
		}
		
		outputChannel.appendLine(`[AutoRefresh] Starting initial refresh...`)
		try {
			const cachedApiRoles = context.globalState.get<Awaited<ReturnType<typeof refreshAllPromptsFromApi>>["roles"]>("cachedApiRoles")
			
			// Если есть кэшированные роли, используем их для UI
			if (cachedApiRoles && cachedApiRoles.length > 0) {
				outputChannel.appendLine(`[AutoRefresh] Using cached roles for UI (${cachedApiRoles.length} roles)`)
				await notifyWebviewAboutRolesUpdate(cachedApiRoles, getCurrentLanguage())
			}
			
			// Загружаем свежие данные из API
			const currentLanguage = getCurrentLanguage()
			const result = await refreshAllPromptsFromApi(context, currentLanguage)
			outputChannel.appendLine(`[AutoRefresh] Initial refresh: ${result.modesRefreshed} modes, ${result.roles.length} roles loaded (language: ${currentLanguage})`)
			
			// Обновляем UI с новыми ролями
			await notifyWebviewAboutRolesUpdate(result.roles, currentLanguage)
		} catch (error: any) {
			outputChannel.appendLine(`[AutoRefresh] Failed to refresh prompts on activation: ${error.message || error}`)
		} finally {
			// Запускаем цикл обновлений после первого обновления
			scheduleNextRefresh()
		}
	}, initialDelay)
	
	// Добавляем очистку таймеров при деактивации
	context.subscriptions.push({
		dispose: () => {
			if (initialRefreshHandle) {
				clearTimeout(initialRefreshHandle)
			}
			if (refreshTimeoutHandle) {
				clearTimeout(refreshTimeoutHandle)
			}
		}
	})
	
	outputChannel.appendLine(`[AutoRefresh] ✅ Automatic prompt refresh enabled`)
	outputChannel.appendLine(`[AutoRefresh] Interval range: ${MIN_REFRESH_INTERVAL_MS / 60000}-${MAX_REFRESH_INTERVAL_MS / 60000}min (random)`)

	// NOTE: Prompt loading strategy:
	// 1. On first install or version update: prompts are loaded from API IMMEDIATELY (see exportPromptsOnFirstInstall above)
	// 2. Subsequent updates: automatic refresh every 8-12 min keeps prompts up-to-date
	// 3. Bundled prompts in .vsix are used ONLY as fallback when API is unavailable
	// 4. User .roo directories (project .roo and ~/.roo/rules) are NEVER updated in the background; only dist/prompts is. They are written only when the user clicks "Export rules".

	return new API(outputChannel, provider, socketPath, enableLogging)
}

// This method is called when your extension is deactivated.
export function deactivate() {
	// Azure telemetry reporter will be disposed automatically through subscriptions
}
