import type { WebviewApi } from "vscode-webview"

import { WebviewMessage } from "@roo/WebviewMessage"

/**
 * Финальный, жестко закодированный прокси-метод для отправки сообщений.
 * Немедленно вызывает нативный API, минуя потенциальные блокировки.
 * Используется только в Desktop VS Code для предотвращения зависания.
 * 
 * @param message Сообщение для отправки
 * @returns true если сообщение отправлено успешно, false в случае ошибки
 */
function directVsCodeApiProxy(message: WebviewMessage): boolean {
	try {
		// Прямой вызов нативного acquireVsCodeApi без кеширования
		// @ts-ignore - acquireVsCodeApi is injected by VS Code at runtime
		if (typeof acquireVsCodeApi === "function") {
			// @ts-ignore
			const directApi = acquireVsCodeApi()
			if (directApi && typeof directApi.postMessage === "function") {
				directApi.postMessage(message)
				console.debug("[PROXY] Direct API call - SUCCESS")
				return true
			}
		}
		console.warn("[PROXY] Direct API call - FAILED: API not available")
		return false
	} catch (error) {
		console.error("[PROXY] Direct API call - ERROR:", error)
		return false
	}
}

/**
 * A utility wrapper around the acquireVsCodeApi() function, which enables
 * message passing and state management between the webview and extension
 * contexts.
 *
 * This utility also enables webview code to be run in a web browser-based
 * dev server by using native web browser features that mock the functionality
 * enabled by acquireVsCodeApi.
 */
class VSCodeAPIWrapper {
	private vsCodeApi: WebviewApi<unknown> | undefined
	private isInitialized: boolean = false

	constructor() {
		// Инициализация отложена до первого использования
		// this.vsCodeApi остается undefined до вызова _initApi()
	}

	/**
	 * Определяет, работает ли код в облачной среде Windsurf.
	 * Использует простой и чистый детектор: если нативный VS Code API доступен, считает это Desktop.
	 * 
	 * @private
	 * @returns true если среда определена как Windsurf (облачная), false для стандартного VS Code (Desktop)
	 */
	private _isWindsurfEnvironment(): boolean {
		try {
			// Простой и чистый детектор: если нативный VS Code API доступен, это Desktop
			// @ts-ignore - acquireVsCodeApi is injected by VS Code at runtime
			if (typeof acquireVsCodeApi === "function") {
				// Нативный API доступен - это Desktop VS Code
				return false
			}
			
			// Нативный API недоступен - это облачная среда (Windsurf)
			return true
		} catch (err) {
			// В случае ошибки при проверке, считаем что это стандартный VS Code
			console.debug("[DEBUG] Environment detection failed, assuming VS Code:", err)
			return false
		}
	}

	/**
	 * Идемпотентная инициализация VS Code API.
	 * Безопасно вызывается многократно, но инициализация происходит только один раз.
	 * Защищена от фатальных исключений для предотвращения краха UI и открытия меню.
	 * 
	 * @private
	 */
	private _initApi(): void {
		// Если уже инициализирован, ничего не делаем
		if (this.isInitialized) {
			return
		}

		// Единый блок защиты от любых исключений при инициализации
		try {
			// @ts-ignore - acquireVsCodeApi is injected by VS Code at runtime
			if (typeof acquireVsCodeApi === "function") {
				// @ts-ignore
				this.vsCodeApi = acquireVsCodeApi()
				this.isInitialized = true
				console.debug("[DEBUG] VS Code API initialized successfully")
			} else {
				// acquireVsCodeApi недоступен - помечаем как инициализированный
				this.isInitialized = true
				console.debug("[DEBUG] VS Code API not available - using fallback mode")
			}
		} catch (anyErr) {
			// Перехватываем ЛЮБОЕ исключение при инициализации
			console.error("[ERROR] VS Code API initialization failed:", anyErr instanceof Error ? anyErr.message : String(anyErr))
			this.isInitialized = true // Критически важно - помечаем как инициализированный
			// НЕ бросаем исключение дальше - React должен продолжить рендеринг
		}
	}

