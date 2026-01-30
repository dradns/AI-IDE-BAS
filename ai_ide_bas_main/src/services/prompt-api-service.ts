import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"
import * as fsp from "fs/promises"
import { AIIDEBAS_PROMPTS_API_BASE_URL } from "../shared/constants"
import {
	initFileCache,
	getFromFileCache,
	saveToFileCache,
	deleteFromFileCache,
	isFileCacheAvailable,
	migrateFromGlobalState,
	cleanupOldCache,
	type CachedPromptData,
} from "./prompt-file-cache"

interface CachedPrompt {
	content: string
	etag?: string
	timestamp: number
	version?: string
	updated_at?: string
	cacheLogicVersion?: string
}

// Re-export for backwards compatibility
export type { CachedPromptData }

// Flag to track if file cache migration has been done
let fileCacheMigrationDone = false

// Cache timing constants (synced with auto-refresh interval)
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000 + 24 * 1000
const CACHE_TTL = AUTO_REFRESH_INTERVAL * 1.5
const BACKGROUND_CHECK_INTERVAL = AUTO_REFRESH_INTERVAL
const CACHE_KEY_PREFIX = "prompt_cache_"
const CACHE_KEY_PREFIX_SEPARATED = "prompt_cache_separated_"

// Increment on cache logic changes to auto-invalidate old cache
const CACHE_LOGIC_VERSION = "3.6.0"

// Export debounce to prevent multiple exports on batch updates
let exportDebounceTimer: NodeJS.Timeout | null = null
let isExportInProgress = false
export type ExportPromptsOptions = { forceWriteAll?: boolean }
let exportQueue: Array<{ context: vscode.ExtensionContext; reason: string; onlyRoles?: string[]; options?: ExportPromptsOptions }> = []
const EXPORT_TIMEOUT_MS = 60000 // 60 seconds timeout for export

/** Normalize content for comparison so only real changes count (line endings, trim). */
function normalizeContentForCompare(s: string): string {
	return s.replace(/\r\n|\r/g, "\n").trim()
}

// API error tracking with exponential backoff
interface ApiErrorState {
	lastError: number
	errorCount: number
	nextRetryAt: number
}
const apiErrorStates = new Map<string, ApiErrorState>()

// Cache update locks to prevent race conditions
const cacheUpdateLocks = new Map<string, Promise<void>>()

// Load build config to check feature flags
interface IBuildConfig {
	featureFlags: {
		isImmediateUpdate: boolean
	}
}
let buildConfig: IBuildConfig = {
	featureFlags: {
		isImmediateUpdate: false
	}
}
// Only load build config in Node (extension host). In webview __dirname/fs are undefined.
if (typeof __dirname !== "undefined" && typeof fs.existsSync === "function") {
	try {
		const configPath = path.join(__dirname, "..", "..", "extension-build-config.json")
		const configPathSrc = path.join(__dirname, "..", "extension-build-config.json")
		let configPathToUse: string | null = null
		if (fs.existsSync(configPath)) {
			configPathToUse = configPath
		} else if (fs.existsSync(configPathSrc)) {
			configPathToUse = configPathSrc
		}
		if (configPathToUse) {
			const raw = fs.readFileSync(configPathToUse, "utf8")
			buildConfig = JSON.parse(raw)
			console.log(`[PromptAPI] Loaded build config from ${configPathToUse}, isImmediateUpdate=${buildConfig.featureFlags.isImmediateUpdate}`)
		}
	} catch (e) {
		console.warn(`[PromptAPI] Failed to load build config, using defaults: ${e}`)
	}
}

// Dynamic export debounce delay based on feature flag
function getExportDebounceDelay(): number {
	return buildConfig.featureFlags.isImmediateUpdate ? 15000 : 5000
}

// Exponential backoff delay calculation
function getBackoffDelay(errorCount: number): number {
	return Math.min(Math.pow(2, errorCount) * 1000, 5 * 60 * 1000) // Max 5 minutes
}

// Check if request should be skipped due to recent errors
function shouldSkipRequest(mode: string): boolean {
	const state = apiErrorStates.get(mode)
	if (!state) return false
	
	const now = Date.now()
	if (now < state.nextRetryAt) {
		console.log(`[PromptAPI] Skipping request for ${mode}, retry after ${Math.round((state.nextRetryAt - now) / 1000)}s`)
		return true
	}
	return false
}

// Record API error and set backoff
function recordApiError(mode: string): void {
	const state = apiErrorStates.get(mode) || { lastError: 0, errorCount: 0, nextRetryAt: 0 }
	state.errorCount++
	state.lastError = Date.now()
	state.nextRetryAt = Date.now() + getBackoffDelay(state.errorCount)
	apiErrorStates.set(mode, state)
	console.warn(`[PromptAPI] Recorded error for ${mode}, errorCount=${state.errorCount}, retry after ${Math.round(getBackoffDelay(state.errorCount) / 1000)}s`)
}

// Clear error state on successful request
function recordApiSuccess(mode: string): void {
	apiErrorStates.delete(mode)
}

// Validate new format API response item
function validateNewFormatItem(item: any): boolean {
	if (!item || typeof item !== 'object') {
		console.warn(`[PromptAPI] Invalid item: not an object`)
		return false
	}
	if (!item.status) {
		console.warn(`[PromptAPI] Invalid item: missing status`)
		return false
	}
	if (!item.updated_at) {
		console.warn(`[PromptAPI] Invalid item: missing updated_at`)
		return false
	}
	const hasTemplate = item.template && typeof item.template === 'object'
	const hasDirectFields = item.systemPrompt || item.customInstructions || item.promptContent || item.artifactsInstructions || item.artifacts_instructions
	const hasArtifacts = item.artifacts && (Array.isArray(item.artifacts) || typeof item.artifacts === 'object')
	if (!hasTemplate && !hasDirectFields && !hasArtifacts) {
		console.warn(`[PromptAPI] Invalid item: no template, direct fields, or artifacts. Item keys:`, Object.keys(item))
		return false
	}
	return true
}

// Atomic cache update to prevent race conditions
// Now uses file-based cache instead of globalState to avoid memory bloat
async function atomicCacheUpdate(
	context: vscode.ExtensionContext,
	cacheKey: string,
	oldUpdatedAt: string | undefined,
	newData: CachedPromptSeparated
): Promise<boolean> {
	const existingLock = cacheUpdateLocks.get(cacheKey)
	if (existingLock) {
		await existingLock
	}
	
	let resolveLock: () => void
	const lock = new Promise<void>((resolve) => {
		resolveLock = resolve
	})
	cacheUpdateLocks.set(cacheKey, lock)
	
	try {
		// Use file cache if available, otherwise fall back to globalState
		if (isFileCacheAvailable()) {
			const currentCached = await getFromFileCache(cacheKey)
			if (currentCached && currentCached.updated_at !== oldUpdatedAt) {
				console.log(`[PromptAPI] Cache was updated by another process, skipping update`)
				return false
			}
			await saveToFileCache(cacheKey, newData)
		} else {
			const currentCached = context.globalState.get<CachedPromptSeparated>(cacheKey)
			if (currentCached && currentCached.updated_at !== oldUpdatedAt) {
				console.log(`[PromptAPI] Cache was updated by another process, skipping update`)
				return false
			}
			await context.globalState.update(cacheKey, newData)
		}
		return true
	} finally {
		cacheUpdateLocks.delete(cacheKey)
		resolveLock!()
	}
}

/**
 * Initialize the prompt cache system
 * Should be called during extension activation
 */
export async function initPromptCache(context: vscode.ExtensionContext): Promise<void> {
	// Initialize file-based cache
	await initFileCache(context)
	
	// Migrate existing data from globalState to file cache (one-time)
	if (!fileCacheMigrationDone && isFileCacheAvailable()) {
		try {
			const migratedSeparated = await migrateFromGlobalState(context, CACHE_KEY_PREFIX_SEPARATED)
			const migratedLegacy = await migrateFromGlobalState(context, CACHE_KEY_PREFIX)
			if (migratedSeparated > 0 || migratedLegacy > 0) {
				console.log(`[PromptAPI] Migrated ${migratedSeparated + migratedLegacy} cache entries to file storage`)
			}
			fileCacheMigrationDone = true
		} catch (error) {
			console.warn(`[PromptAPI] Cache migration failed: ${error}`)
		}
	}
	
	// Clean up old cache entries (older than 7 days)
	if (isFileCacheAvailable()) {
		const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
		await cleanupOldCache(SEVEN_DAYS_MS).catch(err => {
			console.warn(`[PromptAPI] Cache cleanup failed: ${err}`)
		})
	}
}

// Safe export with queue and timeout protection. Writes ONLY to extension dist/prompts; never to user .roo dirs (project .roo or ~/.roo/rules).
async function safeExportPrompts(
	context: vscode.ExtensionContext,
	reason: string,
	onlyRoles?: string[],
	options?: ExportPromptsOptions
): Promise<void> {
	if (isExportInProgress) {
		console.log(`[PromptAPI] Export in progress, queuing export: ${reason}`)
		exportQueue.push({ context, reason, onlyRoles, options })
		return
	}

	isExportInProgress = true
	const startTime = Date.now()

	try {
		console.log(`[PromptAPI] Starting export: ${reason}${onlyRoles ? ` (only roles: ${onlyRoles.join(", ")})` : ""}${options?.forceWriteAll ? " [forceWriteAll]" : ""}`)
		const { exportPromptsToExtensionDist } = await import("./prompt-export-service")
		await Promise.race([
			exportPromptsToExtensionDist(context, onlyRoles, options),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error("Export timeout")), EXPORT_TIMEOUT_MS)
			)
		])
		console.log(`[PromptAPI] Export completed: ${reason} (took ${Date.now() - startTime}ms)`)
	} catch (error: any) {
		console.warn(`[PromptAPI] Export failed: ${reason}, error: ${error.message || error}`)
	} finally {
		isExportInProgress = false

		if (exportQueue.length > 0) {
			const next = exportQueue.shift()!
			setTimeout(() => safeExportPrompts(next.context, next.reason, next.onlyRoles, next.options), 1000)
		}
	}
}

// Returns cache key for prompt
function getCacheKey(mode: string, language?: string): string {
	const lang = language ? normalizeLang(language) || "all" : "all"
	return `${CACHE_KEY_PREFIX}${mode}_${lang}`
}

// Returns cache key for separated prompt data
export function getCacheKeySeparated(mode: string, language?: string): string {
	const lang = language ? normalizeLang(language) || "all" : "all"
	return `${CACHE_KEY_PREFIX_SEPARATED}${mode}_${lang}`
}

