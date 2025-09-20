import * as vscode from "vscode"

import { GitHubRepoProperties } from "@roo-code/types"

import { GitHubAnalyticsService } from "./GitHubAnalyticsService.js"
import { GitHubSnapshotService } from "./GitHubSnapshotService.js"
import { TelemetryService } from "./TelemetryService.js"

/**
 * Main GitHub Telemetry Service that orchestrates all GitHub-related telemetry
 */
export class GitHubTelemetryService {
	private readonly snapshotService: GitHubSnapshotService
	private readonly telemetryService: TelemetryService
	private readonly globalState: vscode.Memento

	constructor(
		owner: string,
		repo: string,
		globalState: vscode.Memento,
		telemetryService: TelemetryService,
		token?: string,
	) {
		this.snapshotService = new GitHubSnapshotService(owner, repo, globalState, token)
		this.telemetryService = telemetryService
		this.globalState = globalState
	}

	/**
	 * Performs daily GitHub repository analysis and sends telemetry events
	 * This is the main method that should be called once per day
	 */
	public async performDailyAnalysis(): Promise<void> {
		try {
			// Collect daily snapshot
			const { snapshot, metrics, anomaly } = await this.snapshotService.collectDailySnapshot()

			// Send main snapshot event
			await this.sendSnapshotEvent(snapshot)

			// Send anomaly event if detected
			if (anomaly) {
				await this.sendAnomalyEvent(snapshot, anomaly)
			}

			// Check for health alerts
			await this.checkAndSendHealthAlerts(snapshot, metrics)

			console.log("Daily GitHub analysis completed successfully")
		} catch (error) {
			console.error("Failed to perform daily GitHub analysis:", error)
			throw error
		}
	}

	/**
	 * Sends repository snapshot event to telemetry
	 */
	private async sendSnapshotEvent(snapshot: GitHubRepoProperties): Promise<void> {
		const baseProperties = await this.getBaseTelemetryProperties()

		this.telemetryService.captureGitHubRepoSnapshot({
			...baseProperties,
			...snapshot,
			repository_id: this.snapshotService.getRepositoryId(),
			timestamp: new Date().toISOString(),
		})
	}

	/**
	 * Sends anomaly detection event to telemetry
	 */
	private async sendAnomalyEvent(snapshot: GitHubRepoProperties, anomaly: unknown): Promise<void> {
		const baseProperties = await this.getBaseTelemetryProperties()

		this.telemetryService.captureGitHubRepoAnomaly({
			...baseProperties,
			...snapshot,
			repository_id: this.snapshotService.getRepositoryId(),
			anomaly_description: (anomaly as Record<string, unknown>).description,
			anomaly_threshold_exceeded: (anomaly as Record<string, unknown>).threshold_exceeded,
			timestamp: new Date().toISOString(),
		})
	}

	/**
	 * Checks for health alerts and sends them if needed
	 */
	private async checkAndSendHealthAlerts(snapshot: GitHubRepoProperties, _metrics: unknown): Promise<void> {
		const healthAnalysis = this.snapshotService.getRepositoryHealthAnalysis()

		// Send health alert if health score is low
		if (healthAnalysis.healthScore < 30) {
			await this.sendHealthAlert(snapshot, "low_health_score", {
				health_score: healthAnalysis.healthScore,
				insights: healthAnalysis.insights,
				recommendations: healthAnalysis.recommendations,
			})
		}

		// Send alert for high stars-to-forks ratio (indicates popularity but low adoption)
		if (snapshot.stars_forks_ratio && snapshot.stars_forks_ratio > 10) {
			await this.sendHealthAlert(snapshot, "high_stars_forks_ratio", {
				stars_forks_ratio: snapshot.stars_forks_ratio,
				recommendations: [
					"Improve developer experience and documentation",
					"Add more examples and tutorials",
					"Consider creating starter templates",
				],
			})
		}

		// Send alert for significant issue growth
		if (snapshot.delta_issues && snapshot.delta_issues > 10) {
			await this.sendHealthAlert(snapshot, "high_issue_growth", {
				delta_issues: snapshot.delta_issues,
				recommendations: [
					"Review and prioritize issue triage",
					"Consider increasing maintainer capacity",
					"Implement automated issue labeling",
				],
			})
		}
	}