	/**
	 * Post a message (i.e. send arbitrary data) to the owner of the webview.
	 *
	 * @remarks When running webview code inside a web browser, postMessage will instead
	 * log the given message to the console.
	 *
	 * @param message Arbitrary data (must be JSON serializable) to send to the extension context.
	 */
    public postMessage(message: WebviewMessage) {
        // Уровень 1: Идемпотентная инициализация и стандартная отправка через vscode API
        try {
            // Безопасно инициализируем API (идемпотентно)
            this._initApi()

            // Если API доступен, используем его
            if (this.vsCodeApi && typeof this.vsCodeApi.postMessage === "function") {
                this.vsCodeApi.postMessage(message)
                console.debug("[DEBUG] sendMessage channel: vscode.postMessage - SUCCESS")
                return // Успешная отправка - выходим, не используя обходы
            }
        } catch (err) {
            console.warn("[DEBUG] vscode API send failed, falling back", err)
        }

        // Проверяем среду: агрессивные обходы только для Windsurf
        const isWindsurf = this._isWindsurfEnvironment()
        
        if (!isWindsurf) {
            // В стандартном VS Code: используем прокси-метод для предотвращения зависания
            console.debug("[DEBUG] VS Code Desktop: Using direct proxy to prevent hanging")
            const proxySuccess = directVsCodeApiProxy(message)
            if (proxySuccess) {
                console.debug("[DEBUG] Direct proxy - SUCCESS")
                return
            } else {
                console.warn("[DEBUG] VS Code Desktop: Direct proxy failed - message may be lost")
                return
            }
        }

        // Уровень 2: Агрессивный обход для Windsurf - активируется только при неудаче стандартной отправки
        try {
            window.parent.postMessage({ command: "webview-message", message }, "*")
            console.debug("[DEBUG] sendMessage channel: window.parent.postMessage - SUCCESS (Windsurf)")
            return
        } catch (err) {
            console.error("[DEBUG] Fallback postMessage failed", err)
            
            // Уровень 3: FINAL PROXY - активируется только при неудаче всех предыдущих попыток
            try {
                // @ts-ignore - acquireVsCodeApi is injected by VS Code at runtime
                if (typeof acquireVsCodeApi === "function") {
                    // @ts-ignore
                    const forcedApi = acquireVsCodeApi()
                    if (forcedApi && typeof forcedApi.postMessage === "function") {
                        forcedApi.postMessage(message)
                        console.debug("[DEBUG] FINAL PROXY to acquireVsCodeApi - SUCCESS (Windsurf)")
                        return
                    }
                }
            } catch (finalErr) {
                console.error("[DEBUG] FINAL PROXY to acquireVsCodeApi - FAILED", finalErr)
            }
        }
	}

	/**
	 * Get the persistent state stored for this webview.
	 *
	 * @remarks When running webview source code inside a web browser, getState will retrieve state
	 * from local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
	 *
	 * @return The current state or `undefined` if no state has been set.
	 */
	public getState(): unknown | undefined {
		// Безопасно инициализируем API (идемпотентно)
		this._initApi()

		if (this.vsCodeApi) {
			return this.vsCodeApi.getState()
		} else {
			const state = localStorage.getItem("vscodeState")
			return state ? JSON.parse(state) : undefined
		}
	}

	/**
	 * Set the persistent state stored for this webview.
	 *
	 * @remarks When running webview source code inside a web browser, setState will set the given
	 * state using local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
	 *
	 * @param newState New persisted state. This must be a JSON serializable object. Can be retrieved
	 * using {@link getState}.
	 *
	 * @return The new state.
	 */
	public setState<T extends unknown | undefined>(newState: T): T {
		// Безопасно инициализируем API (идемпотентно)
		this._initApi()

		if (this.vsCodeApi) {
			return this.vsCodeApi.setState(newState)
		} else {
			localStorage.setItem("vscodeState", JSON.stringify(newState))
			return newState
		}
	}