export interface CachedPromptSeparated {
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

export interface PromptApiResponse {
	prompts: Array<{
		id: string
		name: string
		description: string
		artifact_type: string
		target_roles: string[]
		tags: string[]
		emoji?: string
		template: {
			prompt?: string | Record<string, string>                      // v2 format: single prompt field
			role?: { content: string | Record<string, string> }           // legacy format
			project?: { content: string | Record<string, string> }
			tasks?: { content: string | Record<string, string> }
			instructions?: {
				content?: string | Record<string, string>
				example?: any
				self_check?: any
				recommendations?: any
				[key: string]: any                                        // dynamic artifact keys
			}
			system_prompt?: { content: string | Record<string, string> }
		}
		status: string
		version: string
		updated_at?: string
	}>
	total: number
}

// Select latest prompt by updated_at, filtered by status and optional role
function selectLatestPrompt(
	prompts: PromptApiResponse["prompts"],
	status: "published" | "draft",
	targetRole?: string
): PromptApiResponse["prompts"][0] | undefined {
	let filtered = prompts.filter((p) => {
		if (p.status !== status) return false
		if (targetRole) {
			const hasRole = p.target_roles?.some(tr => tr.toUpperCase() === targetRole.toUpperCase())
			if (!hasRole) return false
		}
		return true
	})

	if (filtered.length === 0) return undefined

	filtered.sort((a, b) => {
		const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
		const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
		if (aTime !== bTime) return bTime - aTime
		return a.id.localeCompare(b.id)
	})

	return filtered[0]
}

// Normalize language code (e.g., "pt-BR" -> "pt", "zh-CN" -> "zh")
function normalizeLang(lang?: string): string | undefined {
	if (!lang) return undefined
	const baseLang = lang.split("-")[0].toLowerCase()
	const langMap: Record<string, string> = { zh: "zh", pt: "pt" }
	return langMap[baseLang] || baseLang
}

// Extract text from multilingual value (string, array, or {lang: text} object)
function pickText(value: any, lang?: string): string {
	if (!value) return ""
	if (typeof value === "string") return value
	if (Array.isArray(value)) {
		return value.filter(item => item && typeof item === "string").join("\n")
	}
	if (typeof value === "object") {
		const normalizedLang = lang ? normalizeLang(lang) : undefined

		// Try normalized language first
		if (normalizedLang && normalizedLang in value) {
			const result = pickText(value[normalizedLang], undefined)
			// Return result even if empty - language exists but has no content
			// Don't fallback to other languages if requested language key exists
			if (result || value[normalizedLang] === "") return result
		}

		// Try original language code
		if (lang && lang in value) {
			const result = pickText(value[lang], undefined)
			if (result || value[lang] === "") return result
		}

		// Try language variants (zh-CN, pt-BR, es-ES, ar-SA)
		const langVariants = ["zh", "pt", "es", "ar"]
		if (normalizedLang && langVariants.includes(normalizedLang)) {
			const variantKey = Object.keys(value).find(key => key.toLowerCase().startsWith(normalizedLang))
			if (variantKey) {
				const result = pickText(value[variantKey], undefined)
				if (result || value[variantKey] === "") return result
			}
		}

		// Return empty if specific language requested but not found
		if (lang || normalizedLang) return ""

		// Fallback to English or first available (only when no language specified)
		if (value["en"]) return pickText(value["en"], undefined)
		const firstKey = Object.keys(value)[0]
		if (firstKey) return pickText(value[firstKey], undefined)
	}
	return ""
}

// Build system prompt from template.system_prompt section
function buildSystemPromptFromTemplate(template: any, lang?: string): string {
	if (template.system_prompt?.content) {
		const systemPrompt = pickText(template.system_prompt.content, lang)
		if (systemPrompt.trim()) return systemPrompt.trim()
	}
	return ""
}

// Build custom instructions from template.prompt (v2) or template.role (legacy)
function buildCustomInstructionsFromTemplate(template: any, lang?: string): string {
	const normalizedLangForData = lang ? normalizeLang(lang) : undefined

	// v2 format: single prompt field
	if (template.prompt !== undefined && template.prompt !== null) {
		const promptText = pickText(template.prompt, normalizedLangForData)
		if (promptText && promptText.trim()) {
			console.log(`[PromptAPI] Using v2 format: template.prompt, lang=${lang}, length=${promptText.length}`)
			return promptText.trim()
		}
		console.log(`[PromptAPI] v2 format detected but no content for lang=${lang}`)
		return ""
	}

	// Legacy format: role section only
	console.log(`[PromptAPI] Using legacy format (role only)`)
	if (template.role?.content) {
		const roleText = pickText(template.role.content, normalizedLangForData)
		if (roleText) {
			console.log(`[PromptAPI] Added role to custom instructions, lang=${lang}, length=${roleText.length}`)
			return roleText.trim()
		}
		console.warn(`[PromptAPI] Role content empty for lang=${lang}`)
	}

	console.log(`[PromptAPI] No custom instructions content for lang=${lang}`)
	return ""
}

// Build artifacts instructions from template.instructions dynamic keys (01_Test, 02_Backend, etc.)
function buildArtifactsInstructionsFromTemplate(template: any, lang?: string): string {
	const artifactParts: string[] = []
	const normalizedLangForData = lang ? normalizeLang(lang) : undefined

	if (!template.instructions) {
		console.log(`[PromptAPI] No template.instructions found`)
		return ""
	}

	const hasNewFormat = template.prompt !== undefined && template.prompt !== null
	console.log(`[PromptAPI] Building artifacts, lang=${lang}, format=${hasNewFormat ? "v2" : "legacy"}`)

	// Exclude standard fields - not artifacts
	const standardFields = new Set(["content", "example", "self_check", "recommendations", "positive"])
	const artifacts: Array<{ key: string; content: string }> = []

	for (const key of Object.keys(template.instructions)) {
		if (standardFields.has(key)) continue

		const artifact = template.instructions[key]
		if (artifact && typeof artifact === "object") {
			console.log(`[PromptAPI] Found artifact: ${key}`)
			const instructionsText = artifact.instructions
				? pickText(artifact.instructions, normalizedLangForData)
				: artifact.content
					? pickText(artifact.content, normalizedLangForData)
					: ""

			if (instructionsText && instructionsText.trim()) {
				artifacts.push({ key, content: instructionsText.trim() })
				console.log(`[PromptAPI] Added artifact ${key}, length=${instructionsText.trim().length}`)
			} else {
				console.warn(`[PromptAPI] Artifact ${key} empty for lang=${lang}`)
			}
		}
	}

	// Sort by numeric prefix (01_, 02_, etc.)
	artifacts.sort((a, b) => {
		const aNum = a.key.match(/^(\d+)_/)
		const bNum = b.key.match(/^(\d+)_/)
		if (aNum && bNum) return parseInt(aNum[1]) - parseInt(bNum[1])
		if (aNum) return -1
		if (bNum) return 1
		return a.key.localeCompare(b.key)
	})

	for (const artifact of artifacts) {
		artifactParts.push(artifact.content)
	}

	const result = artifactParts.join("\n\n")
	console.log(`[PromptAPI] Built ${artifactParts.length} artifacts, ${result.length} chars`)
	return result
}

// Extract artifacts as structured array from template.instructions
export function extractArtifactsFromTemplate(
	template: any,
	lang?: string
): Array<{ key: string; content: string; name?: string }> {
	const normalizedLangForData = lang ? normalizeLang(lang) : undefined
	const artifacts: Array<{ key: string; content: string; name?: string }> = []

	if (!template.instructions) {
		console.log(`[PromptAPI] extractArtifacts: No template.instructions`)
		return artifacts
	}

	const hasNewFormat = template.prompt !== undefined && template.prompt !== null
	console.log(`[PromptAPI] extractArtifacts: lang=${lang}, format=${hasNewFormat ? "v2" : "legacy"}`)

	const standardFields = new Set(["content", "example", "self_check", "recommendations", "positive"])

	for (const key of Object.keys(template.instructions)) {
		if (standardFields.has(key)) continue

		const artifact = template.instructions[key]
		if (artifact && typeof artifact === "object") {
			const instructionsText = artifact.instructions
				? pickText(artifact.instructions, normalizedLangForData)
				: artifact.content
					? pickText(artifact.content, normalizedLangForData)
					: ""

			if (instructionsText && instructionsText.trim()) {
				let displayName: string | undefined
				if (artifact.name) {
					const nameText = pickText(artifact.name, normalizedLangForData)
					if (nameText?.trim()) displayName = nameText.trim()
				}
				artifacts.push({ key, content: instructionsText.trim(), name: displayName })
				console.log(`[PromptAPI] extractArtifacts: ${key}, length=${instructionsText.trim().length}`)
			} else {
				console.warn(`[PromptAPI] extractArtifacts: ${key} empty for lang=${lang}`)
			}
		}
	}

	// Sort by numeric prefix
	artifacts.sort((a, b) => {
		const aNum = a.key.match(/^(\d+)_/)
		const bNum = b.key.match(/^(\d+)_/)
		if (aNum && bNum) return parseInt(aNum[1]) - parseInt(bNum[1])
		if (aNum) return -1
		if (bNum) return 1
		return a.key.localeCompare(b.key)
	})

	console.log(`[PromptAPI] extractArtifacts: Total ${artifacts.length}`)
	return artifacts
}

// @deprecated Build full prompt from template (use separated functions instead)
function buildPromptContent(template: any, lang?: string): string {
	const parts: string[] = []
	const systemPrompt = buildSystemPromptFromTemplate(template, lang)
	if (systemPrompt) parts.push(`## System Prompt\n${systemPrompt}`)
	const customInstructions = buildCustomInstructionsFromTemplate(template, lang)
	if (customInstructions) parts.push(customInstructions)
	return parts.join("\n\n")
}

// Cache for mode -> target_roles mapping from API
const modeToTargetRolesCache = new Map<string, string[]>()

// Store target_roles for a mode (called when loading roles from API)
export function setModeTargetRoles(mode: string, targetRoles: string[]): void {
	modeToTargetRolesCache.set(mode.toLowerCase(), targetRoles)
	console.log(`[PromptAPI] Cached target_roles for mode=${mode}: ${targetRoles.join(", ")}`)
}

// Get cached target_roles for a mode
export function getModeTargetRoles(mode: string): string[] | undefined {
	return modeToTargetRolesCache.get(mode.toLowerCase())
}

// Map mode slug to backend role name
export function modeToRole(mode: string): string {
	const builtinRoles = ["ask", "code", "debug", "architect", "designer", "pm", "helper"]
	const modeLower = mode.toLowerCase()

	if (builtinRoles.includes(modeLower)) return modeLower

	const targetRoles = getModeTargetRoles(mode)
	if (targetRoles && targetRoles.length > 0) {
		console.log(`[PromptAPI] Using cached target_roles for mode=${mode}: ${targetRoles[0]}`)
		return targetRoles[0].toLowerCase()
	}

	return modeLower
}

// Map backend role name to mode slug
export function roleToMode(role: string): string {
	return role.toLowerCase()
}

// Check for updates in background (legacy, uses updated_at comparison)
async function checkForUpdatesInBackground(
	mode: string,
	language: string | undefined,
	apiBaseUrl: string | undefined,
	cached: CachedPrompt,
	context: vscode.ExtensionContext
): Promise<void> {
	const age = Date.now() - cached.timestamp
	if (age < AUTO_REFRESH_INTERVAL) return

	try {
		const role = modeToRole(mode)
		const normalizedLang = normalizeLang(language)
		const params = new URLSearchParams({ role })
		if (normalizedLang) params.append("lang", normalizedLang)
		if (!apiBaseUrl) apiBaseUrl = AIIDEBAS_PROMPTS_API_BASE_URL

		const url = `${apiBaseUrl}/api/v1/prompts/?${params.toString()}`
		console.log(`[PromptAPI] Background check for mode=${mode}`)

		const response = await fetch(url, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(3000),
		})

		if (response.status === 429) {
			console.log(`[PromptAPI] Background check: rate limit (429)`)
			return
		}

		if (response.ok) {
			const data: PromptApiResponse = await response.json()
			const prompt = selectLatestPrompt(data.prompts || [], "published", role)

			if (prompt) {
				const cachedUpdatedAt = normalizeUpdatedAt(cached.updated_at)
				const promptUpdatedAt = normalizeUpdatedAt(prompt.updated_at)
				if (cachedUpdatedAt === promptUpdatedAt && cachedUpdatedAt !== undefined) {
					console.log(`[PromptAPI] Background: prompt unchanged`)
					const cacheKey = getCacheKey(mode, language)
					await context.globalState.update(cacheKey, {
						...cached,
						timestamp: Date.now(),
						cacheLogicVersion: CACHE_LOGIC_VERSION,
					})
					return
				}

				console.log(`[PromptAPI] Background: prompt changed, updating cache`)
				const content = buildPromptContent(prompt.template, normalizedLang)
				if (content.trim()) {
					const cacheKey = getCacheKey(mode, language)
					await context.globalState.update(cacheKey, {
						content,
						etag: response.headers.get("ETag") || undefined,
						timestamp: Date.now(),
						version: prompt.version,
						updated_at: prompt.updated_at,
						cacheLogicVersion: CACHE_LOGIC_VERSION,
					})
					console.log(`[PromptAPI] Background cache updated for mode=${mode}`)
				}
			}
		}
	} catch (error) {
		console.debug(`[PromptAPI] Background check failed:`, error)
	}
}

