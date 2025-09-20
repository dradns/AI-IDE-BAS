import * as vscode from "vscode"

/**
 * Simple churn prediction based on usage patterns
 * Predicts likelihood of user churning in the next 7 days
 */
export class ChurnPredictor {
	private static readonly GLOBAL_STATE_KEYS = {
		USAGE_FREQUENCY: "telemetry:usageFrequency",
		LAST_FEATURE_USAGE: "telemetry:lastFeatureUsage",
		SESSION_DURATION: "telemetry:sessionDuration",
		CHURN_SCORE: "telemetry:churnScore",
		PREDICTION_DATE: "telemetry:predictionDate",
	} as const

	private static readonly CHURN_THRESHOLD = 0.7 // 70% chance of churning

	/**
	 * Calculates churn probability based on usage patterns
	 * @param globalState VSCode global state for persistence
	 * @returns Churn probability (0-1) and risk level
	 */
	public static async calculateChurnRisk(globalState?: vscode.Memento): Promise<{
		probability: number
		riskLevel: "low" | "medium" | "high"
		recommendations: string[]
	}> {
		if (!globalState) {
			return { probability: 0, riskLevel: "low", recommendations: [] }
		}

		const today = new Date().toISOString().slice(0, 10)
		const lastPrediction = globalState.get<string>(ChurnPredictor.GLOBAL_STATE_KEYS.PREDICTION_DATE)

		// Only recalculate once per day
		if (lastPrediction === today) {
			const cachedScore = globalState.get<number>(ChurnPredictor.GLOBAL_STATE_KEYS.CHURN_SCORE) ?? 0
			return ChurnPredictor.getRiskLevel(cachedScore)
		}

		// Gather usage data
		const usageFrequency = globalState.get<number[]>(ChurnPredictor.GLOBAL_STATE_KEYS.USAGE_FREQUENCY) ?? []
		const lastFeatureUsage = globalState.get<string>(ChurnPredictor.GLOBAL_STATE_KEYS.LAST_FEATURE_USAGE)
		const sessionDuration = globalState.get<number[]>(ChurnPredictor.GLOBAL_STATE_KEYS.SESSION_DURATION) ?? []

		// Calculate churn probability based on multiple factors
		const probability = ChurnPredictor.calculateProbability({
			usageFrequency,
			lastFeatureUsage,
			sessionDuration,
		})

		// Cache the result
		globalState.update(ChurnPredictor.GLOBAL_STATE_KEYS.CHURN_SCORE, probability)
		globalState.update(ChurnPredictor.GLOBAL_STATE_KEYS.PREDICTION_DATE, today)

		return ChurnPredictor.getRiskLevel(probability)
	}

	/**
	 * Updates usage patterns for churn prediction
	 * @param eventName The event that was triggered
	 * @param sessionDuration Duration of current session in minutes
	 * @param globalState VSCode global state
	 */
	public static async updateUsagePatterns(
		eventName: string,
		sessionDuration: number,
		globalState?: vscode.Memento,
	): Promise<void> {
		if (!globalState) return

		// Update usage frequency (last 7 days)
		const usageFrequency = globalState.get<number[]>(ChurnPredictor.GLOBAL_STATE_KEYS.USAGE_FREQUENCY) ?? []
		usageFrequency.push(1) // Count today's usage

		// Keep only last 7 days
		if (usageFrequency.length > 7) {
			usageFrequency.shift()
		}

		globalState.update(ChurnPredictor.GLOBAL_STATE_KEYS.USAGE_FREQUENCY, usageFrequency)

		// Update last feature usage
		globalState.update(ChurnPredictor.GLOBAL_STATE_KEYS.LAST_FEATURE_USAGE, eventName)

		// Update session duration
		const sessionDurations = globalState.get<number[]>(ChurnPredictor.GLOBAL_STATE_KEYS.SESSION_DURATION) ?? []
		sessionDurations.push(sessionDuration)

		// Keep only last 10 sessions
		if (sessionDurations.length > 10) {
			sessionDurations.shift()
		}

		globalState.update(ChurnPredictor.GLOBAL_STATE_KEYS.SESSION_DURATION, sessionDurations)
	}

