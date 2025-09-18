import { PostHog } from "posthog-node"
import * as vscode from "vscode"

import { TelemetryEventName, type TelemetryEvent } from "@roo-code/types"

import { BaseTelemetryClient } from "./BaseTelemetryClient"

/**
 * PostHogTelemetryClient handles telemetry event tracking for the Roo Code extension.
 * Uses PostHog analytics to track user interactions and system events.
 * Respects user privacy settings and VSCode's global telemetry configuration.
 */
export class PostHogTelemetryClient extends BaseTelemetryClient {
	private client: PostHog
	private distinctId: string = vscode.env.machineId
	// Git repository properties that should be filtered out
	private readonly gitPropertyNames = ["repositoryUrl", "repositoryName", "defaultBranch"]

	constructor(debug = false) {
		super(
			{
				type: "exclude",
				events: [TelemetryEventName.TASK_MESSAGE, TelemetryEventName.LLM_COMPLETION],
			},
			debug,
		)

		const apiKey = process.env.POSTHOG_API_KEY || ""
		let host = process.env.POSTHOG_HOST || "https://us.i.posthog.com"
		// Нормализуем хост: протокол и завершающий слеш
		try {
			if (!/^https?:\/\//i.test(host)) {
				// Для облака PostHog по умолчанию используем https
				host = `https://${host}`
			}
			// Принудительно https для *.posthog.com
			host = host.replace(/^http:\/\/(.*\.posthog\.com)/i, "https://$1")
			// Убираем завершающий слеш
			host = host.replace(/\/$/, "")
		} catch {
			/* ignore */
		}

		if (this.debug) {
			console.info(
				`[PostHogTelemetryClient] Initializing with API key: ${apiKey ? "***" + apiKey.slice(-4) : "NOT SET"}`,
			)
			console.info(`[PostHogTelemetryClient] Using host: ${host}`)
		}

		this.client = new PostHog(apiKey, { host })
	}

	/**
	 * Filter out git repository properties for PostHog telemetry
	 * @param propertyName The property name to check
	 * @returns Whether the property should be included in telemetry events
	 */
	protected override isPropertyCapturable(propertyName: string): boolean {
		// Filter out git repository properties
		if (this.gitPropertyNames.includes(propertyName)) {
			return false
		}
		return true
	}

	public override async capture(event: TelemetryEvent): Promise<void> {
		if (!this.isTelemetryEnabled() || !this.isEventCapturable(event.event)) {
			if (this.debug) {
				console.info(
					`[PostHogTelemetryClient#capture] Skipping event: ${event.event} - telemetryEnabled: ${this.isTelemetryEnabled()}, eventCapturable: ${this.isEventCapturable(event.event)}`,
				)
			}

			return
		}

		if (this.debug) {
			console.info(`[PostHogTelemetryClient#capture] ${event.event}`)
		}

		try {
			await this.client.capture({
				distinctId: this.distinctId,
				event: event.event,
				properties: await this.getEventProperties(event),
			})

			if (this.debug) {
				console.info(`[PostHogTelemetryClient#capture] Successfully sent event: ${event.event}`)
			}
		} catch (error) {
			console.error(`[PostHogTelemetryClient#capture] Failed to send event ${event.event}:`, error)
			// Расширенный вывод для SSL/прокси проблем
			try {
				const host = (this.client as unknown as { host?: string })?.host || process.env.POSTHOG_HOST
				console.error(`[PostHogTelemetryClient#capture] host=`, host)
				console.error(`[PostHogTelemetryClient#capture] env HTTPS_PROXY=`, process.env.HTTPS_PROXY)
				console.error(`[PostHogTelemetryClient#capture] env HTTP_PROXY=`, process.env.HTTP_PROXY)
				console.error(
					`[PostHogTelemetryClient#capture] env NODE_EXTRA_CA_CERTS=`,
					process.env.NODE_EXTRA_CA_CERTS,
				)
			} catch {
				/* ignore */
			}
		}
	}

	/**
	 * Updates the telemetry state based on user preferences and VSCode settings.
	 * Only enables telemetry if both VSCode global telemetry is enabled and
	 * user has opted in.
	 * @param didUserOptIn Whether the user has explicitly opted into telemetry
	 */
	public override updateTelemetryState(didUserOptIn: boolean): void {
		this.telemetryEnabled = false

		// First check global telemetry level - telemetry should only be enabled when level is "all".
		const telemetryLevel = vscode.workspace.getConfiguration("telemetry").get<string>("telemetryLevel", "all")
		const globalTelemetryEnabled = telemetryLevel === "all"

		// We only enable telemetry if global vscode telemetry is enabled.
		if (globalTelemetryEnabled) {
			this.telemetryEnabled = didUserOptIn
		}

		if (this.debug) {
			console.info(
				`[PostHogTelemetryClient] updateTelemetryState - didUserOptIn: ${didUserOptIn}, globalTelemetryEnabled: ${globalTelemetryEnabled}, telemetryLevel: ${telemetryLevel}, finalEnabled: ${this.telemetryEnabled}`,
			)

			// Additional debug info about VSCode telemetry settings
			const vscodeTelemetryEnabled = vscode.env.isTelemetryEnabled
			console.info(`[PostHogTelemetryClient] VSCode telemetry enabled: ${vscodeTelemetryEnabled}`)
		}

		// Update PostHog client state based on telemetry preference.
		if (this.telemetryEnabled) {
			this.client.optIn()
			if (this.debug) {
				console.info(`[PostHogTelemetryClient] PostHog client opted IN`)
			}
		} else {
			this.client.optOut()
			if (this.debug) {
				console.info(`[PostHogTelemetryClient] PostHog client opted OUT`)
			}
		}
	}

	public override async shutdown(): Promise<void> {
		await this.client.shutdown()
	}
}
