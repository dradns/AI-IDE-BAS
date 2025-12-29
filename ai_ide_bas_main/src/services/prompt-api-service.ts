import * as vscode from "vscode"
import { AIIDEBAS_PROMPTS_API_BASE_URL } from "../shared/constants"

interface CachedPrompt {
	content: string
	etag?: string
	timestamp: number
	version?: string
	updated_at?: string
	cacheLogicVersion?: string
}

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
const EXPORT_DEBOUNCE_DELAY = 5000

// Returns cache key for prompt
function getCacheKey(mode: string, language?: string): string {
	const lang = language ? normalizeLang(language) || "all" : "all"
	return `${CACHE_KEY_PREFIX}${mode}_${lang}`
}

// Returns cache key for separated prompt data
function getCacheKeySeparated(mode: string, language?: string): string {
	const lang = language ? normalizeLang(language) || "all" : "all"
	return `${CACHE_KEY_PREFIX_SEPARATED}${mode}_${lang}`
}

interface CachedPromptSeparated {
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
		if (normalizedLang && value[normalizedLang]) {
			const result = pickText(value[normalizedLang], undefined)
			if (result) return result
		}

		// Try original language code
		if (lang && value[lang]) {
			const result = pickText(value[lang], undefined)
			if (result) return result
		}

		// Try language variants (zh-CN, pt-BR, es-ES, ar-SA)
		const langVariants = ["zh", "pt", "es", "ar"]
		if (normalizedLang && langVariants.includes(normalizedLang)) {
			const variantKey = Object.keys(value).find(key => key.toLowerCase().startsWith(normalizedLang))
			if (variantKey) {
				const result = pickText(value[variantKey], undefined)
				if (result) return result
			}
		}

		// Return empty if specific language requested but not found
		if (lang || normalizedLang) return ""

