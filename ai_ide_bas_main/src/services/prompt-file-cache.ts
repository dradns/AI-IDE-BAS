/**
 * File-based cache for prompts to avoid bloating globalState
 * Uses globalStorageUri for persistent storage on disk
 * 
 * This solves the "large extension state detected" warning by moving
 * prompt cache data from memory (globalState) to disk.
 */

import * as vscode from "vscode"
import * as path from "path"

// Cache file names
const CACHE_DIR = "prompt-cache"
const CACHE_INDEX_FILE = "cache-index.json"

export interface CachedPromptData {
	systemPrompt: string
	customInstructions: string
	artifactsInstructions: string
	timestamp: number
	version?: string
	etag?: string
	status?: "published" | "draft"
	updated_at?: string
	cacheLogicVersion?: string
}

interface CacheIndex {
	entries: Record<string, { fileName: string; timestamp: number; updated_at?: string }>
	version: string
}

// Current cache format version - increment to invalidate old caches
const CACHE_FORMAT_VERSION = "1.0.0"

let cacheDir: vscode.Uri | null = null
let cacheIndex: CacheIndex | null = null
let isInitialized = false

/**
 * Initialize the file cache system
 * Must be called once during extension activation
 */
export async function initFileCache(context: vscode.ExtensionContext): Promise<void> {
	if (isInitialized) return

	if (!context.globalStorageUri) {
		console.warn("[PromptFileCache] globalStorageUri not available, file cache disabled")
		return
	}

	cacheDir = vscode.Uri.joinPath(context.globalStorageUri, CACHE_DIR)

	try {
		// Create cache directory if it doesn't exist
		await vscode.workspace.fs.createDirectory(cacheDir)
		console.log(`[PromptFileCache] Cache directory: ${cacheDir.fsPath}`)

		// Load or create cache index
		await loadCacheIndex()
		isInitialized = true
		console.log(`[PromptFileCache] Initialized with ${Object.keys(cacheIndex?.entries || {}).length} cached entries`)
	} catch (error) {
		console.error(`[PromptFileCache] Failed to initialize: ${error}`)
	}
}

/**
 * Load cache index from disk
 */
async function loadCacheIndex(): Promise<void> {
	if (!cacheDir) return

	const indexUri = vscode.Uri.joinPath(cacheDir, CACHE_INDEX_FILE)

	try {
		const data = await vscode.workspace.fs.readFile(indexUri)
		const parsed = JSON.parse(new TextDecoder().decode(data)) as CacheIndex

		// Check version compatibility
		if (parsed.version !== CACHE_FORMAT_VERSION) {
			console.log(`[PromptFileCache] Cache version mismatch (${parsed.version} vs ${CACHE_FORMAT_VERSION}), clearing cache`)
			await clearAllCache()
			cacheIndex = { entries: {}, version: CACHE_FORMAT_VERSION }
		} else {
			cacheIndex = parsed
		}
	} catch {
		// Index doesn't exist or is corrupted, create new one
		cacheIndex = { entries: {}, version: CACHE_FORMAT_VERSION }
	}
}

/**
 * Save cache index to disk
 */
async function saveCacheIndex(): Promise<void> {
	if (!cacheDir || !cacheIndex) return

	const indexUri = vscode.Uri.joinPath(cacheDir, CACHE_INDEX_FILE)
	const data = new TextEncoder().encode(JSON.stringify(cacheIndex, null, 2))
	await vscode.workspace.fs.writeFile(indexUri, data)
}

/**
 * Generate a safe filename from cache key
 */
function keyToFileName(cacheKey: string): string {
	// Replace unsafe characters with underscores
	const safe = cacheKey.replace(/[^a-zA-Z0-9_-]/g, "_")
	return `${safe}.json`
}

/**
 * Get cached prompt data from file storage
 */
export async function getFromFileCache(cacheKey: string): Promise<CachedPromptData | undefined> {
	if (!isInitialized || !cacheDir || !cacheIndex) return undefined

	const entry = cacheIndex.entries[cacheKey]
	if (!entry) return undefined

	const fileUri = vscode.Uri.joinPath(cacheDir, entry.fileName)

	try {
		const data = await vscode.workspace.fs.readFile(fileUri)
		const parsed = JSON.parse(new TextDecoder().decode(data)) as CachedPromptData
		return parsed
	} catch (error) {
		// File corrupted or missing, remove from index
		console.warn(`[PromptFileCache] Failed to read cache file for ${cacheKey}: ${error}`)
		delete cacheIndex.entries[cacheKey]
		await saveCacheIndex()
		return undefined
	}
}

/**
 * Save prompt data to file storage
 */
