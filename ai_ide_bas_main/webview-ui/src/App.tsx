import React, { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { useEvent } from "react-use"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ExtensionMessage } from "@roo/ExtensionMessage"
import TranslationProvider from "./i18n/TranslationContext"
import { MarketplaceViewStateManager } from "./components/marketplace/MarketplaceViewStateManager"

import { vscode } from "./utils/vscode"
import { telemetryClient } from "./utils/TelemetryClient"
import { TelemetryEventName } from "@roo-code/types"
import { initializeSourceMaps, exposeSourceMapsForDebugging } from "./utils/sourceMapInitializer"
import { ExtensionStateContextProvider, useExtensionState } from "./context/ExtensionStateContext"
import ChatView, { ChatViewRef } from "./components/chat/ChatView"
import FilesView from "./components/files/FilesView"
import HistoryView from "./components/history/HistoryView"
import SettingsView, { SettingsViewRef } from "./components/settings/SettingsView"
import WelcomeView from "./components/welcome/WelcomeView"
import McpView from "./components/mcp/McpView"
import { MarketplaceView } from "./components/marketplace/MarketplaceView"
import ModesView from "./components/modes/ModesView"
import { HumanRelayDialog } from "./components/human-relay/HumanRelayDialog"
import { DeleteMessageDialog, EditMessageDialog } from "./components/chat/MessageModificationConfirmationDialog"
import ErrorBoundary from "./components/ErrorBoundary"
import { AccountView } from "./components/account/AccountView"
import { TooltipProvider } from "./components/ui/tooltip"
import { STANDARD_TOOLTIP_DELAY } from "./components/ui/standard-tooltip"

type Tab = "settings" | "history" | "mcp" | "modes" | "chat" | "marketplace" | "account" | "files"

interface HumanRelayDialogState {
	isOpen: boolean
	requestId: string
	promptText: string
}

interface DeleteMessageDialogState {
	isOpen: boolean
	messageTs: number
}

interface EditMessageDialogState {
	isOpen: boolean
	messageTs: number
	text: string
	images?: string[]
}

// Memoize dialog components to prevent unnecessary re-renders
const MemoizedDeleteMessageDialog = React.memo(DeleteMessageDialog)
const MemoizedEditMessageDialog = React.memo(EditMessageDialog)
const MemoizedHumanRelayDialog = React.memo(HumanRelayDialog)

const tabsByMessageAction: Partial<Record<NonNullable<ExtensionMessage["action"]>, Tab>> = {
	chatButtonClicked: "chat",
	settingsButtonClicked: "settings",
	promptsButtonClicked: "modes",
	mcpButtonClicked: "mcp",
	historyButtonClicked: "history",
	marketplaceButtonClicked: "marketplace",
	accountButtonClicked: "account",
	filesButtonClicked: "files",
}