		// Fallback to English or first available
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
				if (cached.updated_at === prompt.updated_at) {
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
	onlyPublished: boolean = false
): Promise<{ systemPrompt: string; customInstructions: string; artifactsInstructions: string } | null> {
	const role = modeToRole(mode)
	const normalizedLang = normalizeLang(language)
	const cacheKey = getCacheKeySeparated(mode, language)
	
	// Try loading from cache
	let cached: CachedPromptSeparated | undefined
	if (context) {
		cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
		if (cached) {
			// Invalidate cache if logic version mismatch
			if (cached.cacheLogicVersion !== CACHE_LOGIC_VERSION) {
				console.log(`[PromptAPI] Cache version mismatch, invalidating`)
				cached = undefined
			} else {
				const age = Date.now() - cached.timestamp
				if (age < CACHE_TTL) {
					console.log(`[PromptAPI] Using cached prompt for mode=${mode}, age=${Math.round(age / 1000)}s`)
					// Start background update check
					checkForUpdatesSeparatedInBackground(mode, language, apiBaseUrl, cached, context).catch((err) => {
						console.debug(`[PromptAPI] Background check failed:`, err)
					})
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

	// Determine API base URL
	if (!apiBaseUrl) {
		const envApiUrl = AIIDEBAS_PROMPTS_API_BASE_URL
		if (envApiUrl.includes("localhost") || envApiUrl.includes("127.0.0.1")) {
			apiBaseUrl = "http://localhost:8000"
		} else {
			apiBaseUrl = envApiUrl.includes("api-test") ? envApiUrl : "https://api-test.aiidebas.com"
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

			console.log(`[PromptAPI] New format item: slug=${item.slug}, status=${item.status}`)

			// Check if unchanged by updated_at
			if (cached && cached.updated_at === item.updated_at) {
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

			// Extract data from new format
			const customInstructions = item.customInstructions || item.promptContent || item.exportedCustomInstructions || ""
			const systemPrompt = ""
			const artifactsInstructions = ""

			console.log(`[PromptAPI] Extracted customInstructions, length=${customInstructions.length}`)

			// Save to cache
			if (context) {
				await context.globalState.update(cacheKey, {
					systemPrompt,
					customInstructions,
					artifactsInstructions,
					timestamp: Date.now(),
					version: item.version || "1.0",
					etag: response.headers.get("ETag") || undefined,
					status: item.status,
					updated_at: item.updated_at,
					cacheLogicVersion: CACHE_LOGIC_VERSION,
				})
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

		// Check if unchanged
		if (prompt && cached && cached.updated_at === prompt.updated_at) {
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

		// Fallback: try finding by status only
		if (!prompt) {
			prompt = selectLatestPrompt(data.prompts, "published")
			if (!prompt) {
				if (onlyPublished) {
					console.log(`[PromptAPI] No published prompts for role=${role}`)
				} else {
					prompt = selectLatestPrompt(data.prompts, "draft", role)
					if (prompt) {
						useDraft = true
						console.log(`[PromptAPI] Using draft for role=${role}`)
					}
				}
			} else {
				console.warn(`[PromptAPI] Found published but target_roles mismatch for role=${role}`)
			}
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

				await context.globalState.update(cacheKey, {
					systemPrompt,
					customInstructions,
					artifactsInstructions,
					timestamp: Date.now(),
					version: prompt.version,
					etag: etag || undefined,
					status: prompt.status,
					updated_at: prompt.updated_at,
					cacheLogicVersion: CACHE_LOGIC_VERSION,
				})
				console.log(`[PromptAPI] Cached for mode=${mode}, status=${prompt.status}`)

				// Trigger background export on new role or update
				const isNewRole = !cached
				if ((wasUpdated || isNewRole) && !useDraft) {
					const reason = isNewRole ? "new role" : "prompt update"
					console.log(`[PromptAPI] Scheduling export (${reason})`)
					if (exportDebounceTimer) clearTimeout(exportDebounceTimer)
					exportDebounceTimer = setTimeout(() => {
						exportDebounceTimer = null
						console.log(`[PromptAPI] Executing export after ${reason}`)
						import("./prompt-export-service").then(({ exportPromptsFromApi, exportPromptsToExtensionDist }) => {
							exportPromptsFromApi(context, undefined, false).catch((error) => {
								console.warn(`[PromptAPI] Export to ~/.roo failed: ${error}`)
							})
							exportPromptsToExtensionDist(context).catch((error: any) => {
								console.warn(`[PromptAPI] Export to dist/prompts failed: ${error}`)
							})
						}).catch((error) => {
							console.warn(`[PromptAPI] Failed to load export service: ${error}`)
						})
					}, EXPORT_DEBOUNCE_DELAY)
				}
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
									artifacts: artifactsForLang
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
					artifacts: artifactsForLang
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
				const cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
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

		const data: PromptApiResponse = await response.json()

		let prompt = selectLatestPrompt(data.prompts || [], "published", role)
		if (!prompt && !onlyPublished) prompt = selectLatestPrompt(data.prompts || [], "draft", role)

		if (!prompt) {
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

		if (!apiBaseUrl) {
			apiBaseUrl = AIIDEBAS_PROMPTS_API_BASE_URL.includes("api-test")
				? AIIDEBAS_PROMPTS_API_BASE_URL
				: "https://api-test.aiidebas.com"
		}

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
			const data: PromptApiResponse = await response.json()
			const role = modeToRole(mode)
			let prompt = selectLatestPrompt(data.prompts || [], "published", role)
			if (!prompt) prompt = selectLatestPrompt(data.prompts || [], "published")

			if (prompt) {
				// Check if unchanged
				if (cached.updated_at === prompt.updated_at) {
					console.log(`[PromptAPI] Background: prompt unchanged`)
					const cacheKey = getCacheKeySeparated(mode, language)
					await context.globalState.update(cacheKey, {
						...cached,
						timestamp: Date.now(),
						cacheLogicVersion: CACHE_LOGIC_VERSION,
					})
					return
				}

				console.log(`[PromptAPI] Background: prompt changed`)

				const systemPrompt = buildSystemPromptFromTemplate(prompt.template, normalizedLang)
				const customInstructions = buildCustomInstructionsFromTemplate(prompt.template, language)
				const artifactsInstructions = buildArtifactsInstructionsFromTemplate(prompt.template, language)

				if (systemPrompt.trim() || customInstructions.trim() || artifactsInstructions.trim()) {
					const etag = response.headers.get("ETag")
					const cacheKey = getCacheKeySeparated(mode, language)
					await context.globalState.update(cacheKey, {
						systemPrompt,
						customInstructions,
						artifactsInstructions,
						timestamp: Date.now(),
						version: prompt.version,
						etag: etag || undefined,
						status: prompt.status,
						updated_at: prompt.updated_at,
						cacheLogicVersion: CACHE_LOGIC_VERSION,
					})
					console.log(`[PromptAPI] Background cache updated for mode=${mode}`)

					// Schedule background export
					if (exportDebounceTimer) clearTimeout(exportDebounceTimer)
					exportDebounceTimer = setTimeout(() => {
						exportDebounceTimer = null
						console.log(`[PromptAPI] Executing export after background update`)
						import("./prompt-export-service").then(({ exportPromptsFromApi, exportPromptsToExtensionDist }) => {
							exportPromptsFromApi(context, undefined, false).catch((error) => {
								console.warn(`[PromptAPI] Export failed: ${error}`)
							})
							exportPromptsToExtensionDist(context).catch((error: any) => {
								console.warn(`[PromptAPI] Dist export failed: ${error}`)
							})
						}).catch((error) => {
							console.warn(`[PromptAPI] Failed to load export service: ${error}`)
						})
					}, EXPORT_DEBOUNCE_DELAY)
				}
			} else {
				// Clear stale cache if prompt deleted
				console.log(`[PromptAPI] No prompt in background, clearing cache for mode=${mode}`)
				const cacheKey = getCacheKeySeparated(mode, language)
				await context.globalState.update(cacheKey, undefined)
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
		await context.globalState.update(cacheKey, undefined)
		console.log(`[PromptAPI] Cleared cache for mode=${mode}`)
	} else {
		const knownModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
		const languages = [undefined, "ru", "en", "es", "zh", "ar", "pt"]

		let clearedCount = 0
		for (const m of knownModes) {
			for (const lang of languages) {
				const cacheKey = getCacheKeySeparated(m, lang)
				const cached = context.globalState.get<CachedPromptSeparated>(cacheKey)
				if (cached) {
					await context.globalState.update(cacheKey, undefined)
					clearedCount++
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

// Refresh all prompts from API
export async function refreshAllPromptsFromApi(
	context: vscode.ExtensionContext,
	language?: string,
	apiBaseUrl?: string
): Promise<void> {
	const normalizedLang = normalizeLang(language)

	if (!apiBaseUrl) {
		apiBaseUrl = AIIDEBAS_PROMPTS_API_BASE_URL.includes("api-test")
			? AIIDEBAS_PROMPTS_API_BASE_URL
			: "https://api-test.aiidebas.com"
	}

	// Load roles list from API
	let allModes: string[] = []
	try {
		const apiRoles = await getAllRolesFromApi(apiBaseUrl, language)
		if (apiRoles && apiRoles.length > 0) {
			allModes = apiRoles.map(role => role.slug.toLowerCase())
			console.log(`[PromptAPI] Loaded ${allModes.length} roles from API`)
		} else {
			allModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
			console.log(`[PromptAPI] No roles from API, using fallback`)
		}
	} catch (error) {
		allModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
		console.warn(`[PromptAPI] Failed to load roles, using fallback: ${error}`)
	}

	console.log(`[PromptAPI] Refreshing ${allModes.length} modes`)

	const refreshPromises = allModes.map(async (mode) => {
		try {
			await loadPromptFromApiSeparated(mode, normalizedLang, apiBaseUrl, context)
			console.log(`[PromptAPI] Refreshed mode=${mode}`)
		} catch (error) {
			console.warn(`[PromptAPI] Failed to refresh mode=${mode}: ${error}`)
		}
	})

	await Promise.allSettled(refreshPromises)
	console.log(`[PromptAPI] Refresh completed for ${allModes.length} modes`)

	// Notify webview with updated roles list
	try {
		const { ClineProvider } = await import("../core/webview/ClineProvider")
		const visibleProvider = ClineProvider.getVisibleInstance()
		if (visibleProvider) {
			const apiRoles = await getAllRolesFromApi(apiBaseUrl, language)
			await visibleProvider.contextProxy.setValue("cachedApiRoles", apiRoles)
			visibleProvider.postMessageToWebview({ type: "apiRoles", apiRoles })
			visibleProvider.postMessageToWebview({ type: "promptsUpdated", timestamp: Date.now() })
			console.log(`[PromptAPI] Sent ${apiRoles.length} roles to webview after refresh`)
		}
	} catch (error) {
		console.debug(`[PromptAPI] Failed to notify webview with roles:`, error)
	}

	// Schedule export after refresh
	if (exportDebounceTimer) clearTimeout(exportDebounceTimer)
	exportDebounceTimer = setTimeout(() => {
		exportDebounceTimer = null
		console.log(`[PromptAPI] Executing export after refresh`)
		import("./prompt-export-service").then(({ exportPromptsFromApi, exportPromptsToExtensionDist }) => {
			exportPromptsFromApi(context, undefined, false).catch((error) => {
				console.warn(`[PromptAPI] Export failed: ${error}`)
			})
			exportPromptsToExtensionDist(context).catch((error) => {
				console.warn(`[PromptAPI] Dist export failed: ${error}`)
			})
		}).catch((error) => {
			console.warn(`[PromptAPI] Failed to load export service: ${error}`)
		})
	}, EXPORT_DEBOUNCE_DELAY)
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
