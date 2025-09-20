import { PostHog } from "posthog-node"
import * as vscode from "vscode"

import { TelemetryEventName, type TelemetryEvent } from "@roo-code/types"

import { BaseTelemetryClient } from "./BaseTelemetryClient"
import { ChurnPredictor } from "./ChurnPredictor"

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

	private static readonly GLOBAL_STATE_KEYS = {
		FIRST_EVER_SESSION: "telemetry:firstEverSession",
		LAST_ACTIVE_DAY: "telemetry:lastActiveDay",
		DAILY_SESSION_COUNT: "telemetry:dailySessionCount",
		INSTALL_SOURCE: "telemetry:installSource",
		COUNTRY: "telemetry:country",
		FIRST_ACTIVATION_SENT: "telemetry:firstActivationSent",
		LAST_ACTIVATION_DATE: "telemetry:lastActivationDate",
		USER_TIER: "telemetry:userTier",
		FIRST_FEATURE_USED: "telemetry:firstFeatureUsed",
	} as const

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

	private async getBaseProps(_event: TelemetryEvent): Promise<Record<string, unknown>> {
		const dayKey = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
		const ctx = (global as unknown as { __vscodeExtensionContext?: vscode.ExtensionContext })
			.__vscodeExtensionContext
		const globalState = ctx?.globalState

		const lastDay = globalState?.get<string>(PostHogTelemetryClient.GLOBAL_STATE_KEYS.LAST_ACTIVE_DAY)
		let sessionCount = globalState?.get<number>(PostHogTelemetryClient.GLOBAL_STATE_KEYS.DAILY_SESSION_COUNT) ?? 0
		let firstEver = globalState?.get<boolean>(PostHogTelemetryClient.GLOBAL_STATE_KEYS.FIRST_EVER_SESSION)

		if (lastDay !== dayKey) {
			// Новый день — сбрасываем дневной счётчик
			sessionCount = 0
			globalState?.update(PostHogTelemetryClient.GLOBAL_STATE_KEYS.LAST_ACTIVE_DAY, dayKey)
		}

		sessionCount += 1
		globalState?.update(PostHogTelemetryClient.GLOBAL_STATE_KEYS.DAILY_SESSION_COUNT, sessionCount)

		if (firstEver === undefined) {
			firstEver = true
			globalState?.update(PostHogTelemetryClient.GLOBAL_STATE_KEYS.FIRST_EVER_SESSION, false)
		} else {
			firstEver = false
		}

		const country = globalState?.get<string>(PostHogTelemetryClient.GLOBAL_STATE_KEYS.COUNTRY)
		const source = globalState?.get<string>(PostHogTelemetryClient.GLOBAL_STATE_KEYS.INSTALL_SOURCE)
		const userTier = globalState?.get<string>(PostHogTelemetryClient.GLOBAL_STATE_KEYS.USER_TIER) ?? "free"
		const firstFeatureUsed = globalState?.get<string>(PostHogTelemetryClient.GLOBAL_STATE_KEYS.FIRST_FEATURE_USED)

		const props = {
			distinct_id: this.distinctId,
			version: vscode.extensions.getExtension("RooCode.roo-code")?.packageJSON?.version ?? undefined,
			platform: process.platform,
			country,
			source,
			sessionCount,
			first_ever_session: firstEver,
			user_tier: userTier,
			first_feature_used: firstFeatureUsed,
		}

		// Для EXTENSION_ACTIVATED/RELAUNCH добавим event-type специфичные ключи позже при capture
		return props
	}

	private async handleRetentionEvents(
		eventName: string,
		properties: Record<string, unknown>,
		globalState?: vscode.Memento,
	): Promise<void> {
		if (!globalState) return

		const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
		const firstActivationSent = globalState.get<boolean>(
			PostHogTelemetryClient.GLOBAL_STATE_KEYS.FIRST_ACTIVATION_SENT,
		)
		const lastActivationDate = globalState.get<string>(
			PostHogTelemetryClient.GLOBAL_STATE_KEYS.LAST_ACTIVATION_DATE,
		)

		// Отправляем first_activation только один раз
		if (!firstActivationSent && eventName === TelemetryEventName.EXTENSION_ACTIVATED) {
			await this.client.capture({
				distinctId: this.distinctId,
				event: TelemetryEventName.FIRST_ACTIVATION,
				properties: {
					...properties,
					activation_date: today,
				},
			})
			globalState.update(PostHogTelemetryClient.GLOBAL_STATE_KEYS.FIRST_ACTIVATION_SENT, true)
		}

		// Проверяем user_returned: если пользователь отсутствовал > 7 дней
		if (lastActivationDate && eventName === TelemetryEventName.EXTENSION_ACTIVATED) {
			const lastDate = new Date(lastActivationDate)
			const currentDate = new Date(today)
			const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

			if (daysDiff >= 7) {
				await this.client.capture({
					distinctId: this.distinctId,
					event: TelemetryEventName.USER_RETURNED,
					properties: {
						...properties,
						days_absent: daysDiff,
						return_date: today,
					},
				})
			}
		}

		// Обновляем дату последней активации
		if (eventName === TelemetryEventName.EXTENSION_ACTIVATED) {
			globalState.update(PostHogTelemetryClient.GLOBAL_STATE_KEYS.LAST_ACTIVATION_DATE, today)
		}
	}

	private async trackFirstFeatureUsed(
		eventName: string,
		properties: Record<string, unknown>,
		globalState?: vscode.Memento,
	): Promise<void> {
		if (!globalState) return

		const firstFeatureUsed = globalState.get<string>(PostHogTelemetryClient.GLOBAL_STATE_KEYS.FIRST_FEATURE_USED)

		// Если первая фича ещё не записана и это не системное событие
		if (!firstFeatureUsed && !this.isSystemEvent(eventName)) {
			globalState.update(PostHogTelemetryClient.GLOBAL_STATE_KEYS.FIRST_FEATURE_USED, eventName)
		}
	}

	private isSystemEvent(eventName: string): boolean {
		const systemEvents = [
			TelemetryEventName.EXTENSION_ACTIVATED,
			TelemetryEventName.EXTENSION_RELAUNCH,
			TelemetryEventName.FIRST_ACTIVATION,
			TelemetryEventName.USER_RETURNED,
		]
		return systemEvents.includes(eventName as TelemetryEventName)
	}

	private async updateChurnPrediction(eventName: string, globalState?: vscode.Memento): Promise<void> {
		if (!globalState || this.isSystemEvent(eventName)) return

		// Estimate session duration (simplified - in real app would track actual duration)
		const sessionDuration = 15 // minutes - placeholder

		await ChurnPredictor.updateUsagePatterns(eventName, sessionDuration, globalState)

		// Check churn risk and send alert if high
		const churnRisk = await ChurnPredictor.calculateChurnRisk(globalState)
		if (churnRisk.riskLevel === "high") {
			// Send churn prediction event
			await this.client.capture({
				distinctId: this.distinctId,
				event: "Churn Risk Detected",
				properties: {
					churn_probability: churnRisk.probability,
					risk_level: churnRisk.riskLevel,
					recommendations: churnRisk.recommendations,
					prediction_date: new Date().toISOString().slice(0, 10),
				},
			})
		}
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

		try {
			let properties = await this.getEventProperties(event)

			// Вливаем базовые props в каждый эвент
			const baseProps = await this.getBaseProps(event)
			properties = { ...baseProps, ...(properties || {}) }

			// Преобразуем EXTENSION_ACTIVATED vs EXTENSION_RELAUNCH по дневному счётчику
			let eventName = event.event
			if (
				event.event === TelemetryEventName.EXTENSION_ACTIVATED ||
				event.event === TelemetryEventName.EXTENSION_RELAUNCH
			) {
				const sessionCount = (properties.sessionCount as number) ?? 1
				eventName =
					sessionCount === 1 ? TelemetryEventName.EXTENSION_ACTIVATED : TelemetryEventName.EXTENSION_RELAUNCH
			}

			// Логика для first_activation и user_returned
			const ctx = (global as unknown as { __vscodeExtensionContext?: vscode.ExtensionContext })
				.__vscodeExtensionContext
			await this.handleRetentionEvents(eventName, properties, ctx?.globalState)

			// Отслеживаем первую использованную фичу
			await this.trackFirstFeatureUsed(eventName, properties, ctx?.globalState)

			// Обновляем паттерны использования для churn prediction
			await this.updateChurnPrediction(eventName, ctx?.globalState)

			await this.client.capture({
				distinctId: this.distinctId,
				event: eventName,
				properties,
			})

			if (this.debug) {
				console.info(`[PostHogTelemetryClient#capture] Sent ${eventName} with`, properties)
			}
		} catch (error) {
			console.error(`[PostHogTelemetryClient#capture] Failed to send event ${event.event}:`, error)
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
		this.telemetryEnabled = didUserOptIn && vscode.env.isTelemetryEnabled
	}

	public override async shutdown(): Promise<void> {
		const anyClient = this.client as unknown as {
			shutdownAsync?: () => Promise<void>
			flushAsync?: () => Promise<void>
			shutdown?: () => void
		}
		if (typeof anyClient.shutdownAsync === "function") {
			await anyClient.shutdownAsync()
			return
		}
		if (typeof anyClient.flushAsync === "function") {
			await anyClient.flushAsync()
		}
		if (typeof anyClient.shutdown === "function") {
			anyClient.shutdown()
		}
	}
}