const App = () => {
	const {
		didHydrateState,
		showWelcome,
		shouldShowAnnouncement,
		telemetrySetting,
		telemetryKey,
		machineId,
		cloudUserInfo,
		cloudIsAuthenticated,
		cloudApiUrl,
		// renderContext,
		mdmCompliant,
	} = useExtensionState()

	// Create a persistent state manager
	const marketplaceStateManager = useMemo(() => new MarketplaceViewStateManager(), [])

	const [showAnnouncement, setShowAnnouncement] = useState(false)
	const [tab, setTab] = useState<Tab>("chat")

	const [humanRelayDialogState, setHumanRelayDialogState] = useState<HumanRelayDialogState>({
		isOpen: false,
		requestId: "",
		promptText: "",
	})

	const [deleteMessageDialogState, setDeleteMessageDialogState] = useState<DeleteMessageDialogState>({
		isOpen: false,
		messageTs: 0,
	})

	const [editMessageDialogState, setEditMessageDialogState] = useState<EditMessageDialogState>({
		isOpen: false,
		messageTs: 0,
		text: "",
		images: [],
	})

	const settingsRef = useRef<SettingsViewRef>(null)
	const chatViewRef = useRef<ChatViewRef>(null)

	const switchTab = useCallback(
		(newTab: Tab) => {
			// Check MDM compliance before allowing tab switching
			if (mdmCompliant === false && newTab !== "account") {
				return
			}

			setCurrentSection(undefined)
			setCurrentMarketplaceTab(undefined)

			if (settingsRef.current?.checkUnsaveChanges) {
				settingsRef.current.checkUnsaveChanges(() => setTab(newTab))
			} else {
				setTab(newTab)
			}
		},
		[mdmCompliant],
	)

	const [currentSection, setCurrentSection] = useState<string | undefined>(undefined)
	const [currentMarketplaceTab, setCurrentMarketplaceTab] = useState<string | undefined>(undefined)

	const onMessage = useCallback(
		(e: MessageEvent) => {
			const message: ExtensionMessage = e.data

			if (message.type === "action" && message.action) {
				// Handle switchTab action with tab parameter
				if (message.action === "switchTab" && message.tab) {
					const targetTab = message.tab as Tab
					switchTab(targetTab)
					setCurrentSection(undefined)
					setCurrentMarketplaceTab(undefined)
				} else {
					// Handle other actions using the mapping
					const newTab = tabsByMessageAction[message.action]
					const section = message.values?.section as string | undefined
					const marketplaceTab = message.values?.marketplaceTab as string | undefined

					if (newTab) {
						switchTab(newTab)
						setCurrentSection(section)
						setCurrentMarketplaceTab(marketplaceTab)
					}
				}
			}

			if (message.type === "showHumanRelayDialog" && message.requestId && message.promptText) {
				const { requestId, promptText } = message
				setHumanRelayDialogState({ isOpen: true, requestId, promptText })
			}

			if (message.type === "showDeleteMessageDialog" && message.messageTs) {
				setDeleteMessageDialogState({ isOpen: true, messageTs: message.messageTs })
			}

			if (message.type === "showEditMessageDialog" && message.messageTs && message.text) {
				setEditMessageDialogState({
					isOpen: true,
					messageTs: message.messageTs,
					text: message.text,
					images: message.images || [],
				})
			}

			if (message.type === "acceptInput") {
				chatViewRef.current?.acceptInput()
			}
		},
		[switchTab],
	)

	useEvent("message", onMessage)

	// VS Code API initialization diagnostics and universal messaging
	const vscodeApiRef = useRef<any>(null)
	const sendMessage = useCallback((message: unknown) => {
		try {
			// Prefer imported vscode if available
			if (vscode && typeof vscode.postMessage === "function") {
				vscode.postMessage(message as any)
				console.debug("[DEBUG] sendMessage channel: vscode.postMessage")
				return
			}

			// Try acquireVsCodeApi dynamically
			if (!vscodeApiRef.current && typeof (window as any).acquireVsCodeApi === "function") {
				vscodeApiRef.current = (window as any).acquireVsCodeApi()
			}
			if (vscodeApiRef.current && typeof vscodeApiRef.current.postMessage === "function") {
				vscodeApiRef.current.postMessage(message)
				console.debug("[DEBUG] sendMessage channel: acquireVsCodeApi.postMessage")
				return
			}
		} catch (err) {
			console.warn("[DEBUG] vscode API send failed, falling back", err)
		}

		// Aggressive fallback for Windsurf
		try {
			window.parent.postMessage({ command: "webview-message", message }, "*")
			console.debug("[DEBUG] sendMessage channel: window.parent.postMessage")
		} catch (err) {
			console.error("[DEBUG] Fallback postMessage failed", err)
		}
	}, [])

	useEffect(() => {
		let status = "FAILED"
		try {
			if (typeof (window as any).acquireVsCodeApi === "function") {
				vscodeApiRef.current = (window as any).acquireVsCodeApi()
				status = vscodeApiRef.current ? "Initialized" : "FAILED"
			} else if (vscode && typeof vscode.postMessage === "function") {
				status = "Initialized"
			}
		} catch {
			status = "FAILED"
		}
		console.debug(`[DEBUG] VS Code API Status: ${status}`)
	}, [])

	// Global click diagnostics and external link handling
	useEffect(() => {
		function onDocumentClick(ev: MouseEvent) {
			console.debug("[DEBUG] CLICK DETECTED")
			const target = ev.target as HTMLElement | null
			if (!target) return
			const anchor = target.closest("a") as HTMLAnchorElement | null
			if (!anchor) return
			const href = anchor.getAttribute("href") || ""
			if (!href) return
			const isHttp = href.startsWith("http://") || href.startsWith("https://")
			if (!isHttp) return
			// Strict sequence for external links
			ev.preventDefault()
			sendMessage({ type: "openExternal", url: href })
			let win: Window | null = null
			try {
				win = window.open(href, "_blank", "noopener")
				console.debug(`[DEBUG] window.open result: ${win ? "OK" : "BLOCKED"}`)
			} catch (err) {
				console.warn("[DEBUG] window.open threw", err)
			}
		}

		document.addEventListener("click", onDocumentClick, true)
		return () => document.removeEventListener("click", onDocumentClick, true)
	}, [sendMessage])

	useEffect(() => {
		if (shouldShowAnnouncement) {
			setShowAnnouncement(true)
			sendMessage({ type: "didShowAnnouncement" })
		}
	}, [shouldShowAnnouncement, sendMessage])

	useEffect(() => {
		if (didHydrateState) {
			telemetryClient.updateTelemetryState(telemetrySetting, telemetryKey, machineId)
		}
	}, [telemetrySetting, telemetryKey, machineId, didHydrateState])

	// Tell the extension that we are ready to receive messages.
	useEffect(() => {
		sendMessage({ type: "webviewDidLaunch" })
		sendMessage({ type: "files:status" })
	}, [sendMessage])

	// Initialize source map support for better error reporting
	useEffect(() => {
		// Initialize source maps for better error reporting in production
		initializeSourceMaps()

		// Expose source map debugging utilities in production
		if (process.env.NODE_ENV === "production") {
			exposeSourceMapsForDebugging()
		}

		// Log initialization for debugging
		console.debug("App initialized with source map support")
	}, [])

	// Focus the WebView when non-interactive content is clicked (only in editor/tab mode)
/* Removed global non-interactive click focus handler to avoid click interference on Windows */
	// Track marketplace tab views
	useEffect(() => {
		if (tab === "marketplace") {
			telemetryClient.capture(TelemetryEventName.MARKETPLACE_TAB_VIEWED)
		}
	}, [tab])

	if (!didHydrateState) {
		return null
	}

	// Do not conditionally load ChatView, it's expensive and there's state we
	// don't want to lose (user input, disableInput, askResponse promise, etc.)
	return showWelcome ? (
		<WelcomeView />
	) : (
		<>
			{tab === "modes" && <ModesView onDone={() => switchTab("chat")} />}
			{tab === "mcp" && <McpView onDone={() => switchTab("chat")} />}
			{tab === "history" && <HistoryView onDone={() => switchTab("chat")} />}
			{tab === "settings" && (
				<SettingsView ref={settingsRef} onDone={() => setTab("chat")} targetSection={currentSection} />
			)}
			{tab === "marketplace" && (
				<MarketplaceView
					stateManager={marketplaceStateManager}
					onDone={() => switchTab("chat")}
					targetTab={currentMarketplaceTab as "mcp" | "mode" | undefined}
				/>
			)}
			{tab === "files" && <FilesView />}
			{tab === "account" && (
				<AccountView
					userInfo={cloudUserInfo}
					isAuthenticated={cloudIsAuthenticated}
					cloudApiUrl={cloudApiUrl}
					onDone={() => switchTab("chat")}
				/>
			)}
			<ChatView
				ref={chatViewRef}
				isHidden={tab !== "chat"}
				showAnnouncement={showAnnouncement}
				hideAnnouncement={() => setShowAnnouncement(false)}
			/>
			<MemoizedHumanRelayDialog
				isOpen={humanRelayDialogState.isOpen}
				requestId={humanRelayDialogState.requestId}
				promptText={humanRelayDialogState.promptText}
				onClose={() => setHumanRelayDialogState((prev) => ({ ...prev, isOpen: false }))}
				onSubmit={(requestId, text) => sendMessage({ type: "humanRelayResponse", requestId, text })}
				onCancel={(requestId) => sendMessage({ type: "humanRelayCancel", requestId })}
			/>
			<MemoizedDeleteMessageDialog
				open={deleteMessageDialogState.isOpen}
				onOpenChange={(open) => setDeleteMessageDialogState((prev) => ({ ...prev, isOpen: open }))}
				onConfirm={() => {
					sendMessage({
						type: "deleteMessageConfirm",
						messageTs: deleteMessageDialogState.messageTs,
					})
					setDeleteMessageDialogState((prev) => ({ ...prev, isOpen: false }))
				}}
			/>
			<MemoizedEditMessageDialog
				open={editMessageDialogState.isOpen}
				onOpenChange={(open) => setEditMessageDialogState((prev) => ({ ...prev, isOpen: open }))}
					onConfirm={() => {
						sendMessage({
							type: "editMessageConfirm",
							messageTs: editMessageDialogState.messageTs,
							text: editMessageDialogState.text,
							images: editMessageDialogState.images,
						})
					setEditMessageDialogState((prev) => ({ ...prev, isOpen: false }))
				}}
			/>
		</>
	)
}

const queryClient = new QueryClient()

const AppWithProviders = () => (
	<ErrorBoundary>
		<ExtensionStateContextProvider>
			<TranslationProvider>
				<QueryClientProvider client={queryClient}>
					<TooltipProvider delayDuration={STANDARD_TOOLTIP_DELAY}>
						<App />
					</TooltipProvider>
				</QueryClientProvider>
			</TranslationProvider>
		</ExtensionStateContextProvider>
	</ErrorBoundary>
)

export default AppWithProviders