	/**
	 * Sends health alert event to telemetry
	 */
	private async sendHealthAlert(
		snapshot: GitHubRepoProperties,
		alertType: string,
		alertData: Record<string, unknown>,
	): Promise<void> {
		const baseProperties = await this.getBaseTelemetryProperties()

		this.telemetryService.captureGitHubRepoHealthAlert({
			...baseProperties,
			...snapshot,
			repository_id: this.snapshotService.getRepositoryId(),
			alert_type: alertType,
			...alertData,
			timestamp: new Date().toISOString(),
		})
	}

	/**
	 * Gets base telemetry properties
	 */
	private async getBaseTelemetryProperties(): Promise<Record<string, unknown>> {
		// Get basic app properties
		const appProperties = {
			appName: "AI-IDE-BAS",
			appVersion: "0.0.9", // This should come from package.json
			platform: process.platform,
			editorName: "vscode",
			language: "en",
		}

		// Get repository configuration
		const repoConfig = this.snapshotService.getConfiguration()

		return {
			...appProperties,
			repository_owner: repoConfig?.owner,
			repository_name: repoConfig?.repo,
			has_github_token: repoConfig?.hasToken,
		}
	}

	/**
	 * Gets repository health insights
	 */
	public getRepositoryInsights(): {
		healthScore: number
		insights: string[]
		recommendations: string[]
		predictions: {
			predictedStars: number
			predictedForks: number
			confidence: number
		}
		summary: {
			totalDays: number
			totalStarsGained: number
			totalForksGained: number
			averageDailyStars: number
			averageDailyForks: number
			peakStarsDay?: string
			peakForksDay?: string
		}
	} {
		const healthAnalysis = this.snapshotService.getRepositoryHealthAnalysis()
		const summary = this.snapshotService.getSummaryStatistics()

		return {
			...healthAnalysis,
			summary,
		}
	}

	/**
	 * Gets historical data for analysis
	 */
	public getHistoricalData(): unknown[] {
		return this.snapshotService.getHistoricalData()
	}

	/**
	 * Gets data for a specific date range
	 */
	public getDataForDateRange(startDate: string, endDate: string): unknown[] {
		return this.snapshotService.getDataForDateRange(startDate, endDate)
	}

	/**
	 * Manually triggers anomaly detection
	 */
	public async detectAnomalies(): Promise<unknown> {
		const historicalData = this.snapshotService.getHistoricalData()
		if (historicalData.length === 0) {
			return { detected: false, message: "No historical data available" }
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

		return GitHubAnalyticsService.detectAnomalies(currentData, historicalData)
	}

	/**
	 * Gets growth predictions
	 */
	public getGrowthPredictions(): {
		predictedStars: number
		predictedForks: number
		confidence: number
	} {
		const historicalData = this.snapshotService.getHistoricalData()
		return GitHubAnalyticsService.predictGrowth(historicalData)
	}

	/**
	 * Checks if the service is properly configured
	 */
	public isConfigured(): boolean {
		return this.snapshotService.isConfigured()
	}

	/**
	 * Gets the repository identifier
	 */
	public getRepositoryId(): string {
		return this.snapshotService.getRepositoryId()
	}

	/**
	 * Configures the repository settings
	 */
	public async configureRepository(owner: string, repo: string, token?: string): Promise<void> {
		await this.snapshotService.configureRepository(owner, repo, token)
	}

	/**
	 * Clears all historical data
	 */
	public async clearHistoricalData(): Promise<void> {
		await this.snapshotService.clearHistoricalData()
	}

	/**
	 * Gets the current configuration
	 */
	public getConfiguration(): { owner: string; repo: string; hasToken: boolean } | undefined {
		return this.snapshotService.getConfiguration()
	}
}
