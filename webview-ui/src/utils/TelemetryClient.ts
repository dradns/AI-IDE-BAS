import posthog from "posthog-js"

import { TelemetrySetting } from "@roo/TelemetrySetting"

class TelemetryClient {
	private static instance: TelemetryClient
	private static telemetryEnabled: boolean = false

	public updateTelemetryState(
		telemetrySetting: TelemetrySetting,
		apiKey?: string,
		distinctId?: string,
		apiHost?: string,
	) {
		posthog.reset()

		if (telemetrySetting === "enabled" && apiKey && distinctId) {
			TelemetryClient.telemetryEnabled = true

			posthog.init(apiKey, {
				api_host: apiHost || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
				persistence: "localStorage",
				// Ensure Session Replay is enabled so events get a PostHog Session ID
				session_recording: {
					maskAllInputs: false,
					maskInputOptions: {},
				},
				loaded: () => {
					posthog.identify(distinctId)
					this.sessionId = `${distinctId}-${Date.now()}`
					try {
						posthog.register_once({ appVersion: (window as any)?.APP_VERSION })
						posthog.register({ platform: navigator.platform, editorName: "VSCode Webview" })
						posthog.capture("App Session Started", { sessionId: this.sessionId })
						this.startHeartbeat()
						window.addEventListener("beforeunload", () => {
							try {
								posthog.capture("App Session Ended", { sessionId: this.sessionId })
							} catch (_e) {
								/* noop */
							}
							this.stopHeartbeat()
						})
					} catch (_e) {
						/* noop */
					}
				},
				capture_pageview: "history_change",
				capture_pageleave: true,
				autocapture: true,
			})
		} else {
			TelemetryClient.telemetryEnabled = false
		}
	}

	public static getInstance(): TelemetryClient {
		if (!TelemetryClient.instance) {
			TelemetryClient.instance = new TelemetryClient()
		}

		return TelemetryClient.instance
	}

	private sessionId?: string
	private heartbeatTimer?: any

	public getSessionId(): string | undefined {
		return this.sessionId
	}

	private startHeartbeat() {
		if (this.heartbeatTimer) return
		this.heartbeatTimer = setInterval(
			() => {
				if (!TelemetryClient.telemetryEnabled || !this.sessionId) return
				try {
					posthog.capture("Active Heartbeat", { sessionId: this.sessionId })
				} catch (_e) {
					/* noop */
				}
			},
			5 * 60 * 1000,
		)
	}

	private stopHeartbeat() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer)
			this.heartbeatTimer = undefined
		}
	}

	public capture(eventName: string, properties?: Record<string, any>) {
		if (TelemetryClient.telemetryEnabled) {
			try {
				posthog.capture(eventName, properties)
			} catch (_error) {
				// Silently fail if there's an error capturing an event.
			}
		}
	}
}

export const telemetryClient = TelemetryClient.getInstance()
