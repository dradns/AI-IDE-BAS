import type { WebviewApi } from "vscode-webview"

import { WebviewMessage } from "@roo/WebviewMessage"

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
	private readonly vsCodeApi: WebviewApi<unknown> | undefined

	constructor() {
		// Check if the acquireVsCodeApi function exists in the current development
		// context (i.e. VS Code development window or web browser)
        try {
            // @ts-ignore - acquireVsCodeApi is injected by VS Code at runtime
            if (typeof acquireVsCodeApi === "function") {
                // @ts-ignore
                this.vsCodeApi = acquireVsCodeApi()
            }
        } catch {
            // ignore
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
        try {
            if (this.vsCodeApi && typeof this.vsCodeApi.postMessage === "function") {
                this.vsCodeApi.postMessage(message)
                console.debug("[DEBUG] sendMessage channel: vscode.postMessage")
                return
            }
        } catch (err) {
            console.warn("[DEBUG] vscode API send failed, falling back", err)
        }

        // Aggressive Windsurf fallback: bubble to host frame
        try {
            window.parent.postMessage({ command: "webview-message", message }, "*")
            console.debug("[DEBUG] sendMessage channel: window.parent.postMessage")
        } catch (err) {
            console.error("[DEBUG] Fallback postMessage failed", err)
            
            // FINAL PROXY: Force acquireVsCodeApi() even if it wasn't initialized
            try {
                // @ts-ignore - acquireVsCodeApi is injected by VS Code at runtime
                if (typeof acquireVsCodeApi === "function") {
                    // @ts-ignore
                    const forcedApi = acquireVsCodeApi()
                    if (forcedApi && typeof forcedApi.postMessage === "function") {
                        forcedApi.postMessage(message)
                        console.debug("[DEBUG] FINAL PROXY to acquireVsCodeApi - SUCCESS")
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
		if (this.vsCodeApi) {
			return this.vsCodeApi.setState(newState)
		} else {
			localStorage.setItem("vscodeState", JSON.stringify(newState))
			return newState
		}
	}
}

// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
export const vscode = new VSCodeAPIWrapper()
