import { GitHubRepoProperties } from "@roo-code/types"

/**
 * Historical data point for repository metrics
 */
export interface RepositoryDataPoint {
	date: string // YYYY-MM-DD
	stars_count: number
	forks_count: number
	watchers_count: number
	open_issues_count: number
	open_pr_count: number
	releases_total: number
}

/**
 * Calculated metrics for repository health analysis
 */
export interface RepositoryMetrics {
	delta_stars: number
	delta_forks: number
	delta_watchers: number
	delta_issues: number
	delta_pr: number
	delta_releases: number
	stars_7day_avg: number
	forks_7day_avg: number
	watchers_7day_avg: number
	issues_7day_avg: number
	pr_7day_avg: number
	releases_7day_avg: number
	health_index: number
	stars_forks_ratio: number
}

/**
 * Anomaly detection result
 */
export interface AnomalyResult {
	detected: boolean
	type?: "stars_spike" | "forks_spike" | "issues_spike" | "pr_spike" | "releases_spike"
	severity?: "low" | "medium" | "high"
	description?: string
	threshold_exceeded?: number
}

/**
 * GitHub Analytics Service for repository health analysis
 */
export class GitHubAnalyticsService {
	private static readonly HEALTH_WEIGHTS = {
		stars: 0.4, // α
		forks: 0.3, // β
		open_pr: 0.3, // γ
	} as const

	private static readonly ANOMALY_THRESHOLD = 3 // 3 standard deviations

	/**
	 * Calculates daily deltas and 7-day moving averages
	 */
	public static calculateMetrics(
		currentData: GitHubRepoProperties,
		historicalData: RepositoryDataPoint[],
	): RepositoryMetrics {
		const today = new Date().toISOString().slice(0, 10)
		const yesterday = this.getPreviousDay(today)
		const sevenDaysAgo = this.getPreviousDay(today, 7)

		// Find yesterday's data
		const yesterdayData = historicalData.find((d) => d.date === yesterday)

		// Calculate deltas
		const delta_stars = yesterdayData ? currentData.stars_count - yesterdayData.stars_count : 0
		const delta_forks = yesterdayData ? currentData.forks_count - yesterdayData.forks_count : 0
		const delta_watchers = yesterdayData ? currentData.watchers_count - yesterdayData.watchers_count : 0
		const delta_issues = yesterdayData ? currentData.open_issues_count - yesterdayData.open_issues_count : 0
		const delta_pr = yesterdayData ? currentData.open_pr_count - yesterdayData.open_pr_count : 0
		const delta_releases = yesterdayData ? currentData.releases_total - yesterdayData.releases_total : 0

		// Calculate 7-day moving averages
		const last7Days = historicalData.filter((d) => d.date >= sevenDaysAgo && d.date < today)

		const stars_7day_avg = this.calculateAverage(last7Days, "stars_count")
		const forks_7day_avg = this.calculateAverage(last7Days, "forks_count")
		const watchers_7day_avg = this.calculateAverage(last7Days, "watchers_count")
		const issues_7day_avg = this.calculateAverage(last7Days, "open_issues_count")
		const pr_7day_avg = this.calculateAverage(last7Days, "open_pr_count")
		const releases_7day_avg = this.calculateAverage(last7Days, "releases_total")

		// Calculate health index: health = α⋅stars + β⋅forks + γ⋅open_pr
		const health_index =
			this.HEALTH_WEIGHTS.stars * currentData.stars_count +
			this.HEALTH_WEIGHTS.forks * currentData.forks_count +
			this.HEALTH_WEIGHTS.open_pr * currentData.open_pr_count

		// Calculate stars to forks ratio
		const stars_forks_ratio = currentData.forks_count > 0 ? currentData.stars_count / currentData.forks_count : 0

		return {
			delta_stars,
			delta_forks,
			delta_watchers,
			delta_issues,
			delta_pr,
			delta_releases,
			stars_7day_avg,
			forks_7day_avg,
			watchers_7day_avg,
			issues_7day_avg,
			pr_7day_avg,
			releases_7day_avg,
			health_index,
			stars_forks_ratio,
		}
	}

	/**
	 * Detects anomalies in repository metrics
	 */
	public static detectAnomalies(
		currentData: GitHubRepoProperties,
		historicalData: RepositoryDataPoint[],
	): AnomalyResult {
		if (historicalData.length < 7) {
			return { detected: false }
		}

		const last30Days = historicalData.slice(-30) // Use last 30 days for baseline

		// Check for stars anomaly
		const starsAnomaly = this.checkAnomaly(
			currentData.stars_count,
			last30Days.map((d) => d.stars_count),
			"stars_spike",
		)
		if (starsAnomaly.detected) return starsAnomaly

		// Check for forks anomaly
		const forksAnomaly = this.checkAnomaly(
			currentData.forks_count,
			last30Days.map((d) => d.forks_count),
			"forks_spike",
		)
		if (forksAnomaly.detected) return forksAnomaly

		// Check for issues anomaly
		const issuesAnomaly = this.checkAnomaly(
			currentData.open_issues_count,
			last30Days.map((d) => d.open_issues_count),
			"issues_spike",
		)
		if (issuesAnomaly.detected) return issuesAnomaly

		// Check for PR anomaly
		const prAnomaly = this.checkAnomaly(
			currentData.open_pr_count,
			last30Days.map((d) => d.open_pr_count),
			"pr_spike",
		)
		if (prAnomaly.detected) return prAnomaly

		// Check for releases anomaly
		const releasesAnomaly = this.checkAnomaly(
			currentData.releases_total,
			last30Days.map((d) => d.releases_total),
			"releases_spike",
		)
		if (releasesAnomaly.detected) return releasesAnomaly

		return { detected: false }
	}

