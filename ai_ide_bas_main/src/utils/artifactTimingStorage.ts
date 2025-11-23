import * as vscode from "vscode"
import * as path from "path"

const STORAGE_KEY = "ide-bas.artifactTimings"
const EDITING_KEY = "ide-bas.editingStarts"

export interface StoredArtifactTiming {
	fileName: string // Relative path to file
	absolutePath: string // Absolute path
	artifactType: "created" | "modified"
	duration: number // Duration in milliseconds
	timeSaved?: number // Time saved in milliseconds
	timestamp: number // When was created/modified (Date.now())
	linesOfCode?: number // Number of lines of code
}

export interface AggregatedArtifactTiming {
	latest: StoredArtifactTiming
	totalDuration: number
	totalTimeSaved: number
	lastTimestamp: number
}

export class ArtifactTimingStorage {
	constructor(private context: vscode.ExtensionContext) {}

	/**
	 * Save artifact timing information
	 */
	async saveTiming(
		filePath: string,
		artifactType: "created" | "modified",
		duration: number,
		timeSaved?: number,
		linesOfCode?: number,
	): Promise<void> {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (!workspaceRoot) {
			console.log("[TIMING STORAGE] No workspace root found")
			return
		}

		const relativePath = path.relative(workspaceRoot, filePath)

		// Get current storage
		const storage = this.context.workspaceState.get<Record<string, StoredArtifactTiming[]>>(STORAGE_KEY, {})

		// Create timing record
		const timing: StoredArtifactTiming = {
			fileName: relativePath,
			absolutePath: filePath,
			artifactType,
			duration,
			timeSaved,
			timestamp: Date.now(),
			linesOfCode,
		}

		// Add to file history (keep last 10 records)
		if (!storage[relativePath]) {
			storage[relativePath] = []
		}
		storage[relativePath].unshift(timing) // Add to beginning
		storage[relativePath] = storage[relativePath].slice(0, 10) // Limit history

		// Save to workspace state
		await this.context.workspaceState.update(STORAGE_KEY, storage)

		console.log("[TIMING STORAGE] Saved timing for", relativePath, ":", {
			artifactType,
			duration: `${duration}ms`,
			timeSaved: timeSaved ? `${timeSaved}ms` : "none",
		})
	}

	/**
	 * Start manual editing timer for a file
	 */
	startEditing(filePath: string): void {
		const editingMap = this.context.workspaceState.get<Record<string, number>>(EDITING_KEY, {})
		if (editingMap[filePath]) {
			return
		}
		editingMap[filePath] = Date.now()
		this.context.workspaceState.update(EDITING_KEY, editingMap)
	}

	/**
	 * Get editing start timestamp if editing is in progress
	 */
	getEditingStart(filePath: string): number | undefined {
		const editingMap = this.context.workspaceState.get<Record<string, number>>(EDITING_KEY, {})
		return editingMap[filePath]
	}

	/**
	 * Stop editing and return elapsed duration in ms
	 */
	stopEditing(filePath: string): number | undefined {
		const editingMap = this.context.workspaceState.get<Record<string, number>>(EDITING_KEY, {})
		const start = editingMap[filePath]
		if (!start) return undefined

		const duration = Math.max(0, Date.now() - start)
		delete editingMap[filePath]
		this.context.workspaceState.update(EDITING_KEY, editingMap)
		return duration
	}

	/**
	 * Get latest timing information for a file
	 */
	getLatestTiming(filePath: string): StoredArtifactTiming | undefined {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (!workspaceRoot) return undefined

		const relativePath = path.relative(workspaceRoot, filePath)
		const storage = this.context.workspaceState.get<Record<string, StoredArtifactTiming[]>>(STORAGE_KEY, {})

		return storage[relativePath]?.[0] // First record = most recent
	}

	/**
	 * Get full timing history for a file
	 */
	getTimingHistory(filePath: string): StoredArtifactTiming[] {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (!workspaceRoot) return []

		const relativePath = path.relative(workspaceRoot, filePath)
		const storage = this.context.workspaceState.get<Record<string, StoredArtifactTiming[]>>(STORAGE_KEY, {})

		return storage[relativePath] || []
	}

	/**
	 * Get aggregated statistics (total duration, total time saved, last timestamp)
	 */
	getAggregatedTiming(filePath: string): AggregatedArtifactTiming | undefined {
		const history = this.getTimingHistory(filePath)
		if (!history.length) {
			return undefined
		}

		const totalDuration = history.reduce((sum, entry) => sum + entry.duration, 0)
		const totalTimeSaved = history.reduce((sum, entry) => {
			if (entry.timeSaved && entry.timeSaved > 0) {
				return sum + entry.timeSaved
			}
			return sum
		}, 0)

		return {
			latest: history[0],
			totalDuration,
			totalTimeSaved,
			lastTimestamp: history[0].timestamp,
		}
	}

	/**
	 * Get all saved timings
	 */
	getAllTimings(): Record<string, StoredArtifactTiming[]> {
		return this.context.workspaceState.get<Record<string, StoredArtifactTiming[]>>(STORAGE_KEY, {})
	}

	/**
	 * Clear timing history for a file
	 */
	async clearTimingHistory(filePath: string): Promise<void> {
		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (!workspaceRoot) return

		const relativePath = path.relative(workspaceRoot, filePath)
		const storage = this.context.workspaceState.get<Record<string, StoredArtifactTiming[]>>(STORAGE_KEY, {})

		delete storage[relativePath]
		await this.context.workspaceState.update(STORAGE_KEY, storage)

		console.log("[TIMING STORAGE] Cleared history for", relativePath)
	}

	/**
	 * Clear all timing data
	 */
	async clearAllTimings(): Promise<void> {
		await this.context.workspaceState.update(STORAGE_KEY, {})
		console.log("[TIMING STORAGE] Cleared all timing data")
	}
}