export async function saveToFileCache(cacheKey: string, data: CachedPromptData): Promise<void> {
	if (!isInitialized || !cacheDir || !cacheIndex) {
		console.warn(`[PromptFileCache] Not initialized, cannot save ${cacheKey}`)
		return
	}

	const fileName = keyToFileName(cacheKey)
	const fileUri = vscode.Uri.joinPath(cacheDir, fileName)

	try {
		const encoded = new TextEncoder().encode(JSON.stringify(data, null, 2))
		await vscode.workspace.fs.writeFile(fileUri, encoded)

		// Update index
		cacheIndex.entries[cacheKey] = {
			fileName,
			timestamp: data.timestamp,
			updated_at: data.updated_at,
		}
		await saveCacheIndex()

		console.log(`[PromptFileCache] Saved cache for ${cacheKey}`)
	} catch (error) {
		console.error(`[PromptFileCache] Failed to save cache for ${cacheKey}: ${error}`)
	}
}

/**
 * Delete cached prompt data
 */
export async function deleteFromFileCache(cacheKey: string): Promise<void> {
	if (!isInitialized || !cacheDir || !cacheIndex) return

	const entry = cacheIndex.entries[cacheKey]
	if (!entry) return

	const fileUri = vscode.Uri.joinPath(cacheDir, entry.fileName)

	try {
		await vscode.workspace.fs.delete(fileUri)
	} catch {
		// File might not exist, ignore
	}

	delete cacheIndex.entries[cacheKey]
	await saveCacheIndex()
	console.log(`[PromptFileCache] Deleted cache for ${cacheKey}`)
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
	if (!cacheDir) return

	try {
		// Delete cache directory and recreate
		await vscode.workspace.fs.delete(cacheDir, { recursive: true })
		await vscode.workspace.fs.createDirectory(cacheDir)
		cacheIndex = { entries: {}, version: CACHE_FORMAT_VERSION }
		await saveCacheIndex()
		console.log("[PromptFileCache] Cleared all cache")
	} catch (error) {
		console.error(`[PromptFileCache] Failed to clear cache: ${error}`)
	}
}

/**
 * Get all cache keys
 */
export function getAllCacheKeys(): string[] {
	if (!cacheIndex) return []
	return Object.keys(cacheIndex.entries)
}

/**
 * Check if file cache is available and initialized
 */
export function isFileCacheAvailable(): boolean {
	return isInitialized
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ count: number; totalSize: number }> {
	if (!isInitialized || !cacheDir || !cacheIndex) {
		return { count: 0, totalSize: 0 }
	}

	let totalSize = 0
	const count = Object.keys(cacheIndex.entries).length

	for (const entry of Object.values(cacheIndex.entries)) {
		try {
			const fileUri = vscode.Uri.joinPath(cacheDir, entry.fileName)
			const stat = await vscode.workspace.fs.stat(fileUri)
			totalSize += stat.size
		} catch {
			// File might not exist
		}
	}

	return { count, totalSize }
}

/**
 * Migrate data from globalState to file cache
 * Call this once to move existing cache data to disk
 */
export async function migrateFromGlobalState(
	context: vscode.ExtensionContext,
	cacheKeyPrefix: string
): Promise<number> {
	if (!isInitialized) {
		console.warn("[PromptFileCache] Not initialized, cannot migrate")
		return 0
	}

	let migratedCount = 0
	const allKeys = context.globalState.keys()

	for (const key of allKeys) {
		if (!key.startsWith(cacheKeyPrefix)) continue

		try {
			const data = context.globalState.get<CachedPromptData>(key)
			if (data && data.timestamp) {
				// Save to file cache
				await saveToFileCache(key, data)
				// Clear from globalState
				await context.globalState.update(key, undefined)
				migratedCount++
				console.log(`[PromptFileCache] Migrated ${key} from globalState to file`)
			}
		} catch (error) {
			console.warn(`[PromptFileCache] Failed to migrate ${key}: ${error}`)
		}
	}

	if (migratedCount > 0) {
		console.log(`[PromptFileCache] Migrated ${migratedCount} entries from globalState to file cache`)
	}

	return migratedCount
}

/**
 * Clean up old cache entries beyond TTL
 */
export async function cleanupOldCache(maxAgeMs: number): Promise<number> {
	if (!isInitialized || !cacheDir || !cacheIndex) return 0

	const now = Date.now()
	const keysToDelete: string[] = []

	for (const [key, entry] of Object.entries(cacheIndex.entries)) {
		if (now - entry.timestamp > maxAgeMs) {
			keysToDelete.push(key)
		}
	}

	for (const key of keysToDelete) {
		await deleteFromFileCache(key)
	}

	if (keysToDelete.length > 0) {
		console.log(`[PromptFileCache] Cleaned up ${keysToDelete.length} old cache entries`)
	}

	return keysToDelete.length
}