	/**
	 * Analyzes repository health and provides insights
	 */
	public static analyzeRepositoryHealth(metrics: RepositoryMetrics): {
		healthScore: number
		insights: string[]
		recommendations: string[]
	} {
		const insights: string[] = []
		const recommendations: string[] = []

		// Analyze stars vs forks ratio
		if (metrics.stars_forks_ratio > 10) {
			insights.push(
				`High stars-to-forks ratio (${metrics.stars_forks_ratio.toFixed(1)}:1) indicates popularity but low adoption`,
			)
			recommendations.push("Improve developer experience and documentation")
			recommendations.push("Add more examples and tutorials")
		} else if (metrics.stars_forks_ratio < 2) {
			insights.push(
				`Low stars-to-forks ratio (${metrics.stars_forks_ratio.toFixed(1)}:1) indicates high adoption`,
			)
		}

		// Analyze recent growth
		if (metrics.delta_stars > 0) {
			insights.push(`Gained ${metrics.delta_stars} stars today`)
		} else if (metrics.delta_stars < 0) {
			insights.push(`Lost ${Math.abs(metrics.delta_stars)} stars today`)
		}

		if (metrics.delta_forks > 0) {
			insights.push(`Gained ${metrics.delta_forks} forks today`)
		}

		// Analyze issue/PR activity
		if (metrics.delta_issues > 5) {
			insights.push(`Significant increase in open issues (+${metrics.delta_issues})`)
			recommendations.push("Review and prioritize issue triage")
		}

		if (metrics.delta_pr > 3) {
			insights.push(`High PR activity (+${metrics.delta_pr})`)
			recommendations.push("Consider increasing review capacity")
		}

		// Calculate health score (0-100)
		const healthScore = Math.min(100, Math.max(0, metrics.health_index / 1000))

		return {
			healthScore,
			insights,
			recommendations,
		}
	}

	/**
	 * Predicts future growth based on historical trends
	 */
	public static predictGrowth(historicalData: RepositoryDataPoint[]): {
		predictedStars: number
		predictedForks: number
		confidence: number
	} {
		if (historicalData.length < 7) {
			return { predictedStars: 0, predictedForks: 0, confidence: 0 }
		}

		const last7Days = historicalData.slice(-7)
		const starsGrowth = this.calculateTrend(last7Days, "stars_count")
		const forksGrowth = this.calculateTrend(last7Days, "forks_count")

		const currentStars = last7Days[last7Days.length - 1].stars_count
		const currentForks = last7Days[last7Days.length - 1].forks_count

		// Predict next 7 days
		const predictedStars = Math.max(0, currentStars + starsGrowth * 7)
		const predictedForks = Math.max(0, currentForks + forksGrowth * 7)

		// Calculate confidence based on data consistency
		const confidence = this.calculateConfidence(last7Days)

		return {
			predictedStars,
			predictedForks,
			confidence,
		}
	}

	/**
	 * Helper method to calculate average from historical data
	 */
	private static calculateAverage(data: RepositoryDataPoint[], field: keyof RepositoryDataPoint): number {
		if (data.length === 0) return 0
		const sum = data.reduce((acc, d) => acc + (d[field] as number), 0)
		return sum / data.length
	}

	/**
	 * Helper method to check for anomalies using statistical analysis
	 */
	private static checkAnomaly(
		currentValue: number,
		historicalValues: number[],
		type: AnomalyResult["type"],
	): AnomalyResult {
		if (historicalValues.length < 7) {
			return { detected: false }
		}

		const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
		const variance =
			historicalValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / historicalValues.length
		const standardDeviation = Math.sqrt(variance)

		if (standardDeviation === 0) {
			return { detected: false }
		}

		const zScore = Math.abs(currentValue - mean) / standardDeviation

		if (zScore >= this.ANOMALY_THRESHOLD) {
			const severity: AnomalyResult["severity"] = zScore >= 5 ? "high" : zScore >= 4 ? "medium" : "low"

			return {
				detected: true,
				type,
				severity,
				description: `${type} anomaly detected: ${currentValue} (${zScore.toFixed(2)}σ from mean)`,
				threshold_exceeded: zScore,
			}
		}

		return { detected: false }
	}

	/**
	 * Helper method to calculate trend from historical data
	 */
	private static calculateTrend(data: RepositoryDataPoint[], field: keyof RepositoryDataPoint): number {
		if (data.length < 2) return 0

		const values = data.map((d) => d[field] as number)
		const n = values.length
		const sumX = (n * (n - 1)) / 2
		const sumY = values.reduce((a, b) => a + b, 0)
		const sumXY = values.reduce((sum, y, x) => sum + x * y, 0)
		const sumXX = (n * (n - 1) * (2 * n - 1)) / 6

		const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
		return slope
	}

	/**
	 * Helper method to calculate confidence in predictions
	 */
	private static calculateConfidence(data: RepositoryDataPoint[]): number {
		if (data.length < 3) return 0

		const stars = data.map((d) => d.stars_count)
		const mean = stars.reduce((a, b) => a + b, 0) / stars.length
		const variance = stars.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / stars.length
		const coefficientOfVariation = Math.sqrt(variance) / mean

		// Lower coefficient of variation = higher confidence
		return Math.max(0, Math.min(1, 1 - coefficientOfVariation))
	}

	/**
	 * Helper method to get previous day
	 */
	private static getPreviousDay(date: string, daysBack = 1): string {
		const d = new Date(date)
		d.setDate(d.getDate() - daysBack)
		return d.toISOString().slice(0, 10)
	}
}