	/**
	 * Subscribe to messages from the VS Code extension host.
	 * 
	 * @param callback Function to call when a message is received from the extension host.
	 * @returns A disposable object that can be used to unsubscribe from messages.
	 */
	public onDidReceiveMessage(callback: (message: any) => void): { dispose: () => void } {
		// В VS Code webview сообщения приходят через стандартный window.addEventListener
		const messageHandler = (event: MessageEvent) => {
			// Фильтруем только сообщения от VS Code host
			if (event.source === window.parent) {
				callback(event.data)
			}
		}

		window.addEventListener("message", messageHandler)

		// Возвращаем disposable для правильной очистки
		return {
			dispose: () => {
				window.removeEventListener("message", messageHandler)
			}
		}
	}

	/**
	 * Отправляет финальную команду готовности Host для разблокировки UI и открытия меню.
	 * Использует самый агрессивный канал отправки с полной диагностикой.
	 * 
	 * @public
	 */
	public readyForHost(): void {
		console.log("[READY] Sending ready signal to Host - START")
		
		const readyMessage = { type: "webviewDidLaunch" as const }
		
		// Уровень 1: Попытка через стандартный API
		try {
			this._initApi()
			if (this.vsCodeApi && typeof this.vsCodeApi.postMessage === "function") {
				this.vsCodeApi.postMessage(readyMessage)
				console.log("[READY] SUCCESS: Standard vscode.postMessage channel")
				return
			}
		} catch (err) {
			console.warn("[READY] Standard API failed, trying aggressive fallbacks:", err)
		}

		// Проверяем среду: агрессивные обходы только для Windsurf
		const isWindsurf = this._isWindsurfEnvironment()
		
		if (!isWindsurf) {
			// В стандартном VS Code: используем прокси-метод для предотвращения зависания
			console.debug("[READY] VS Code Desktop: Using direct proxy to prevent hanging")
			const proxySuccess = directVsCodeApiProxy(readyMessage)
			if (proxySuccess) {
				console.log("[READY] SUCCESS: Direct proxy channel")
				return
			} else {
				console.warn("[READY] VS Code Desktop: Direct proxy failed - ready signal may be lost")
				return
			}
		}

		// Уровень 2: Агрессивный обход через window.parent (только для Windsurf)
		try {
			window.parent.postMessage({ command: "webview-message", message: readyMessage }, "*")
			console.log("[READY] SUCCESS: window.parent.postMessage channel (Windsurf)")
			return
		} catch (err) {
			console.error("[READY] window.parent.postMessage failed:", err)
		}

		// Уровень 3: FINAL PROXY - принудительная инициализация (только для Windsurf)
		try {
			// @ts-ignore - acquireVsCodeApi is injected by VS Code at runtime
			if (typeof acquireVsCodeApi === "function") {
				// @ts-ignore
				const forcedApi = acquireVsCodeApi()
				if (forcedApi && typeof forcedApi.postMessage === "function") {
					forcedApi.postMessage(readyMessage)
					console.log("[READY] SUCCESS: FINAL PROXY acquireVsCodeApi channel (Windsurf)")
					return
				}
			}
		} catch (finalErr) {
			console.error("[READY] FINAL PROXY failed:", finalErr)
		}

		// Уровень 4: Последняя попытка - прямой вызов через window (только для Windsurf)
		try {
			// @ts-ignore - Попытка прямого вызова через window
			if (typeof window.vscodePostMessage === "function") {
				// @ts-ignore
				window.vscodePostMessage("onmessage", readyMessage)
				console.log("[READY] SUCCESS: Direct window.vscodePostMessage channel (Windsurf)")
				return
			}
		} catch (directErr) {
			console.error("[READY] Direct window call failed:", directErr)
		}

		console.error("[READY] FAILED: All channels exhausted - Host may not receive ready signal")
	}
}

// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
export const vscode = new VSCodeAPIWrapper()