// Load prompt with separated systemPrompt, customInstructions, and artifactsInstructions
export async function loadPromptFromApiSeparated(
	mode: string,
	language?: string,
	apiBaseUrl?: string,
	context?: vscode.ExtensionContext,
	onlyPublished: boolean = false,
	useCacheOnly: boolean = false,
	forceRefresh: boolean = false
): Promise<{ systemPrompt: string; customInstructions: string; artifactsInstructions: string } | null> {
	const role = modeToRole(mode)
	const normalizedLang = normalizeLang(language)
	const cacheKey = getCacheKeySeparated(mode, language)
	
	// Try loading from cache (skip if forceRefresh=true)
	let cached: CachedPromptSeparated | undefined
	if (context && !forceRefresh) {
		// Use file cache if available, otherwise fall back to globalState
		if (isFileCacheAvailable()) {
			cached = await getFromFileCache(cacheKey)
		} else {
			cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
		}
		if (cached) {
			// Invalidate cache if logic version mismatch
			if (cached.cacheLogicVersion !== CACHE_LOGIC_VERSION) {
				console.log(`[PromptAPI] Cache version mismatch, invalidating`)
				cached = undefined
			} else {
				const age = Date.now() - cached.timestamp
				if (age < CACHE_TTL) {
					console.log(`[PromptAPI] Using cached prompt for mode=${mode}, age=${Math.round(age / 1000)}s`)
					// Start background update check только если useCacheOnly=false
					// При useCacheOnly=true не делаем фоновые запросы к API
					if (!useCacheOnly) {
						checkForUpdatesSeparatedInBackground(mode, language, apiBaseUrl, cached, context).catch((err) => {
							console.debug(`[PromptAPI] Background check failed:`, err)
						})
					}
					return {
						systemPrompt: cached.systemPrompt || "",
						customInstructions: cached.customInstructions || "",
						artifactsInstructions: cached.artifactsInstructions || "",
					}
				} else {
					console.log(`[PromptAPI] Cache expired for mode=${mode}, fetching fresh`)
				}
			}
		}
	}
	
	// If forceRefresh=true, clear cache before fetching
	if (forceRefresh && context) {
		console.log(`[PromptAPI] Force refresh requested for mode=${mode}, clearing cache`)
		await clearPromptCache(context, mode, language)
		cached = undefined
	}

	// Если useCacheOnly=true, используем кэш даже если он устарел, или возвращаем null
	if (useCacheOnly) {
		if (cached && cached.status === "published") {
			console.log(`[PromptAPI] Using cache only (even if expired) for mode=${mode}`)
			return {
				systemPrompt: cached.systemPrompt || "",
				customInstructions: cached.customInstructions || "",
				artifactsInstructions: cached.artifactsInstructions || "",
			}
		}
		console.log(`[PromptAPI] No cache available for mode=${mode}, returning null (useCacheOnly=true)`)
		return null
	}

	// Check if request should be skipped due to recent errors
	if (shouldSkipRequest(mode)) {
		if (cached && cached.status === "published") {
			console.log(`[PromptAPI] Using cache due to recent errors`)
			return {
				systemPrompt: cached.systemPrompt || "",
				customInstructions: cached.customInstructions || "",
				artifactsInstructions: cached.artifactsInstructions || "",
			}
		}
		return null
	}

	// Determine API base URL
	if (!apiBaseUrl) {
		const envApiUrl = AIIDEBAS_PROMPTS_API_BASE_URL
		if (envApiUrl.includes("localhost") || envApiUrl.includes("127.0.0.1")) {
			apiBaseUrl = "http://localhost:8000"
		} else {
			apiBaseUrl = envApiUrl
		}
	}

	try {
		const params = new URLSearchParams({ role })
		if (normalizedLang) params.append("lang", normalizedLang)
		const url = `${apiBaseUrl}/api/v1/prompts/?${params.toString()}`
		const headers: Record<string, string> = { "Content-Type": "application/json" }

		console.log(`[PromptAPI] Fetching prompt for mode=${mode}`)

		const response = await fetch(url, {
			method: "GET",
			headers,
			signal: AbortSignal.timeout(apiBaseUrl.includes("localhost") ? 2000 : 5000),
		})

		// Handle rate limit
		if (response.status === 429) {
			recordApiError(mode)
			const retryAfter = response.headers.get("Retry-After")
			console.warn(`[PromptAPI] Rate limit (429), retry after ${retryAfter || 60}s`)
			if (cached && cached.cacheLogicVersion === CACHE_LOGIC_VERSION) {
				console.log(`[PromptAPI] Using cache due to rate limit`)
				return {
					systemPrompt: cached.systemPrompt || "",
					customInstructions: cached.customInstructions || "",
					artifactsInstructions: cached.artifactsInstructions || "",
				}
			}
			return null
		}

		if (!response.ok) {
			recordApiError(mode)
			console.warn(`[PromptAPI] HTTP ${response.status}`)
			if (cached && cached.status === "published") {
				console.log(`[PromptAPI] Using cached prompt on API error`)
				return {
					systemPrompt: cached.systemPrompt || "",
					customInstructions: cached.customInstructions || "",
					artifactsInstructions: cached.artifactsInstructions || "",
				}
			}
			return null
		}

		recordApiSuccess(mode)

		const rawData = await response.json()

		// Check response format (array = new format, object = legacy)
		if (Array.isArray(rawData)) {
			console.log(`[PromptAPI] New format: ${rawData.length} items for role=${role}`)

			if (rawData.length === 0) {
				console.warn(`[PromptAPI] Empty array for role=${role}`)
				if (cached && cached.status === "published") {
					console.log(`[PromptAPI] Using cached prompt`)
					return {
						systemPrompt: cached.systemPrompt || "",
						customInstructions: cached.customInstructions || "",
						artifactsInstructions: cached.artifactsInstructions || "",
					}
				}
				return null
			}

			// Find published prompt
			const publishedItems = rawData.filter((item: any) => item.status === "published")
			const item = publishedItems.length > 0 ? publishedItems[0] : (onlyPublished ? null : rawData[0])

			if (!item) {
				console.warn(`[PromptAPI] No published items for role=${role}`)
				return null
			}

			// Validate item structure
			if (!validateNewFormatItem(item)) {
				console.warn(`[PromptAPI] Invalid item structure for role=${role}, using cache if available`)
				if (cached && cached.status === "published") {
					return {
						systemPrompt: cached.systemPrompt || "",
						customInstructions: cached.customInstructions || "",
						artifactsInstructions: cached.artifactsInstructions || "",
					}
				}
				return null
			}

			console.log(`[PromptAPI] New format item: slug=${item.slug}, status=${item.status}`)

			// Check if unchanged by updated_at (normalize for comparison)
			const cachedUpdatedAt = normalizeUpdatedAt(cached?.updated_at)
			const itemUpdatedAt = normalizeUpdatedAt(item.updated_at)
			if (cached && cachedUpdatedAt === itemUpdatedAt && cachedUpdatedAt !== undefined) {
				console.log(`[PromptAPI] Prompt unchanged, using cache`)
				if (context) {
					await context.globalState.update(cacheKey, {
						...cached,
						timestamp: Date.now(),
						cacheLogicVersion: CACHE_LOGIC_VERSION,
					})
				}
				return {
					systemPrompt: cached.systemPrompt || "",
					customInstructions: cached.customInstructions || "",
					artifactsInstructions: cached.artifactsInstructions || "",
				}
			}

			// Extract data from new format - use template if available, otherwise direct fields
			let systemPrompt = ""
			let customInstructions = ""
			let artifactsInstructions = ""

			if (item.template) {
				// Use template functions (preferred method)
				systemPrompt = buildSystemPromptFromTemplate(item.template, normalizedLang)
				customInstructions = buildCustomInstructionsFromTemplate(item.template, language)
				artifactsInstructions = buildArtifactsInstructionsFromTemplate(item.template, language)
				console.log(`[PromptAPI] Using template: systemPrompt=${systemPrompt.length} chars, customInstructions=${customInstructions.length} chars, artifactsInstructions=${artifactsInstructions.length} chars`)
				
				// Если template вернул пустые строки, пробуем direct fields как fallback
				if (!systemPrompt && !customInstructions && !artifactsInstructions) {
					console.log(`[PromptAPI] Template returned empty, trying direct fields as fallback`)
					systemPrompt = item.systemPrompt || item.system_prompt || ""
					customInstructions = item.customInstructions || item.promptContent || item.exportedCustomInstructions || item.custom_instructions || ""
					artifactsInstructions = item.artifactsInstructions || item.artifacts_instructions || item.instructions || ""
					
					// Также пробуем извлечь артефакты из item.artifacts
					if (!artifactsInstructions && item.artifacts) {
						try {
							const extractedArtifacts = extractArtifactsFromTemplate(item.template, language)
							if (extractedArtifacts.length > 0) {
								artifactsInstructions = extractedArtifacts.map(a => a.content).join("\n\n")
								console.log(`[PromptAPI] Extracted ${extractedArtifacts.length} artifacts from template`)
							}
						} catch (error) {
							console.warn(`[PromptAPI] Failed to extract artifacts: ${error}`)
						}
						
						// Если все еще нет, проверяем item.artifacts напрямую
						if (!artifactsInstructions) {
							let artifactsForLang: Array<{ key: string; content: string; name?: string }> = []
							if (Array.isArray(item.artifacts)) {
								artifactsForLang = item.artifacts
							} else if (typeof item.artifacts === 'object' && normalizedLang) {
								if (item.artifacts[normalizedLang] && Array.isArray(item.artifacts[normalizedLang])) {
									artifactsForLang = item.artifacts[normalizedLang]
								} else {
									// Try case-insensitive match
									for (const [key, value] of Object.entries(item.artifacts)) {
										if (key.toLowerCase() === normalizedLang.toLowerCase() && Array.isArray(value)) {
											artifactsForLang = value as Array<{ key: string; content: string; name?: string }>
											break
										}
									}
								}
							}
							
							if (artifactsForLang.length > 0) {
								artifactsInstructions = artifactsForLang.map(a => a.content).join("\n\n")
								console.log(`[PromptAPI] Found ${artifactsForLang.length} artifacts in item.artifacts`)
							}
						}
					}
					
					console.log(`[PromptAPI] After fallback: systemPrompt=${systemPrompt.length} chars, customInstructions=${customInstructions.length} chars, artifactsInstructions=${artifactsInstructions.length} chars`)
				}
			} else {
				// Fallback: extract directly from fields
				systemPrompt = item.systemPrompt || item.system_prompt || ""
				customInstructions = item.customInstructions || item.promptContent || item.exportedCustomInstructions || item.custom_instructions || ""
				artifactsInstructions = item.artifactsInstructions || item.artifacts_instructions || item.instructions || ""
				console.log(`[PromptAPI] Using direct fields: systemPrompt=${systemPrompt.length} chars, customInstructions=${customInstructions.length} chars, artifactsInstructions=${artifactsInstructions.length} chars`)
			}

			// Save to cache
			if (context) {
				const newData: CachedPromptSeparated = {
					systemPrompt,
					customInstructions,
					artifactsInstructions,
					timestamp: Date.now(),
					version: item.version || "1.0",
					etag: response.headers.get("ETag") || undefined,
					status: item.status,
					updated_at: item.updated_at,
					cacheLogicVersion: CACHE_LOGIC_VERSION,
				}
				await atomicCacheUpdate(context, cacheKey, cached?.updated_at, newData)
				console.log(`[PromptAPI] Cached for mode=${mode}`)
			}

			return { systemPrompt, customInstructions, artifactsInstructions }
		}

		// Legacy format: { prompts: [...] }
		const data: PromptApiResponse = rawData
		console.log(`[PromptAPI] Legacy format: ${data.prompts?.length || 0} prompts for role=${role}`)

		if (!data.prompts || data.prompts.length === 0) {
			console.warn(`[PromptAPI] No prompts for role=${role}`)
			if (cached && cached.status === "published") {
				console.log(`[PromptAPI] Using cached prompt`)
				return {
					systemPrompt: cached.systemPrompt || "",
					customInstructions: cached.customInstructions || "",
					artifactsInstructions: cached.artifactsInstructions || "",
				}
			}
			return null
		}

		// Get latest published prompt
		let prompt = selectLatestPrompt(data.prompts, "published", role)
		let useDraft = false

		// Check if unchanged (normalize for comparison)
		const cachedUpdatedAt = normalizeUpdatedAt(cached?.updated_at)
		const promptUpdatedAt = normalizeUpdatedAt(prompt?.updated_at)
		if (prompt && cached && cachedUpdatedAt === promptUpdatedAt && cachedUpdatedAt !== undefined) {
			console.log(`[PromptAPI] Prompt unchanged, using cache`)
			if (context) {
				await context.globalState.update(cacheKey, {
					...cached,
					timestamp: Date.now(),
					cacheLogicVersion: CACHE_LOGIC_VERSION,
				})
			}
			return {
				systemPrompt: cached.systemPrompt || "",
				customInstructions: cached.customInstructions || "",
				artifactsInstructions: cached.artifactsInstructions || "",
			}
		}

		if (prompt && cached && cached.updated_at !== prompt.updated_at) {
			console.log(`[PromptAPI] Prompt changed, updating cache`)
		}

		// Fallback: try finding by status only (only if not onlyPublished)
		if (!prompt && !onlyPublished) {
			prompt = selectLatestPrompt(data.prompts, "published")
			if (!prompt) {
				prompt = selectLatestPrompt(data.prompts, "draft", role)
				if (prompt) {
					useDraft = true
					console.log(`[PromptAPI] Using draft for role=${role}`)
				}
			} else {
				console.warn(`[PromptAPI] Found published but target_roles mismatch for role=${role}`)
			}
		} else if (!prompt && onlyPublished) {
			console.log(`[PromptAPI] No published prompts for role=${role} (onlyPublished=true)`)
		}

		// Last fallback: draft by status only
		if (!prompt && !onlyPublished) {
			prompt = selectLatestPrompt(data.prompts, "draft")
			if (prompt) {
				useDraft = true
				console.warn(`[PromptAPI] Using draft fallback for role=${role}`)
			}
		}

		if (!prompt) {
			console.warn(`[PromptAPI] No prompts found for role=${role}`)
			console.warn(`[PromptAPI] Available:`, data.prompts.map(p => ({
				id: p.id,
				name: p.name,
				status: p.status,
				target_roles: p.target_roles
			})))

			// Clear stale cache when prompt deleted from admin
			if (cached && context) {
				console.log(`[PromptAPI] Clearing stale cache for mode=${mode}`)
				await context.globalState.update(cacheKey, undefined)
			}

			return null
		}

		console.log(`[PromptAPI] Selected: id=${prompt.id}, status=${prompt.status}`)

		// Build prompt sections
		console.log(`[PromptAPI] Building prompts: lang=${normalizedLang || "none"}`)
		const systemPrompt = buildSystemPromptFromTemplate(prompt.template, normalizedLang)
		const customInstructions = buildCustomInstructionsFromTemplate(prompt.template, language)
		const artifactsInstructions = buildArtifactsInstructionsFromTemplate(prompt.template, language)

		// Save to cache
		if (context) {
			// Keep published cache, don't overwrite with draft
			if (cached && cached.status === "published" && useDraft) {
				console.log(`[PromptAPI] Keeping cached published, not overwriting with draft`)
				return {
					systemPrompt: cached.systemPrompt || "",
					customInstructions: cached.customInstructions || "",
					artifactsInstructions: cached.artifactsInstructions || "",
				}
			}

			const shouldUpdateCache = !useDraft || !cached || cached.status !== "published"

			if (shouldUpdateCache) {
				const etag = response.headers.get("ETag")
				const wasUpdated = cached && cached.updated_at !== prompt.updated_at

				const newData: CachedPromptSeparated = {
					systemPrompt,
					customInstructions,
					artifactsInstructions,
					timestamp: Date.now(),
					version: prompt.version,
					etag: etag || undefined,
					status: (prompt.status === "published" || prompt.status === "draft") ? prompt.status : undefined,
					updated_at: prompt.updated_at,
					cacheLogicVersion: CACHE_LOGIC_VERSION,
				}
				await atomicCacheUpdate(context, cacheKey, cached?.updated_at, newData)
				console.log(`[PromptAPI] Cached for mode=${mode}, status=${prompt.status}`)

				// НЕ триггерим экспорт при обновлении промпта - экспорт происходит только при автоматическом обновлении (8-12 минут или 2 минуты с флагом)
			} else {
				console.log(`[PromptAPI] Skipped cache update, keeping published`)
			}
		}

		// Debug: check instructions structure
		if (prompt.template.instructions) {
			const instructions = prompt.template.instructions
			const structureInfo = {
				has_content: !!instructions.content,
				has_example: !!instructions.example,
				has_self_check: !!instructions.self_check,
				has_recommendations: !!instructions.recommendations,
				content_type: instructions.content ? (typeof instructions.content === 'string' ? 'string' : 'object') : 'none',
				example_type: instructions.example ? (typeof instructions.example === 'string' ? 'string' : 'object') : 'none',
				self_check_type: instructions.self_check ? (typeof instructions.self_check === 'string' ? 'string' : 'object') : 'none',
				recommendations_type: instructions.recommendations ? (typeof instructions.recommendations === 'string' ? 'string' : 'object') : 'none',
			}
			console.log(`[PromptAPI] Instructions structure:`, structureInfo)

			// Debug self_check field
			if (instructions.self_check) {
				if (typeof instructions.self_check === 'object') {
					console.log(`[PromptAPI] self_check keys:`, Object.keys(instructions.self_check))
				} else if (typeof instructions.self_check === 'string') {
					console.log(`[PromptAPI] self_check length:`, instructions.self_check.length)
				}
			} else {
				console.warn(`[PromptAPI] self_check missing`)
			}

			if (!instructions.content && !instructions.example && !instructions.self_check && !instructions.recommendations) {
				console.warn(`[PromptAPI] All instruction fields empty`)
			}
		} else {
			console.warn(`[PromptAPI] No instructions in template`)
		}

		console.log(`[PromptAPI] Result: system=${systemPrompt.length}, custom=${customInstructions.length}, artifacts=${artifactsInstructions.length}`)

		return { systemPrompt, customInstructions, artifactsInstructions }
	} catch (error) {
		recordApiError(mode)
		const msg = error instanceof Error ? error.message : String(error)
		console.warn(`[PromptAPI] Failed to load prompt: ${msg}`)

		if (cached && cached.status === "published") {
			console.log(`[PromptAPI] Using cached prompt on error`)
			return {
				systemPrompt: cached.systemPrompt || "",
				customInstructions: cached.customInstructions || "",
				artifactsInstructions: cached.artifactsInstructions || "",
			}
		}

		return null
	}
}

