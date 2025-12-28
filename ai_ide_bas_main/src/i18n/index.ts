import i18next from "./setup"

/**
 * Initialize i18next with the specified language
 *
 * @param language The language code to use
 */
export function initializeI18n(language: string): void {
	i18next.changeLanguage(language)
}

/**
 * Get the current language
 *
 * @returns The current language code
 */
export function getCurrentLanguage(): string {
	return i18next.language
}

/**
 * Change the current language
 * Normalizes language codes (pt-BR -> pt-BR, zh-CN -> zh-CN, ar-SA -> ar, but also supports base codes)
 *
 * @param language The language code to change to
 */
export function changeLanguage(language: string): void {
	// Normalize language: 
	// - Keep full codes like pt-BR, zh-CN for languages that have variants
	// - Normalize ar-SA, ar-EG, etc. to just "ar" (since we only have ar/ folder)
	// - Extract base code for other languages if variant doesn't exist
	let normalizedLang = language || "en"
	
	// Normalize Arabic variants to base "ar"
	if (normalizedLang.toLowerCase().startsWith("ar")) {
		normalizedLang = "ar"
	}
	// For other languages, try the full code first, i18next will fallback to base if needed
	// (e.g., pt-BR will try pt-BR first, then pt, then en)
	
	i18next.changeLanguage(normalizedLang)
}

/**
 * Translate a string using i18next
 *
 * @param key The translation key, can use namespace with colon, e.g. "common:welcome"
 * @param options Options for interpolation or pluralization
 * @returns The translated string
 */
export function t(key: string, options?: Record<string, any>): string {
	const result = i18next.t(key, options)
	// If translation returns the key itself, it means translation was not found
	if (result === key && !key.includes("{{")) {
		console.warn(`[i18n] Translation not found for key: "${key}", language: ${i18next.language}`)
	}
	return result
}

export default i18next
