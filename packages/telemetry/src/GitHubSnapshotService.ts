import * as vscode from "vscode"

import { GitHubRepoProperties } from "@roo-code/types"

import { GitHubAnalyticsService, RepositoryDataPoint } from "./GitHubAnalyticsService.js"
import { GitHubApiClient } from "./GitHubApiClient.js"

/**
 * GitHub Snapshot Service for daily repository data collection
 */
export class GitHubSnapshotService {
	private static readonly GLOBAL_STATE_KEYS = {
		HISTORICAL_DATA: "github:historicalData",
		LAST_SNAPSHOT_DATE: "github:lastSnapshotDate",
		REPOSITORY_CONFIG: "github:repositoryConfig",
	} as const

	private readonly apiClient: GitHubApiClient
	private readonly globalState: vscode.Memento

	constructor(owner: string, repo: string, globalState: vscode.Memento, token?: string) {
		this.apiClient = new GitHubApiClient(owner, repo, token)
		this.globalState = globalState
	}

	/**
	 * Collects daily repository snapshot and sends telemetry events
	 */
	public async collectDailySnapshot(): Promise<{
		snapshot: GitHubRepoProperties
		metrics: unknown
		anomaly?: unknown
	}> {
		const today = new Date().toISOString().slice(0, 10)
		const lastSnapshotDate = this.globalState.get<string>(
			GitHubSnapshotService.GLOBAL_STATE_KEYS.LAST_SNAPSHOT_DATE,
		)

		// Skip if already collected today
		if (lastSnapshotDate === today) {
			console.log("GitHub snapshot already collected today")
			return this.getLastSnapshot()
		}

		try {
			// Fetch current repository data
			const currentData = await this.apiClient.getRepositoryInfo()

			// Get historical data
			const historicalData = this.getHistoricalData()

			// Calculate metrics
			const metrics = GitHubAnalyticsService.calculateMetrics(currentData, historicalData)

			// Detect anomalies
			const anomaly = GitHubAnalyticsService.detectAnomalies(currentData, historicalData)

			// Create enhanced snapshot with calculated metrics
			const snapshot: GitHubRepoProperties = {
				...currentData,
				...metrics,
				anomaly_detected: anomaly.detected,
				anomaly_type: anomaly.type,
				anomaly_severity: anomaly.severity,
			}

			// Store new data point
			const newDataPoint: RepositoryDataPoint = {
				date: today,
				stars_count: currentData.stars_count,
				forks_count: currentData.forks_count,
				watchers_count: currentData.watchers_count,
				open_issues_count: currentData.open_issues_count,
				open_pr_count: currentData.open_pr_count,
				releases_total: currentData.releases_total,
			}

			// Update historical data (keep last 365 days)
			const updatedHistoricalData = [...historicalData, newDataPoint].slice(-365)

			// Save to global state
			await this.globalState.update(
				GitHubSnapshotService.GLOBAL_STATE_KEYS.HISTORICAL_DATA,
				updatedHistoricalData,
			)
			await this.globalState.update(GitHubSnapshotService.GLOBAL_STATE_KEYS.LAST_SNAPSHOT_DATE, today)

			console.log(`GitHub snapshot collected for ${today}:`, snapshot)

			return {
				snapshot,
				metrics,
				anomaly: anomaly.detected ? anomaly : undefined,
			}
		} catch (error) {
			console.error("Failed to collect GitHub snapshot:", error)
			throw error
		}
	}

	/**
	 * Gets the last collected snapshot
	 */
	public getLastSnapshot(): {
		snapshot: GitHubRepoProperties
		metrics: unknown
		anomaly?: unknown
	} {
		const historicalData = this.getHistoricalData()
		if (historicalData.length === 0) {
			throw new Error("No historical data available")
		}

		const lastDataPoint = historicalData[historicalData.length - 1]
		const currentData: GitHubRepoProperties = {
			stars_count: lastDataPoint.stars_count,
			forks_count: lastDataPoint.forks_count,
			watchers_count: lastDataPoint.watchers_count,
			open_issues_count: lastDataPoint.open_issues_count,
			open_pr_count: lastDataPoint.open_pr_count,
			releases_total: lastDataPoint.releases_total,
		}

		const metrics = GitHubAnalyticsService.calculateMetrics(currentData, historicalData)
		const anomaly = GitHubAnalyticsService.detectAnomalies(currentData, historicalData)

		const snapshot: GitHubRepoProperties = {
			...currentData,
			...metrics,
			anomaly_detected: anomaly.detected,
			anomaly_type: anomaly.type,
			anomaly_severity: anomaly.severity,
		}

		return {
			snapshot,
			metrics,
			anomaly: anomaly.detected ? anomaly : undefined,
		}
	}

	/**
	 * Gets historical data from global state
	 */
	public getHistoricalData(): RepositoryDataPoint[] {
		return (
			this.globalState.get<RepositoryDataPoint[]>(GitHubSnapshotService.GLOBAL_STATE_KEYS.HISTORICAL_DATA) || []
		)
	}