// Batch export response
interface BatchExportResponse {
	[role: string]: {
		[lang: string]: {
			systemPrompt?: string
			customInstructions?: string
			artifactsInstructions?: string
			artifacts?: Array<{ key: string; content: string; name?: string }>
			updated_at?: string
			id?: string
		} | null
	}
}

// Load all prompts via batch endpoint
export async function loadPromptsBatchFromApi(
	roles?: string[],
	langs: string = "all",
	apiBaseUrl?: string,
	format: string = "vscode"
): Promise<BatchExportResponse | null> {
	if (!apiBaseUrl) apiBaseUrl = AIIDEBAS_PROMPTS_API_BASE_URL

	try {
		const params = new URLSearchParams()
		if (roles && roles.length > 0) params.append("roles", roles.join(","))
		if (langs) params.append("langs", langs)
		params.append("format", format)

		const url = `${apiBaseUrl}/api/v1/prompts/export/batch?${params.toString()}`
		console.log(`[PromptAPI] Batch fetch: ${url}`)

		const response = await fetch(url, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			cache: "no-store",
			signal: AbortSignal.timeout(30000),
		})

		if (response.status === 429) {
			const retryAfter = response.headers.get("Retry-After")
			console.warn(`[PromptAPI] Rate limit (429), retry after ${retryAfter || 60}s`)
			return null
		}
		
		if (!response.ok) {
			console.warn(`[PromptAPI] Batch HTTP ${response.status}`)
			return null
		}

		const rawData = await response.json()
		console.log(`[PromptAPI] Batch response: ${Array.isArray(rawData) ? `array(${rawData.length})` : 'object'}`)

		let data: BatchExportResponse

		if (Array.isArray(rawData)) {
			console.log(`[PromptAPI] Grouping ${rawData.length} items by role/lang`)
			if (rawData.length > 0) {
				console.log(`[PromptAPI] First item keys:`, Object.keys(rawData[0]))
			}

			data = {}

			for (const item of rawData) {
				const roleKey = item.role || item.slug || item.target_role || item.targetRole
				let langKey = item.lang || item.language || item.language_code

				if (!roleKey) {
					console.warn(`[PromptAPI] Skipping item without role`)
					continue
				}

				// Extract from multilingual fields if no explicit lang
				if (!langKey) {
					const customInstructions = item.customInstructions || item.custom_instructions
					if (customInstructions && typeof customInstructions === 'object' && !Array.isArray(customInstructions)) {
						const availableLangs = Object.keys(customInstructions)
						if (availableLangs.length > 0) {
							for (const lang of availableLangs) {
								const normalizedRole = roleKey.toLowerCase()
								if (!data[normalizedRole]) data[normalizedRole] = {}

								// Extract artifacts for this lang
								let artifactsForLang: Array<{ key: string; content: string; name?: string }> = []

								if (item.artifacts) {
									if (Array.isArray(item.artifacts)) {
										artifactsForLang = item.artifacts
										console.log(`[PromptAPI] Found ${artifactsForLang.length} artifacts for role=${roleKey}, lang=${lang}`)
									} else if (typeof item.artifacts === 'object') {
										if (item.artifacts[lang] && Array.isArray(item.artifacts[lang])) {
											artifactsForLang = item.artifacts[lang]
											console.log(`[PromptAPI] Found ${artifactsForLang.length} artifacts for role=${roleKey}, lang=${lang}`)
										}
									}
								}

								// Try extracting from template if none found
								if (artifactsForLang.length === 0 && item.template) {
									try {
										artifactsForLang = extractArtifactsFromTemplate(item.template, lang)
										if (artifactsForLang.length > 0) {
											console.log(`[PromptAPI] Extracted ${artifactsForLang.length} artifacts from template for role=${roleKey}, lang=${lang}`)
										}
									} catch (error) {
										console.warn(`[PromptAPI] Failed to extract artifacts: ${error}`)
									}
								}
							
								data[normalizedRole][lang] = {
									systemPrompt: typeof item.systemPrompt === 'object' && !Array.isArray(item.systemPrompt) ? (item.systemPrompt[lang] || item.system_prompt?.[lang] || "") : (item.systemPrompt || item.system_prompt || ""),
									customInstructions: typeof customInstructions === 'object' && !Array.isArray(customInstructions) ? (customInstructions[lang] || "") : (customInstructions || ""),
									artifactsInstructions: typeof item.artifactsInstructions === 'object' && !Array.isArray(item.artifactsInstructions) ? (item.artifactsInstructions[lang] || item.artifacts_instructions?.[lang] || "") : (item.artifactsInstructions || item.artifacts_instructions || ""),
									artifacts: artifactsForLang,
									updated_at: item.updated_at || item.updatedAt,
									id: item.id
								}
							}
							continue
						}
					}
					console.warn(`[PromptAPI] Skipping item for role=${roleKey} - no lang field`)
					continue
				}

				const normalizedRole = roleKey.toLowerCase()
				if (!data[normalizedRole]) data[normalizedRole] = {}

				// Extract artifacts
				let artifactsForLang: Array<{ key: string; content: string; name?: string }> = []

				if (item.artifacts) {
					if (Array.isArray(item.artifacts)) {
						artifactsForLang = item.artifacts
						console.log(`[PromptAPI] Found ${artifactsForLang.length} artifacts for role=${roleKey}, lang=${langKey}`)
					} else if (typeof item.artifacts === 'object') {
						if (item.artifacts[langKey] && Array.isArray(item.artifacts[langKey])) {
							artifactsForLang = item.artifacts[langKey]
							console.log(`[PromptAPI] Found ${artifactsForLang.length} artifacts for role=${roleKey}, lang=${langKey}`)
						} else {
							// Try case-insensitive match
							for (const [key, value] of Object.entries(item.artifacts)) {
								if (key.toLowerCase() === langKey.toLowerCase() && Array.isArray(value)) {
									artifactsForLang = value as Array<{ key: string; content: string; name?: string }>
									break
								}
							}
						}
					}
				}

				// Try template extraction if none found
				if (artifactsForLang.length === 0 && item.template) {
					try {
						artifactsForLang = extractArtifactsFromTemplate(item.template, langKey)
					} catch (error) {
						console.warn(`[PromptAPI] Failed to extract artifacts: ${error}`)
					}
				}

				data[normalizedRole][langKey] = {
					systemPrompt: item.systemPrompt || item.system_prompt || "",
					customInstructions: item.customInstructions || item.custom_instructions || "",
					artifactsInstructions: item.artifactsInstructions || item.artifacts_instructions || "",
					artifacts: artifactsForLang,
					updated_at: item.updated_at || item.updatedAt,
					id: item.id
				}
			}

			console.log(`[PromptAPI] Grouped into ${Object.keys(data).length} roles`)
		} else if (rawData && typeof rawData === 'object') {
			// Normalize keys to lowercase
			console.log(`[PromptAPI] Normalizing object keys`)
			data = {}
			for (const [key, value] of Object.entries(rawData)) {
				data[key.toLowerCase()] = value as any
			}
		} else {
			console.warn(`[PromptAPI] Unexpected response type`)
			return null
		}

		const dataKeys = Object.keys(data)
		console.log(`[PromptAPI] Batch data for ${dataKeys.length} roles`)

		if (dataKeys.length > 0 && roles && roles.length > 0) {
			const foundRoles = roles.filter(r => dataKeys.some(k => k.toLowerCase() === r.toLowerCase()))
			const missingRoles = roles.filter(r => !dataKeys.some(k => k.toLowerCase() === r.toLowerCase()))
			if (foundRoles.length > 0) console.log(`[PromptAPI] Found roles: ${foundRoles.join(", ")}`)
			if (missingRoles.length > 0) console.log(`[PromptAPI] Missing roles: ${missingRoles.join(", ")}`)
		}

		return data
	} catch (error) {
		console.warn(`[PromptAPI] Batch error: ${error}`)
		return null
	}
}

