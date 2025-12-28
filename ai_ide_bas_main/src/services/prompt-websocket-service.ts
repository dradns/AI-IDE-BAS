import * as vscode from "vscode"
import type WebSocket from "ws"

import { AIIDEBAS_PROMPTS_API_BASE_URL } from "../shared/constants"
import { clearPromptCache, loadPromptFromApiSeparated, roleToMode } from "./prompt-api-service"
import { exportPromptsFromApi, exportPromptsToExtensionDist } from "./prompt-export-service"
import { clearGlobalRooCache } from "./roo-config"
import { ClineProvider } from "../core/webview/ClineProvider"

// Dynamic import for ws module (native module that cannot be bundled)
let WebSocketModule: typeof import("ws") | null = null

// WebSocket ready states
const WS_OPEN = 1

// Load WebSocket module dynamically
const loadWebSocket = async (): Promise<typeof import("ws") | null> => {
    if (WebSocketModule !== null) {
        return WebSocketModule
    }

    try {
        const wsModule = await import("ws")
        WebSocketModule = wsModule
        console.log("[PromptWS] ✅ Loaded 'ws' module")
        return WebSocketModule
    } catch (error) {
        console.warn("[PromptWS] ⚠️ Failed to load 'ws' module, WebSocket updates disabled:", error)
        return null
    }
}

// WebSocket reconnection settings
const MAX_RECONNECT_ATTEMPTS = 10
const INITIAL_RECONNECT_DELAY = 1000   // 1 second
const MAX_RECONNECT_DELAY     = 60000  // 1 minute
const PING_INTERVAL           = 30000  // 30 seconds

// Message types for prompt updates
interface PromptUpdateMessage {
    type: "prompt_update"
    action: "published" | "archived" | "deleted"
    slug: string
    target_roles: string[]
    prompt_id?: string
    name?: string
}

class PromptWebSocketService {
    private ws: WebSocket | null = null
    private reconnectAttempts  = 0
    private reconnectDelay     = INITIAL_RECONNECT_DELAY
    private pingInterval: NodeJS.Timeout | null        = null
    private reconnectTimeout: NodeJS.Timeout | null    = null
    private exportDebounceTimer: NodeJS.Timeout | null = null
    private isConnecting = false
    private isDisposed   = false
    private context: vscode.ExtensionContext | null = null
    private language: string | undefined

    private readonly EXPORT_DEBOUNCE_DELAY = 3000 // 3 seconds

    // Initialize WebSocket connection
    async initialize(context: vscode.ExtensionContext, language?: string): Promise<void> {
        this.context  = context
        this.language = language

        const wsModule = await loadWebSocket()
        if (!wsModule) {
            console.warn("[PromptWS] ⚠️ WebSocket not available, real-time updates disabled")
            return
        }

        this.connect()
    }

    // Build WebSocket URL from API URL
    private getWebSocketUrl(): string {
        const apiUrl = AIIDEBAS_PROMPTS_API_BASE_URL

        // Handle localhost
        if (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1")) {
            const port = apiUrl.match(/:(\d+)/)?.[1] || "8000"
            return `ws://localhost:${port}/api/v1/ws/prompts`
        }

        // Handle production/test environments
        const host = apiUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
        return `wss://${host}/api/v1/ws/prompts`
    }

    // Connect to WebSocket server
    private async connect(): Promise<void> {
        if (this.isDisposed || this.isConnecting) {
            return
        }

        if (WebSocketModule === null) {
            const wsModule = await loadWebSocket()
            if (!wsModule) {
                console.warn("[PromptWS] ⚠️ Cannot connect: WebSocket module not available")
                return
            }
        }

        if (this.ws && this.ws.readyState === WS_OPEN) {
            console.log("[PromptWS] Already connected")
            return
        }

        this.isConnecting = true
        const wsUrl = this.getWebSocketUrl()
        console.log(`[PromptWS] Connecting to: ${wsUrl}`)

        try {
            this.ws = new (WebSocketModule as any).default(wsUrl) as WebSocket

            this.ws.on("open", () => {
                this.isConnecting      = false
                this.reconnectAttempts = 0
                this.reconnectDelay    = INITIAL_RECONNECT_DELAY
                console.log("[PromptWS] ✅ Connected to prompt updates")
                this.startPingInterval()
            })

            this.ws.on("message", (data: Buffer | string) => {
                const messageData = typeof data === "string" ? data : data.toString("utf-8")
                this.handleMessage(messageData)
            })

            this.ws.on("close", (code: number, reason: Buffer) => {
                this.isConnecting = false
                const reasonStr   = reason ? reason.toString("utf-8") : "none"
                console.log(`[PromptWS] Disconnected (code: ${code}, reason: ${reasonStr})`)
                this.stopPingInterval()
                this.scheduleReconnect()
            })

            this.ws.on("error", (error: Error) => {
                this.isConnecting = false
                console.warn("[PromptWS] WebSocket error:", error)
            })
        } catch (error) {
            this.isConnecting = false
            console.warn("[PromptWS] Failed to create WebSocket:", error)
            this.scheduleReconnect()
        }
    }