	/**
	 * Gets repository health analysis
	 */
	public getRepositoryHealthAnalysis(): {
		healthScore: number
		insights: string[]
		recommendations: string[]
		predictions: {
			predictedStars: number
			predictedForks: number
			confidence: number
		}
	} {
		const historicalData = this.getHistoricalData()
		if (historicalData.length === 0) {
			return {
				healthScore: 0,
				insights: ["No historical data available"],
				recommendations: ["Start collecting data"],
				predictions: { predictedStars: 0, predictedForks: 0, confidence: 0 },
			}
		}

		const lastDataPoint = historicalData[historicalData.length - 1]
		const currentData: GitHubRepoProperties = {
			stars_count: lastDataPoint.stars_count,
			forks_count: lastDataPoint.forks_count,
			watchers_count: lastDataPoint.watchers_count,
			open_issues_count: lastDataPoint.open_issues_count,
			open_pr_count: lastDataPoint.open_pr_count,
			releases_total: lastDataPoint.releases_total,
		}

		const metrics = GitHubAnalyticsService.calculateMetrics(currentData, historicalData)
		const healthAnalysis = GitHubAnalyticsService.analyzeRepositoryHealth(metrics)
		const predictions = GitHubAnalyticsService.predictGrowth(historicalData)

		return {
			...healthAnalysis,
			predictions,
		}
	}

	/**
	 * Checks if the service is properly configured
	 */
	public isConfigured(): boolean {
		return this.apiClient.isConfigured()
	}

	/**
	 * Gets the repository identifier
	 */
	public getRepositoryId(): string {
		return this.apiClient.getRepositoryId()
	}

	/**
	 * Configures the repository settings
	 */
	public async configureRepository(owner: string, repo: string, token?: string): Promise<void> {
		// Update API client configuration
		Object.assign(this.apiClient, new GitHubApiClient(owner, repo, token))

		// Save configuration
		await this.globalState.update(GitHubSnapshotService.GLOBAL_STATE_KEYS.REPOSITORY_CONFIG, {
			owner,
			repo,
			hasToken: Boolean(token),
		})
	}

	/**
	 * Gets the current configuration
	 */
	public getConfiguration(): { owner: string; repo: string; hasToken: boolean } | undefined {
		return this.globalState.get(GitHubSnapshotService.GLOBAL_STATE_KEYS.REPOSITORY_CONFIG)
	}

	/**
	 * Clears all historical data (useful for testing or reset)
	 */
	public async clearHistoricalData(): Promise<void> {
		await this.globalState.update(GitHubSnapshotService.GLOBAL_STATE_KEYS.HISTORICAL_DATA, undefined)
		await this.globalState.update(GitHubSnapshotService.GLOBAL_STATE_KEYS.LAST_SNAPSHOT_DATE, undefined)
	}

	/**
	 * Gets data for a specific date range
	 */
	public getDataForDateRange(startDate: string, endDate: string): RepositoryDataPoint[] {
		const historicalData = this.getHistoricalData()
		return historicalData.filter((d) => d.date >= startDate && d.date <= endDate)
	}

	/**
	 * Gets summary statistics for the repository
	 */
	public getSummaryStatistics(): {
		totalDays: number
		totalStarsGained: number
		totalForksGained: number
		averageDailyStars: number
		averageDailyForks: number
		peakStarsDay?: string
		peakForksDay?: string
	} {
		const historicalData = this.getHistoricalData()
		if (historicalData.length < 2) {
			return {
				totalDays: historicalData.length,
				totalStarsGained: 0,
				totalForksGained: 0,
				averageDailyStars: 0,
				averageDailyForks: 0,
			}
		}

		const first = historicalData[0]
		const last = historicalData[historicalData.length - 1]

		const totalStarsGained = last.stars_count - first.stars_count
		const totalForksGained = last.forks_count - first.forks_count

		// Find peak days
		let peakStarsDay: string | undefined
		let peakForksDay: string | undefined
		let maxStarsDelta = 0
		let maxForksDelta = 0

		for (let i = 1; i < historicalData.length; i++) {
			const current = historicalData[i]
			const previous = historicalData[i - 1]

			const starsDelta = current.stars_count - previous.stars_count
			const forksDelta = current.forks_count - previous.forks_count

			if (starsDelta > maxStarsDelta) {
				maxStarsDelta = starsDelta
				peakStarsDay = current.date
			}

			if (forksDelta > maxForksDelta) {
				maxForksDelta = forksDelta
				peakForksDay = current.date
			}
		}

		return {
			totalDays: historicalData.length,
			totalStarsGained,
			totalForksGained,
			averageDailyStars: totalStarsGained / (historicalData.length - 1),
			averageDailyForks: totalForksGained / (historicalData.length - 1),
			peakStarsDay,
			peakForksDay,
		}
	}
}