// Load prompt with artifacts
export async function loadPromptWithArtifactsFromApi(
	mode: string,
	language?: string,
	apiBaseUrl?: string,
	context?: vscode.ExtensionContext,
	onlyPublished: boolean = true
): Promise<{
	systemPrompt: string
	customInstructions: string
	artifactsInstructions: string
	artifacts: Array<{ key: string; content: string; name?: string }>
} | null> {
	const role = modeToRole(mode)
	const normalizedLang = normalizeLang(language)

	try {
		const params = new URLSearchParams({ role })
		if (normalizedLang) params.append("lang", normalizedLang)
		if (!apiBaseUrl) apiBaseUrl = AIIDEBAS_PROMPTS_API_BASE_URL

		const url = `${apiBaseUrl}/api/v1/prompts/?${params.toString()}`
		console.log(`[PromptAPI] Fetching with artifacts: ${url}`)

		const response = await fetch(url, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(10000),
		})

		// Handle rate limit
		if (response.status === 429) {
			console.warn(`[PromptAPI] Rate limit (429)`)
			if (context) {
				const cacheKey = `prompt_${mode}_${normalizedLang || "en"}`
				// Use file cache if available
				let cached: CachedPromptSeparated | undefined
				if (isFileCacheAvailable()) {
					cached = await getFromFileCache(cacheKey)
				} else {
					cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
				}
				if (cached && cached.cacheLogicVersion === CACHE_LOGIC_VERSION) {
					console.log(`[PromptAPI] Using cache on rate limit`)
					return {
						systemPrompt: cached.systemPrompt || "",
						customInstructions: cached.customInstructions || "",
						artifactsInstructions: cached.artifactsInstructions || "",
						artifacts: [],
					}
				}
			}
			return null
		}

		if (!response.ok) {
			console.warn(`[PromptAPI] HTTP ${response.status}`)
			return null
		}

		const rawData = await response.json()
		
		// API returns array directly, not { prompts: [...] }
		const prompts = Array.isArray(rawData) ? rawData : (rawData.prompts || [])

		let prompt = selectLatestPrompt(prompts, "published", role)
		if (!prompt && !onlyPublished) prompt = selectLatestPrompt(prompts, "draft", role)

		if (!prompt) {
			// Try to use the first item directly if it matches the role and status
			const directMatch = prompts.find((p: any) => 
				(p.slug === role || p.role === role || p.target_role === role) && 
				(p.status === "published" || (!onlyPublished && p.status === "draft"))
			)
			if (directMatch) {
				// New API format - extract data directly
				console.log(`[PromptAPI] Using direct match for role=${role}, status=${directMatch.status}`)
				const systemPrompt = directMatch.systemPrompt || directMatch.system_prompt || ""
				const customInstructions = directMatch.customInstructions || directMatch.custom_instructions || directMatch.promptContent || ""
				const artifactsInstructions = directMatch.artifactsInstructions || directMatch.artifacts_instructions || ""
				const artifacts = directMatch.artifacts || []
				
				console.log(`[PromptAPI] Direct match: ${artifacts.length} artifacts`)
				return { systemPrompt, customInstructions, artifactsInstructions, artifacts }
			}
			
			console.warn(`[PromptAPI] No prompt for role=${role}`)
			return null
		}

		console.log(`[PromptAPI] Found prompt id=${prompt.id}, status=${prompt.status}`)

		const systemPrompt = buildSystemPromptFromTemplate(prompt.template, normalizedLang)
		const customInstructions = buildCustomInstructionsFromTemplate(prompt.template, language)
		const artifactsInstructions = buildArtifactsInstructionsFromTemplate(prompt.template, language)
		const artifacts = extractArtifactsFromTemplate(prompt.template, language)

		console.log(`[PromptAPI] Extracted ${artifacts.length} artifacts`)

		return { systemPrompt, customInstructions, artifactsInstructions, artifacts }
	} catch (error) {
		console.warn(`[PromptAPI] Error: ${error}`)
		return null
	}
}

// Normalize updated_at for comparison
export function normalizeUpdatedAt(updatedAt: string | undefined | null): string | undefined {
	if (!updatedAt) return undefined
	try {
		return new Date(updatedAt).toISOString()
	} catch {
		return updatedAt
	}
}

// Background update check for separated prompts
async function checkForUpdatesSeparatedInBackground(
	mode: string,
	language: string | undefined,
	apiBaseUrl: string | undefined,
	cached: CachedPromptSeparated,
	context: vscode.ExtensionContext
): Promise<void> {
	try {
		const role = modeToRole(mode)
		const normalizedLang = normalizeLang(language)
		const params = new URLSearchParams({ role })
		if (normalizedLang) params.append("lang", normalizedLang)

		if (!apiBaseUrl) apiBaseUrl = AIIDEBAS_PROMPTS_API_BASE_URL

		const url = `${apiBaseUrl}/api/v1/prompts/?${params.toString()}`
		const headers: Record<string, string> = { "Content-Type": "application/json" }
		console.log(`[PromptAPI] Background check for mode=${mode}`)

		const response = await fetch(url, {
			method: "GET",
			headers,
			signal: AbortSignal.timeout(5000),
		})

		if (response.status === 429) {
			console.log(`[PromptAPI] Background: rate limit`)
			return
		}

		if (response.ok) {
			const rawData = await response.json()
			const role = modeToRole(mode)
			let prompt: any = undefined
			
			// Check response format (array = new format, object = legacy)
			if (Array.isArray(rawData)) {
				// New format: find published prompt with matching targetRole
				const publishedItems = rawData.filter((item: any) => {
					if (item.status !== "published") return false
					if (item.target_roles && item.target_roles.length > 0) {
						return item.target_roles.some((tr: string) => tr.toUpperCase() === role.toUpperCase())
					}
					return false
				})
				if (publishedItems.length > 0) {
					// Sort by updated_at descending
					publishedItems.sort((a: any, b: any) => {
						const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
						const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
						return bTime - aTime
					})
					prompt = publishedItems[0]
				}
			} else {
				// Legacy format: { prompts: [...] }
				const data: PromptApiResponse = rawData
				prompt = selectLatestPrompt(data.prompts || [], "published", role)
			}

			if (prompt) {
				// Normalize updated_at for comparison
				const cachedUpdatedAt = normalizeUpdatedAt(cached.updated_at)
				const promptUpdatedAt = normalizeUpdatedAt(prompt.updated_at)
				
				// Check if unchanged
				if (cachedUpdatedAt === promptUpdatedAt && cachedUpdatedAt !== undefined) {
					console.log(`[PromptAPI] Background: prompt unchanged`)
					const cacheKey = getCacheKeySeparated(mode, language)
					const updatedCache = {
						...cached,
						timestamp: Date.now(),
						cacheLogicVersion: CACHE_LOGIC_VERSION,
					}
					// Use file cache if available
					if (isFileCacheAvailable()) {
						await saveToFileCache(cacheKey, updatedCache)
					} else {
						await context.globalState.update(cacheKey, updatedCache)
					}
					return
				}

				// Only update if actually changed
				if (cachedUpdatedAt !== promptUpdatedAt) {
					console.log(`[PromptAPI] Background: prompt changed (${cachedUpdatedAt} -> ${promptUpdatedAt})`)

					const systemPrompt = buildSystemPromptFromTemplate(prompt.template, normalizedLang)
					const customInstructions = buildCustomInstructionsFromTemplate(prompt.template, language)
					const artifactsInstructions = buildArtifactsInstructionsFromTemplate(prompt.template, language)

					if (systemPrompt.trim() || customInstructions.trim() || artifactsInstructions.trim()) {
						const etag = response.headers.get("ETag")
						const cacheKey = getCacheKeySeparated(mode, language)
						await atomicCacheUpdate(context, cacheKey, cached.updated_at, {
							systemPrompt,
							customInstructions,
							artifactsInstructions,
							timestamp: Date.now(),
							version: prompt.version,
							etag: etag || undefined,
							status: (prompt.status === "published" || prompt.status === "draft") ? prompt.status : undefined,
							updated_at: prompt.updated_at,
							cacheLogicVersion: CACHE_LOGIC_VERSION,
						})
						console.log(`[PromptAPI] Background cache updated for mode=${mode}`)

						// НЕ триггерим экспорт при фоновом обновлении - экспорт происходит только при автоматическом обновлении (8-12 минут или 2 минуты с флагом)
					}
				} else {
					console.log(`[PromptAPI] Background: prompt unchanged (both undefined)`)
				}
			} else {
				// Don't clear cache if prompt not found - might be temporary API issue
				// Only log warning, keep existing cache
				console.log(`[PromptAPI] Background: no prompt found for mode=${mode}, keeping cache`)
			}
		}
	} catch (error) {
		console.debug(`[PromptAPI] Background check failed:`, error)
	}
}

// Clear prompt cache
export async function clearPromptCache(
	context: vscode.ExtensionContext,
	mode?: string,
	language?: string
): Promise<void> {
	const normalizedLang = normalizeLang(language)

	if (mode) {
		const cacheKey = getCacheKeySeparated(mode, normalizedLang)
		// Clear from both file cache and globalState (for migration period)
		if (isFileCacheAvailable()) {
			await deleteFromFileCache(cacheKey)
		}
		await context.globalState.update(cacheKey, undefined)
		console.log(`[PromptAPI] Cleared cache for mode=${mode}`)
	} else {
		const knownModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
		const languages = [undefined, "ru", "en", "es", "zh", "ar", "pt"]

		let clearedCount = 0
		for (const m of knownModes) {
			for (const lang of languages) {
				const cacheKey = getCacheKeySeparated(m, lang)
				// Clear from both file cache and globalState
				if (isFileCacheAvailable()) {
					await deleteFromFileCache(cacheKey)
					clearedCount++
				} else {
					const cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
					if (cached) {
						await context.globalState.update(cacheKey, undefined)
						clearedCount++
					}
				}
			}
		}
		console.log(`[PromptAPI] Cleared ${clearedCount} cached prompts`)
	}
}

// Force refresh prompt (bypass cache)
export async function forceRefreshPrompt(
	context: vscode.ExtensionContext,
	mode: string,
	language?: string,
	apiBaseUrl?: string
): Promise<{ systemPrompt: string; customInstructions: string; artifactsInstructions: string } | null> {
	console.log(`[PromptAPI] Force refresh for mode=${mode}`)
	await clearPromptCache(context, mode, language)
	const result = await loadPromptFromApiSeparated(mode, language, apiBaseUrl, context)
	if (result) {
		console.log(`[PromptAPI] Force refresh completed for mode=${mode}`)
	} else {
		console.warn(`[PromptAPI] Force refresh failed for mode=${mode}`)
	}
	return result
}