    // Handle incoming WebSocket message
    private handleMessage(data: string): void {
        if (data === "pong") {
            return
        }

        try {
            const message = JSON.parse(data) as PromptUpdateMessage
            if (message.type === "prompt_update") {
                console.log(
                    `[PromptWS] 📢 Received prompt update: action=${message.action}, ` +
                    `slug=${message.slug}, roles=${message.target_roles?.join(", ")}`
                )
                this.handlePromptUpdate(message)
            }
        } catch {
            console.debug("[PromptWS] Failed to parse message:", data)
        }
    }

    // Handle prompt update: clear cache, reload, export files, notify UI
    private async handlePromptUpdate(message: PromptUpdateMessage): Promise<void> {
        if (!this.context) {
            console.warn("[PromptWS] No context available, skipping update")
            return
        }

        const modesToUpdate: string[] = []

        if (message.slug) {
            modesToUpdate.push(message.slug)
        }

        if (message.target_roles && message.target_roles.length > 0) {
            for (const role of message.target_roles) {
                const mode = roleToMode(role)
                if (!modesToUpdate.includes(mode)) {
                    modesToUpdate.push(mode)
                }
            }
        }

        console.log(`[PromptWS] 🔄 Updating modes in background: ${modesToUpdate.join(", ")}`)

        for (const mode of modesToUpdate) {
            try {
                await clearPromptCache(this.context, mode, this.language)
                await loadPromptFromApiSeparated(mode, this.language, undefined, this.context)
                console.log(`[PromptWS] ✅ Silently updated cache for mode=${mode}`)
            } catch (error) {
                console.warn(`[PromptWS] Failed to update mode=${mode}:`, error)
            }
        }

        this.scheduleFileExport()
    }

    // Schedule file export with debounce to prevent multiple exports on batch updates
    private scheduleFileExport(): void {
        if (this.exportDebounceTimer) {
            clearTimeout(this.exportDebounceTimer)
        }

        this.exportDebounceTimer = setTimeout(async () => {
            await this.executeFileExport()
        }, this.EXPORT_DEBOUNCE_DELAY)
    }

    // Execute file export to ~/.roo and dist/prompts
    private async executeFileExport(): Promise<void> {
        if (!this.context) {
            console.warn("[PromptWS] No context available, skipping file export")
            return
        }

        console.log("[PromptWS] 🔄 Starting file export to ~/.roo and dist/prompts")

        try {
            clearGlobalRooCache()
            const globalResult = await exportPromptsFromApi(this.context, undefined, false)
            console.log(
                `[PromptWS] ✅ Exported to ~/.roo: ${globalResult.totalExported} files, ` +
                `${globalResult.totalModes} modes`
            )
        } catch (error) {
            console.warn("[PromptWS] ⚠️ Failed to export to ~/.roo:", error)
        }

        try {
            const distResult = await exportPromptsToExtensionDist(this.context)
            console.log(
                `[PromptWS] ✅ Exported to dist/prompts: ${distResult.totalExported} files, ` +
                `${distResult.totalModes} modes`
            )
        } catch (error) {
            console.warn("[PromptWS] ⚠️ Failed to export to dist/prompts:", error)
        }

        this.notifyWebviewSilently()
        console.log("[PromptWS] ✅ Silent update completed - files, cache, and roles list updated")
    }

    // Notify webview silently to refresh roles list without popup
    private notifyWebviewSilently(): void {
        try {
            const visibleProvider = ClineProvider.getVisibleInstance()
            if (visibleProvider) {
                visibleProvider.postMessageToWebview({
                    type: "promptsUpdated",
                    timestamp: Date.now(),
                })
            }
        } catch {
            // Ignore errors - not critical
        }
    }

    // Schedule reconnection with exponential backoff
    private scheduleReconnect(): void {
        if (this.isDisposed) {
            return
        }

        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.warn(`[PromptWS] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`)
            return
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
        }

        this.reconnectAttempts++
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            MAX_RECONNECT_DELAY
        )

        console.log(`[PromptWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)

        this.reconnectTimeout = setTimeout(() => {
            this.connect()
        }, delay)
    }

    // Start ping interval for keep-alive
    private startPingInterval(): void {
        this.stopPingInterval()

        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WS_OPEN) {
                this.ws.send("ping", (error: Error | undefined) => {
                    if (error) {
                        console.warn("[PromptWS] Ping failed:", error)
                    }
                })
            }
        }, PING_INTERVAL)
    }

    // Stop ping interval
    private stopPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval)
            this.pingInterval = null
        }
    }

    // Update language preference
    updateLanguage(language: string): void {
        this.language = language
    }

    // Disconnect and cleanup resources
    dispose(): void {
        this.isDisposed = true

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }

        if (this.exportDebounceTimer) {
            clearTimeout(this.exportDebounceTimer)
            this.exportDebounceTimer = null
        }

        this.stopPingInterval()

        if (this.ws) {
            this.ws.close()
            this.ws.removeAllListeners()
            this.ws = null
        }

        console.log("[PromptWS] Disposed")
    }

    // Check if WebSocket is connected
    isConnected(): boolean {
        if (!this.ws) {
            return false
        }
        return this.ws.readyState === WS_OPEN
    }
}

// Singleton instance
export const promptWebSocketService = new PromptWebSocketService()