	private static calculateProbability(data: {
		usageFrequency: number[]
		lastFeatureUsage?: string
		sessionDuration: number[]
	}): number {
		const { usageFrequency, lastFeatureUsage, sessionDuration } = data

		// Factor 1: Usage frequency (0-0.4 weight)
		const avgUsageFrequency =
			usageFrequency.length > 0 ? usageFrequency.reduce((a, b) => a + b, 0) / usageFrequency.length : 0
		const frequencyScore = Math.max(0, 1 - avgUsageFrequency) * 0.4

		// Factor 2: Days since last feature usage (0-0.3 weight)
		const daysSinceLastUsage = lastFeatureUsage ? 0 : 7 // Assume 7 days if no feature usage
		const recencyScore = Math.min(1, daysSinceLastUsage / 7) * 0.3

		// Factor 3: Session duration trend (0-0.3 weight)
		const avgSessionDuration =
			sessionDuration.length > 0 ? sessionDuration.reduce((a, b) => a + b, 0) / sessionDuration.length : 0
		const durationScore = avgSessionDuration < 5 ? 0.3 : 0 // Short sessions indicate disengagement

		return Math.min(1, frequencyScore + recencyScore + durationScore)
	}

	private static getRiskLevel(probability: number): {
		probability: number
		riskLevel: "low" | "medium" | "high"
		recommendations: string[]
	} {
		let riskLevel: "low" | "medium" | "high"
		const recommendations: string[] = []

		if (probability >= ChurnPredictor.CHURN_THRESHOLD) {
			riskLevel = "high"
			recommendations.push("Send re-engagement email")
			recommendations.push("Offer personalized onboarding")
			recommendations.push("Provide feature discovery tips")
		} else if (probability >= 0.4) {
			riskLevel = "medium"
			recommendations.push("Send usage tips")
			recommendations.push("Highlight new features")
		} else {
			riskLevel = "low"
			recommendations.push("Continue current engagement strategy")
		}

		return { probability, riskLevel, recommendations }
	}

	/**
	 * Gets churn prediction insights for analytics
	 */
	public static async getChurnInsights(globalState?: vscode.Memento): Promise<{
		churnProbability: number
		riskLevel: string
		usagePattern: {
			avgFrequency: number
			avgSessionDuration: number
			lastFeatureUsed?: string
		}
		recommendations: string[]
	}> {
		if (!globalState) {
			return {
				churnProbability: 0,
				riskLevel: "low",
				usagePattern: { avgFrequency: 0, avgSessionDuration: 0 },
				recommendations: [],
			}
		}

		const usageFrequency = globalState.get<number[]>(ChurnPredictor.GLOBAL_STATE_KEYS.USAGE_FREQUENCY) ?? []
		const sessionDuration = globalState.get<number[]>(ChurnPredictor.GLOBAL_STATE_KEYS.SESSION_DURATION) ?? []
		const lastFeatureUsage = globalState.get<string>(ChurnPredictor.GLOBAL_STATE_KEYS.LAST_FEATURE_USAGE)

		const prediction = await ChurnPredictor.calculateChurnRisk(globalState)

		return {
			churnProbability: prediction.probability,
			riskLevel: prediction.riskLevel,
			usagePattern: {
				avgFrequency:
					usageFrequency.length > 0 ? usageFrequency.reduce((a, b) => a + b, 0) / usageFrequency.length : 0,
				avgSessionDuration:
					sessionDuration.length > 0
						? sessionDuration.reduce((a, b) => a + b, 0) / sessionDuration.length
						: 0,
				lastFeatureUsed: lastFeatureUsage,
			},
			recommendations: prediction.recommendations,
		}
	}
}