// Result of refresh operation - includes loaded roles for UI update
export interface RefreshResult {
	roles: Array<{
		slug: string
		name: string
		emoji?: string
		target_roles: string[]
		role_definition?: string | Record<string, string>
		short_description?: Record<string, string>
		when_to_use?: Record<string, string>
	}>
	modesRefreshed: number
}

// Refresh all prompts from API
// Returns loaded roles so caller can update UI
export async function refreshAllPromptsFromApi(
	context: vscode.ExtensionContext,
	language?: string,
	apiBaseUrl?: string,
	shouldExport: boolean = false // Экспорт только при автоматическом обновлении (8-12 минут или 2 минуты с флагом)
): Promise<RefreshResult> {
	const normalizedLang = normalizeLang(language)

	// Rate limiting for frequent updates
	// При isImmediateUpdate интервал контролируется в extension.ts (2 минуты), rate limiting не нужен
	// При обычном режиме (8-12 минут) rate limiting также не нужен, так как интервал достаточно большой
	const lastRefreshKey = "last_prompts_refresh_time"
	const MIN_REFRESH_INTERVAL_MS = 0 // Отключен, интервал контролируется в extension.ts

	if (context) {
		const lastRefresh = context.globalState.get<number>(lastRefreshKey)
		if (lastRefresh && MIN_REFRESH_INTERVAL_MS > 0) {
			const timeSinceLastRefresh = Date.now() - lastRefresh
			if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
				const waitTime = MIN_REFRESH_INTERVAL_MS - timeSinceLastRefresh
				console.log(`[PromptAPI] Skipping refresh, only ${Math.round(timeSinceLastRefresh / 1000)}s since last refresh, need ${Math.round(MIN_REFRESH_INTERVAL_MS / 1000)}s`)
				const cachedRoles = context.globalState.get<RefreshResult["roles"]>("cachedApiRoles")
				return {
					roles: cachedRoles || [],
					modesRefreshed: 0
				}
			}
		}
		// Обновляем timestamp для отслеживания последнего обновления
		await context.globalState.update(lastRefreshKey, Date.now())
	}

	if (!apiBaseUrl) apiBaseUrl = AIIDEBAS_PROMPTS_API_BASE_URL

	// Load roles list from API
	let allModes: string[] = []
	let apiRoles: RefreshResult["roles"] = []
	try {
		apiRoles = await getAllRolesFromApi(apiBaseUrl, language)
		if (apiRoles && apiRoles.length > 0) {
			allModes = apiRoles.map(role => role.slug.toLowerCase())
			console.log(`[PromptAPI] Loaded ${allModes.length} roles from API: ${apiRoles.map(r => r.slug).join(", ")}`)
		} else {
			allModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
			console.log(`[PromptAPI] No roles from API, using fallback`)
		}
	} catch (error) {
		allModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
		console.warn(`[PromptAPI] Failed to load roles, using fallback: ${error}`)
	}

	console.log(`[PromptAPI] Refreshing ${allModes.length} modes (only published prompts)`)

	// Refresh only roles that have published prompts, track which roles actually updated
	const refreshPromises = allModes.map(async (mode) => {
		try {
			// Check cache before request to track changes
			const cacheKey = getCacheKeySeparated(mode, normalizedLang)
			// Use file cache if available
			let cachedBefore: CachedPromptSeparated | undefined
			if (isFileCacheAvailable()) {
				cachedBefore = await getFromFileCache(cacheKey)
			} else {
				cachedBefore = context.globalState.get<CachedPromptSeparated>(cacheKey)
			}
			const updatedAtBefore = normalizeUpdatedAt(cachedBefore?.updated_at)

			// Only load published prompts - if no published prompt exists, return null
			const result = await loadPromptFromApiSeparated(mode, normalizedLang, apiBaseUrl, context, true)
			if (result) {
				// Check if updated_at changed (use atomic read to avoid race conditions)
				let cachedAfter: CachedPromptSeparated | undefined
				if (isFileCacheAvailable()) {
					cachedAfter = await getFromFileCache(cacheKey)
				} else {
					cachedAfter = context.globalState.get<CachedPromptSeparated>(cacheKey)
				}
				const updatedAtAfter = normalizeUpdatedAt(cachedAfter?.updated_at)
				
				// Consider updated if: different updated_at, or cache was empty before
				const wasUpdated = updatedAtBefore !== updatedAtAfter && updatedAtAfter !== undefined

				if (wasUpdated) {
					console.log(`[PromptAPI] Refreshed mode=${mode} (published, updated): ${updatedAtBefore || 'none'} -> ${updatedAtAfter}`)
				} else {
					console.log(`[PromptAPI] Refreshed mode=${mode} (published, no changes): ${updatedAtBefore || 'none'} === ${updatedAtAfter || 'none'}`)
				}
				return { mode, success: true, wasUpdated }
			} else {
				console.log(`[PromptAPI] Skipped mode=${mode} (no published prompt)`)
				return { mode, success: false, wasUpdated: false }
			}
		} catch (error) {
			console.warn(`[PromptAPI] Failed to refresh mode=${mode}: ${error}`)
			return { mode, success: false, wasUpdated: false }
		}
	})

	const results = await Promise.allSettled(refreshPromises)
	const successfulModes = new Set<string>()
	const updatedModes = new Set<string>()
	results.forEach((r) => {
		if (r.status === "fulfilled" && r.value.success) {
			successfulModes.add(r.value.mode)
			if (r.value.wasUpdated) {
				updatedModes.add(r.value.mode)
			}
		}
	})
	let actualUpdates = updatedModes.size

	// If API returned same updated_at for multiple roles (e.g. global timestamp), verify by content so we only export actually changed roles
	if (updatedModes.size > 1 && normalizedLang) {
		try {
			const batchData = await loadPromptsBatchFromApi(
				Array.from(updatedModes),
				normalizedLang || "all",
				apiBaseUrl,
				"vscode"
			)
			if (batchData) {
				const verifiedUpdated = new Set<string>()
				const extensionPath = context.extensionPath
				const distPromptsDir = path.join(extensionPath, "dist", "prompts")
				const fsPromises = await import("fs/promises")
				const { removeArtifactContentFromPrompt } = await import("./prompt-export-service")
				for (const mode of updatedModes) {
					const modeData = batchData[mode]
					if (!modeData) {
						verifiedUpdated.add(mode)
						continue
					}
					const langData = modeData[normalizedLang]
					if (!langData) {
						verifiedUpdated.add(mode)
						continue
					}
					let contentDiffers = false
					try {
						const langDirPath = path.join(distPromptsDir, normalizedLang)
						const modeRulesDir = path.join(langDirPath, `rules-${mode}`)
						const artifacts = langData.artifacts || []
						const systemPrompt = langData.systemPrompt || ""
						const customInstructions = langData.customInstructions || ""
						const hasContent = !!systemPrompt || !!customInstructions
						try {
							const existingFiles = await fsPromises.readdir(modeRulesDir)
							const mainPromptFile = existingFiles.find((f: string) => f.startsWith("00_") && f.endsWith(".md"))
							if (mainPromptFile) {
								const mainPromptPath = path.join(modeRulesDir, mainPromptFile)
								const existingContent = await fsPromises.readFile(mainPromptPath, "utf-8")
								const systemPromptClean = removeArtifactContentFromPrompt(systemPrompt, artifacts)
								const customInstructionsClean = removeArtifactContentFromPrompt(customInstructions, artifacts)
								const expectedParts: string[] = []
								if (systemPromptClean) expectedParts.push(systemPromptClean)
								if (customInstructionsClean) {
									if (expectedParts.length > 0) expectedParts.push("\n\n---\n\n")
									expectedParts.push(customInstructionsClean)
								}
								const expectedContent = expectedParts.join("")
								if (normalizeContentForCompare(existingContent) !== normalizeContentForCompare(expectedContent)) contentDiffers = true
							} else if (hasContent) contentDiffers = true
						} catch {
							if (hasContent) contentDiffers = true
						}
						if (!contentDiffers && artifacts.length > 0) {
							try {
								const existingFiles = await fsPromises.readdir(modeRulesDir)
								const existingArtifactFiles = existingFiles.filter(
									(f: string) => f.endsWith(".md") && /^\d{2}_/i.test(f) && !f.startsWith("00_")
								)
								// Build expected artifact file names from API (same logic as saveArtifacts)
								const expectedArtifactFileNames = artifacts.map((a: { key?: string; name?: string }, i: number) => {
									const key = (a.key || a.name || "").trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
									const hasNum = /^\d{2}_/i.test(key)
									return hasNum ? `${key}.md` : `${String(i + 1).padStart(2, "0")}_${key}.md`
								}).sort()
								const existingSorted = [...existingArtifactFiles].sort()
								if (existingSorted.length !== expectedArtifactFileNames.length ||
									expectedArtifactFileNames.some((name: string, idx: number) => name !== existingSorted[idx])) {
									// Artifact names changed (rename) or count changed
									contentDiffers = true
								} else {
									for (let i = 0; i < artifacts.length; i++) {
										const artifact = artifacts[i]
										const artifactKey = (artifact.key || artifact.name || "").trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
										const hasNumberPrefix = /^\d{2}_/i.test(artifactKey)
										const artifactFileName = hasNumberPrefix
											? `${artifactKey}.md`
											: `${String(i + 1).padStart(2, "0")}_${artifactKey}.md`
										const artifactPath = path.join(modeRulesDir, artifactFileName)
										try {
											const existingContent = await fsPromises.readFile(artifactPath, "utf-8")
											if (normalizeContentForCompare(existingContent) !== normalizeContentForCompare(artifact.content || "")) {
												contentDiffers = true
												break
											}
										} catch {
											contentDiffers = true
											break
										}
									}
								}
							} catch {
								contentDiffers = true
							}
						}
						if (contentDiffers) verifiedUpdated.add(mode)
					} catch (err) {
						console.debug(`[PromptAPI] Content verification failed for mode=${mode}: ${err}`)
						verifiedUpdated.add(mode)
					}
				}
				updatedModes.clear()
				verifiedUpdated.forEach((m) => updatedModes.add(m))
				actualUpdates = updatedModes.size
				console.log(
					`[PromptAPI] Content verification: ${actualUpdates} role(s) actually changed: ${Array.from(updatedModes).join(", ") || "none"}`
				)
			}
		} catch (err) {
			console.debug(`[PromptAPI] Content verification failed: ${err}`)
		}
	}

	const successfulRefreshes = successfulModes.size

	console.log(`[PromptAPI] Refresh results: ${successfulModes.size} successful, ${actualUpdates} updated`)
	console.log(`[PromptAPI] Successful modes: ${Array.from(successfulModes).join(", ")}`)
	console.log(`[PromptAPI] Total apiRoles: ${apiRoles.length}, slugs: ${apiRoles.map(r => r.slug.toLowerCase()).join(", ")}`)

	// Check artifacts for modes where updated_at didn't change but artifacts might have
	if (actualUpdates === 0 && successfulModes.size > 0 && normalizedLang) {
		try {
			const batchData = await loadPromptsBatchFromApi(
				Array.from(successfulModes),
				normalizedLang || "all",
				apiBaseUrl,
				"vscode"
			)
			
			if (batchData) {
				// Check each mode for content changes (prompt and artifacts)
				for (const mode of successfulModes) {
					const modeData = batchData[mode]
					if (!modeData) continue
					const langData = modeData[normalizedLang]
					if (!langData) continue
					
					try {
						const extensionPath = context.extensionPath
						const distPromptsDir = path.join(extensionPath, "dist", "prompts")
						const langDirPath = path.join(distPromptsDir, normalizedLang)
						const modeRulesDir = path.join(langDirPath, `rules-${mode}`)
						
						const fsPromises = await import("fs/promises")
						
						// Check main prompt content (00_*.md)
						const artifacts = langData.artifacts || []
						const systemPrompt = langData.systemPrompt || ""
						const customInstructions = langData.customInstructions || ""
						const hasContent = systemPrompt || customInstructions
						
						try {
							const existingFiles = await fsPromises.readdir(modeRulesDir)
							const mainPromptFile = existingFiles.find(f => f.startsWith("00_") && f.endsWith(".md"))
							
							if (mainPromptFile) {
								const mainPromptPath = path.join(modeRulesDir, mainPromptFile)
								const existingContent = await fsPromises.readFile(mainPromptPath, "utf-8")
								
								// Build expected content from API
								// Remove artifact content from prompts for comparison
								const { removeArtifactContentFromPrompt } = await import("./prompt-export-service")
								const systemPromptClean = removeArtifactContentFromPrompt(systemPrompt, artifacts)
								const customInstructionsClean = removeArtifactContentFromPrompt(customInstructions, artifacts)
								
								const expectedParts: string[] = []
								if (systemPromptClean) expectedParts.push(systemPromptClean)
								if (customInstructionsClean) {
									if (expectedParts.length > 0) expectedParts.push("\n\n---\n\n")
									expectedParts.push(customInstructionsClean)
								}
								const expectedContent = expectedParts.join("")
								
								if (normalizeContentForCompare(existingContent) !== normalizeContentForCompare(expectedContent)) {
									console.log(`[PromptAPI] Main prompt content changed for mode=${mode}, marking as updated`)
									updatedModes.add(mode)
									actualUpdates++
									continue // Skip artifact check if main content changed
								}
							} else if (hasContent) {
								// File should exist but doesn't - mark as updated
								console.log(`[PromptAPI] Main prompt file missing for mode=${mode} but content exists, marking as updated`)
								updatedModes.add(mode)
								actualUpdates++
								continue
							}
						} catch {
							// Directory doesn't exist or can't read - mark as updated if content exists
							if (hasContent) {
								console.log(`[PromptAPI] Main prompt directory missing for mode=${mode} but content exists, marking as updated`)
								updatedModes.add(mode)
								actualUpdates++
								continue
							}
						}
						
						// Check artifacts content
						const artifactCount = artifacts.length
						
						try {
							const existingFiles = await fsPromises.readdir(modeRulesDir)
							const existingArtifactFiles = existingFiles.filter(f => f.endsWith(".md") && /^\d{2}_/i.test(f) && !f.startsWith("00_"))
							const existingArtifactCount = existingArtifactFiles.length
							
							// Check count first
							if (existingArtifactCount !== artifactCount) {
								console.log(`[PromptAPI] Artifact count changed for mode=${mode} (${existingArtifactCount} -> ${artifactCount}), marking as updated`)
								updatedModes.add(mode)
								actualUpdates++
							} else if (artifactCount > 0) {
								// Same count: compare artifact file names (detect renames) then content
								const expectedArtifactFileNames = artifacts.map((a: { key?: string; name?: string }, i: number) => {
									const key = (a.key || a.name || "").trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
									const hasNum = /^\d{2}_/i.test(key)
									return hasNum ? `${key}.md` : `${String(i + 1).padStart(2, "0")}_${key}.md`
								}).sort()
								const existingSorted = [...existingArtifactFiles].sort()
								const namesDiffer = expectedArtifactFileNames.length !== existingSorted.length ||
									expectedArtifactFileNames.some((name: string, idx: number) => name !== existingSorted[idx])
								if (namesDiffer) {
									console.log(`[PromptAPI] Artifact names changed for mode=${mode} (rename), marking as updated`)
									updatedModes.add(mode)
									actualUpdates++
								} else {
									let contentChanged = false
									for (let i = 0; i < artifacts.length; i++) {
										const artifact = artifacts[i]
										const artifactKey = artifact.key || artifact.name || ""
										const cleanKey = artifactKey.trim().replace(/\s+/g, "_").replace(/^_+|_+$/g, "")
										const hasNumberPrefix = /^\d{2}_/i.test(cleanKey)
										const artifactFileName = hasNumberPrefix ? `${cleanKey}.md` : `${String(i + 1).padStart(2, "0")}_${cleanKey}.md`
										const artifactFile = path.join(modeRulesDir, artifactFileName)
										try {
											const existingContent = await fsPromises.readFile(artifactFile, "utf-8")
											if (normalizeContentForCompare(existingContent) !== normalizeContentForCompare(artifact.content || "")) {
												contentChanged = true
												break
											}
										} catch {
											contentChanged = true
											break
										}
									}
									if (contentChanged) {
										console.log(`[PromptAPI] Artifact content changed for mode=${mode}, marking as updated`)
										updatedModes.add(mode)
										actualUpdates++
									}
								}
							}
						} catch {
							// Directory doesn't exist or can't read - artifacts might be new
							if (artifactCount > 0) {
								console.log(`[PromptAPI] Artifacts detected for mode=${mode} but directory missing, marking as updated`)
								updatedModes.add(mode)
								actualUpdates++
							}
						}
					} catch (err) {
						// Ignore errors in content check
						console.debug(`[PromptAPI] Content check failed for mode=${mode}: ${err}`)
					}
				}
			}
		} catch (err) {
			// Ignore errors in batch check
			console.debug(`[PromptAPI] Artifact check failed: ${err}`)
		}
	}
	
	console.log(`[PromptAPI] Refresh completed: ${successfulRefreshes}/${allModes.length} modes refreshed, ${actualUpdates} actually updated`)

	// Check for new roles OR removed roles - ALWAYS check, regardless of updates
	const knownRoles = context.globalState.get<string[]>("knownApiRoles") || []
	const currentRoleSlugs = apiRoles.map(role => role.slug.toLowerCase())
	let newRoles = currentRoleSlugs.filter(slug => !knownRoles.includes(slug))
	const removedRoles = knownRoles.filter(slug => !currentRoleSlugs.includes(slug))
	
	// Always update knownApiRoles to track current state
	// Initialize if empty (first run) - treat ALL roles as new for export
	const isFirstRun = knownRoles.length === 0 && currentRoleSlugs.length > 0
	if (isFirstRun) {
		console.log(`[PromptAPI] First run - all ${currentRoleSlugs.length} roles are new, will export all`)
		newRoles = currentRoleSlugs // All roles are "new" on first run
		await context.globalState.update("knownApiRoles", currentRoleSlugs)
	}
	
	// Check if dist/prompts has all roles - if not, add missing ones to newRoles
	// This handles the case when knownApiRoles is already populated but dist/prompts is incomplete
	if (newRoles.length === 0 && currentRoleSlugs.length > 0) {
		try {
			const distPromptsPath = path.join(context.extensionPath, "dist", "prompts")
			const ruPath = path.join(distPromptsPath, "ru")
			const ruContents = await fsp.readdir(ruPath).catch(() => [] as string[])
			const existingRoles = ruContents
				.filter((item: string) => item.startsWith("rules-"))
				.map((item: string) => item.replace("rules-", ""))
			
			const missingInDist = currentRoleSlugs.filter(slug => !existingRoles.includes(slug))
			if (missingInDist.length > 0) {
				console.log(`[PromptAPI] Found ${missingInDist.length} roles missing from dist/prompts: ${missingInDist.join(", ")}`)
				newRoles = missingInDist
			}
		} catch (err) {
			console.debug(`[PromptAPI] Failed to check dist/prompts: ${err}`)
		}
	}
	
	// Log detected changes
	if (newRoles.length > 0 && !isFirstRun) {
		console.log(`[PromptAPI] New role(s) detected in refresh: ${newRoles.join(", ")}`)
	}
	if (removedRoles.length > 0) {
		console.log(`[PromptAPI] Removed role(s) detected in refresh: ${removedRoles.join(", ")} (archived/deleted)`)
		// Clear cache for archived/removed roles to prevent them from appearing in UI
		const SUPPORTED_LANGUAGES = ["ru", "en", "es", "zh", "ar", "pt"]
		for (const removedRole of removedRoles) {
			for (const lang of SUPPORTED_LANGUAGES) {
				const cacheKey = getCacheKeySeparated(removedRole, lang)
				// Clear from both file cache and globalState
				if (isFileCacheAvailable()) {
					await deleteFromFileCache(cacheKey)
				}
				await context.globalState.update(cacheKey, undefined)
			}
			console.log(`[PromptAPI] Cleared cache for archived role: ${removedRole}`)
		}
	}
	
	// Update known roles list if there were changes
	if (newRoles.length > 0 || removedRoles.length > 0) {
		await context.globalState.update("knownApiRoles", currentRoleSlugs)
	}

	// Export only when something actually changed: new/removed roles or content changed (actualUpdates).
	// Every 8–12 min we ask API "any updates?"; if yes — export only those roles/artifacts; if no — do nothing, don't rewrite.
	const hasNewRoles = newRoles.length > 0
	const hasSomethingToExport = hasNewRoles || removedRoles.length > 0 || actualUpdates > 0

	if (hasSomethingToExport) {
		if (exportDebounceTimer) clearTimeout(exportDebounceTimer)
		exportDebounceTimer = setTimeout(() => {
			exportDebounceTimer = null
			
			if (newRoles.length > 0 || removedRoles.length > 0) {
				// New or removed roles detected
				if (newRoles.length > 0) {
					// If there are also updates, merge new roles with updated roles
					const updatedRoleSlugs = actualUpdates > 0 ? Array.from(updatedModes) : []
					const rolesToExport = [...new Set([...newRoles, ...updatedRoleSlugs])]
					console.log(`[PromptAPI] Exporting new roles immediately: ${newRoles.join(", ")}`)
					safeExportPrompts(
						context, 
						`new roles detected: ${newRoles.join(", ")}${actualUpdates > 0 ? `, ${actualUpdates} modes updated` : ""}`, 
						rolesToExport.length > 0 ? rolesToExport : undefined
					).catch((error) => {
						console.warn(`[PromptAPI] Export failed: ${error}`)
					})
				} else if (removedRoles.length > 0) {
					// Only removed roles - export without onlyRoles to trigger cleanup
					// If there are also updates, include updated roles
					if (actualUpdates > 0) {
						const updatedRoleSlugs = Array.from(updatedModes)
						safeExportPrompts(
							context, 
							`removed roles detected: ${removedRoles.join(", ")}, ${actualUpdates} modes updated`, 
							updatedRoleSlugs
						).catch((error) => {
							console.warn(`[PromptAPI] Export failed: ${error}`)
						})
					} else {
						safeExportPrompts(
							context, 
							`removed roles detected: ${removedRoles.join(", ")}`, 
							undefined
						).catch((error) => {
							console.warn(`[PromptAPI] Export failed: ${error}`)
						})
					}
				}
			} else if (actualUpdates > 0) {
				// Content changed — export only those roles (and their artifacts)
				const updatedRoleSlugs = Array.from(updatedModes)
				safeExportPrompts(context, `refresh (${actualUpdates} modes updated)`, updatedRoleSlugs).catch((error) => {
					console.warn(`[PromptAPI] Export failed: ${error}`)
				})
			}
		}, getExportDebounceDelay())
	}

	// Filter roles to only include those with published prompts
	// getAllRolesFromApi уже возвращает только роли с опубликованными промптами (хотя бы для одного языка)
	// Если роль в apiRoles, значит она опубликована - включаем её автоматически
	// Это гарантирует, что новые опубликованные роли автоматически появляются в списке
	// Архивированные роли не попадают в apiRoles, поэтому они автоматически исключаются
	const rolesWithPublishedPrompts = apiRoles

	console.log(`[PromptAPI] Returning ${rolesWithPublishedPrompts.length} roles with published prompts (out of ${apiRoles.length} total)`)
	console.log(`[PromptAPI] Role slugs: ${rolesWithPublishedPrompts.map(r => r.slug).join(", ")}`)

	return { roles: rolesWithPublishedPrompts, modesRefreshed: successfulRefreshes }
}

// Load prompt from API with caching (returns string)
export async function loadPromptFromApi(
	mode: string,
	language?: string,
	apiBaseUrl?: string,
	context?: vscode.ExtensionContext
): Promise<string | null> {
	const cacheKey = getCacheKey(mode, language)
	console.log(`[PromptAPI] loadPromptFromApi: mode=${mode}`)

	// Try cache first
	if (context) {
		let cached = context.globalState.get<CachedPrompt>(cacheKey)

		if (cached) {
			// Invalidate on version mismatch
			if (cached.cacheLogicVersion !== CACHE_LOGIC_VERSION) {
				console.log(`[PromptAPI] Cache version mismatch, invalidating`)
				cached = undefined
			} else {
				const age = Date.now() - cached.timestamp
				if (age < CACHE_TTL) {
					console.log(`[PromptAPI] Using cached prompt for mode=${mode}`)

					// Check for updates via ETag
					try {
						const role = modeToRole(mode)
						const normalizedLang = normalizeLang(language)
						const params = new URLSearchParams({ role })
						if (normalizedLang) params.append("lang", normalizedLang)

						let checkApiBaseUrl = apiBaseUrl
						if (!checkApiBaseUrl) {
							const envApiUrl = AIIDEBAS_PROMPTS_API_BASE_URL
							checkApiBaseUrl = envApiUrl.includes("localhost") || envApiUrl.includes("127.0.0.1")
								? "http://localhost:8000"
								: envApiUrl
						}

						const url = `${checkApiBaseUrl}/api/v1/prompts/?${params.toString()}`
						const headers: Record<string, string> = { "Content-Type": "application/json" }
						if (cached.etag) headers["If-None-Match"] = cached.etag

						const response = await fetch(url, {
							method: "GET",
							headers,
							signal: AbortSignal.timeout(3000),
						})

						if (response.status === 304) {
							console.log(`[PromptAPI] Not modified (304), using cache`)
							await context.globalState.update(cacheKey, { ...cached, timestamp: Date.now() })
							return cached.content
						}

						if (response.ok) {
							const data: PromptApiResponse = await response.json()
							const prompt = data.prompts?.find((p) => p.status === "published")
							if (prompt) {
								const content = buildPromptContent(prompt.template, normalizedLang)
								if (content.trim()) {
									const etag = response.headers.get("ETag")
									await context.globalState.update(cacheKey, {
										content,
										etag: etag || undefined,
										timestamp: Date.now(),
										version: prompt.version,
										cacheLogicVersion: CACHE_LOGIC_VERSION,
									})
									console.log(`[PromptAPI] Cache updated for mode=${mode}`)
									return content
								}
							}
						}
					} catch (error) {
						console.log(`[PromptAPI] ETag check failed, using cache`)
					}
					return cached.content
				} else {
					console.log(`[PromptAPI] Cache expired for mode=${mode}`)
				}
			}
		}
	}

	// Determine API base URL
	if (!apiBaseUrl) {
		const envApiUrl = AIIDEBAS_PROMPTS_API_BASE_URL
		if (envApiUrl.includes("localhost") || envApiUrl.includes("127.0.0.1")) {
			apiBaseUrl = "http://localhost:8000"
		} else {
			apiBaseUrl = envApiUrl
		}
		console.log(`[PromptAPI] Using API: ${apiBaseUrl}`)
	}

	try {
		const role = modeToRole(mode)
		const normalizedLang = normalizeLang(language)
		const params = new URLSearchParams({ role })
		if (normalizedLang) params.append("lang", normalizedLang)
		const url = `${apiBaseUrl}/api/v1/prompts/?${params.toString()}`

		const headers: Record<string, string> = { "Content-Type": "application/json" }

		// Add If-None-Match if cache exists
		if (context) {
			const cached = context.globalState.get<CachedPrompt>(cacheKey)
			if (cached?.etag) headers["If-None-Match"] = cached.etag
		}

		console.log(`[PromptAPI] Fetching: mode=${mode}, role=${role}`)

		const response = await fetch(url, {
			method: "GET",
			headers,
			signal: AbortSignal.timeout(apiBaseUrl.includes("localhost") ? 2000 : 5000),
		})

		console.log(`[PromptAPI] Response: ${response.status}`)

		// 304 Not Modified
		if (response.status === 304) {
			if (context) {
				const cached = context.globalState.get<CachedPrompt>(cacheKey)
				if (cached && cached.cacheLogicVersion === CACHE_LOGIC_VERSION) {
					console.log(`[PromptAPI] Not modified (304), using cache`)
					await context.globalState.update(cacheKey, {
						...cached,
						timestamp: Date.now(),
						cacheLogicVersion: CACHE_LOGIC_VERSION,
					})
					return cached.content
				}
			}
			console.warn(`[PromptAPI] 304 but no cache`)
			return null
		}

		// Rate limit
		if (response.status === 429) {
			console.warn(`[PromptAPI] Rate limit (429)`)
			if (context) {
				const cached = context.globalState.get<CachedPrompt>(cacheKey)
				if (cached) {
					console.log(`[PromptAPI] Using cache on rate limit`)
					return cached.content
				}
			}
			return null
		}

		if (!response.ok) {
			console.warn(`[PromptAPI] HTTP ${response.status}`)
			if (context) {
				const cached = context.globalState.get<CachedPrompt>(cacheKey)
				if (cached) {
					console.log(`[PromptAPI] Using stale cache`)
					return cached.content
				}
			}
			return null
		}

		const data: PromptApiResponse = await response.json()
		console.log(`[PromptAPI] Received ${data.prompts?.length || 0} prompts`)

		if (!data.prompts || data.prompts.length === 0) {
			console.warn(`[PromptAPI] No prompts for role=${role}`)
			if (context) {
				const cached = context.globalState.get<CachedPrompt>(cacheKey)
				if (cached) {
					console.warn(`[PromptAPI] Using stale cache`)
					return cached.content
				}
			}
			return null
		}

		const prompt = selectLatestPrompt(data.prompts, "published", role)
		if (!prompt) {
			console.warn(`[PromptAPI] No published prompts for role=${role}`)
			if (context) {
				const cached = context.globalState.get<CachedPrompt>(cacheKey)
				if (cached) {
					console.warn(`[PromptAPI] Using stale cache`)
					return cached.content
				}
			}
			return null
		}

		console.log(`[PromptAPI] Found prompt: id=${prompt.id}, version=${prompt.version}`)

		const content = buildPromptContent(prompt.template, normalizedLang)
		console.log(`[PromptAPI] Built content: ${content.length} chars`)

		if (!content.trim()) {
			console.warn(`[PromptAPI] Empty content for role=${role}`)
			if (context) {
				const cached = context.globalState.get<CachedPrompt>(cacheKey)
				if (cached) {
					console.log(`[PromptAPI] Using cache (empty content)`)
					return cached.content
				}
			}
			return null
		}

		// Save to cache
		if (context) {
			const etag = response.headers.get("ETag")
			await context.globalState.update(cacheKey, {
				content,
				etag: etag || undefined,
				timestamp: Date.now(),
				version: prompt.version,
				updated_at: prompt.updated_at,
				cacheLogicVersion: CACHE_LOGIC_VERSION,
			})
			console.log(`[PromptAPI] Cached for mode=${mode}`)
		}

		console.log(`[PromptAPI] Loaded ${content.length} chars for mode=${mode}`)
		return content
	} catch (error) {
		if (context) {
			const cached = context.globalState.get<CachedPrompt>(cacheKey)
			if (cached) {
				console.log(`[PromptAPI] Network error, using cache`)
				return cached.content
			}
		}

		// Fallback: try configured API if localhost failed
		if (!apiBaseUrl || apiBaseUrl === "http://localhost:8000") {
			const fallbackUrl = AIIDEBAS_PROMPTS_API_BASE_URL
			if (fallbackUrl !== "http://localhost:8000") {
				try {
					console.log(`[PromptAPI] Localhost failed, trying configured API (${fallbackUrl})...`)
					return await loadPromptFromApi(mode, language, fallbackUrl, context)
				} catch (fallbackError) {
					console.warn(`[PromptAPI] Both localhost and configured API failed`)
				}
			}
		}

		console.warn(`[PromptAPI] Failed: ${error instanceof Error ? error.message : error}`)
		return null
	}
}

// API /modes endpoint types
interface ApiModeResponse {
	name: string
	slug: string
	role_definition: string | Record<string, string>
	short_description?: Record<string, string> | null
	when_to_use?: Record<string, string> | null
	emoji?: string | null
	is_global: boolean
	target_roles: string[]
}

interface ApiModesResponse {
	modes: ApiModeResponse[]
	total: number
}

// Get all roles from API /modes endpoint
export async function getAllRolesFromApi(
	apiBaseUrl?: string,
	language?: string
): Promise<Array<{ slug: string; name: string; emoji?: string; target_roles: string[]; role_definition?: string | Record<string, string>; short_description?: Record<string, string>; when_to_use?: Record<string, string> }>> {
	if (!apiBaseUrl) {
		const envApiUrl = AIIDEBAS_PROMPTS_API_BASE_URL
		// Production fallback
		if (envApiUrl.includes("api.aiidebas.com") && !envApiUrl.includes("api-test")) {
			console.warn(`[PromptAPI] Production API, using legacy endpoint`)
			return await getAllRolesFromApiLegacy(envApiUrl)
		}
		apiBaseUrl = envApiUrl.includes("localhost") || envApiUrl.includes("127.0.0.1")
			? "http://localhost:8000"
			: envApiUrl
	}

	const normalizedLang = normalizeLang(language)
	const params = new URLSearchParams()
	if (normalizedLang) params.append("lang", normalizedLang)
	const url = `${apiBaseUrl}/api/v1/prompts/modes${params.toString() ? `?${params.toString()}` : ""}`
	console.log(`[PromptAPI] Fetching modes from ${url}`)

	try {
		const response = await fetch(url, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(5000),
		})

		if (!response.ok) {
			if (response.status === 404) {
				console.log(`[PromptAPI] /modes returned 404, using legacy`)
			} else {
				console.warn(`[PromptAPI] Failed to fetch modes: ${response.status}`)
			}
			return await getAllRolesFromApiLegacy(apiBaseUrl)
		}

		let data: ApiModesResponse
		try {
			data = await response.json()
		} catch (parseError) {
			console.warn(`[PromptAPI] Parse error, using legacy`)
			return await getAllRolesFromApiLegacy(apiBaseUrl)
		}

		if (!data || !Array.isArray(data.modes)) {
			console.warn(`[PromptAPI] Invalid response, using legacy`)
			return await getAllRolesFromApiLegacy(apiBaseUrl)
		}

		console.log(`[PromptAPI] Received ${data.modes.length} modes`)

		const result = data.modes.map((mode) => {
			const emoji = mode.emoji && mode.emoji.trim() ? mode.emoji.trim() : undefined
			return {
				slug: mode.slug,
				name: mode.name,
				emoji,
				target_roles: mode.target_roles,
				role_definition: mode.role_definition,
				short_description: mode.short_description || undefined,
				when_to_use: mode.when_to_use || undefined,
			}
		})

		console.log(`[PromptAPI] Returning ${result.length} modes`)
		return result
	} catch (error) {
		console.warn(`[PromptAPI] Error fetching modes: ${error}`)
		return await getAllRolesFromApiLegacy(apiBaseUrl)
	}
}

// Legacy: load roles from /prompts endpoint
async function getAllRolesFromApiLegacy(
	apiBaseUrl: string
): Promise<Array<{ slug: string; name: string; emoji?: string; target_roles: string[] }>> {
	const url = `${apiBaseUrl}/api/v1/prompts/?lang=all`
	console.log(`[PromptAPI] Legacy fetch: ${url}`)

	try {
		const response = await fetch(url, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(5000),
		})

		if (!response.ok) {
			console.warn(`[PromptAPI] Legacy failed: ${response.status}`)
			return []
		}

		const data: PromptApiResponse = await response.json()
		console.log(`[PromptAPI] Legacy received ${data.prompts.length} prompts`)

		// Extract unique roles from published prompts
		const rolesMap = new Map<string, { name: string; emoji?: string; target_roles: string[] }>()

		data.prompts
			.filter(p => p.status === "published")
			.forEach(prompt => {
				const emoji = prompt.emoji && prompt.emoji.trim() ? prompt.emoji.trim() : undefined
				prompt.target_roles.forEach(role => {
					const roleSlug = role.toLowerCase()
					if (!rolesMap.has(roleSlug)) {
						rolesMap.set(roleSlug, { name: prompt.name, emoji, target_roles: prompt.target_roles })
					} else if (emoji && !rolesMap.get(roleSlug)!.emoji) {
						rolesMap.get(roleSlug)!.emoji = emoji
					}
				})
			})

		const result = Array.from(rolesMap.entries()).map(([slug, d]) => ({
			slug,
			name: d.name,
			emoji: d.emoji,
			target_roles: d.target_roles
		}))

		console.log(`[PromptAPI] Legacy returning ${result.length} roles`)
		return result
	} catch (error) {
		console.warn(`[PromptAPI] Legacy error: ${error}`)
		return []
	}
}
