import { type Language, isLanguage } from "@roo-code/types"

/**
 * Language name mapping from ISO codes to full language names.
 */

export const LANGUAGES: Record<Language, string> = {
	ca: "Català",
	de: "Deutsch",
	en: "English",
	es: "Español",
	fr: "Français",
	hi: "हिन्दी",
	id: "Bahasa Indonesia",
	it: "Italiano",
	ja: "日本語",
	ko: "한국어",
	nl: "Nederlands",
	pl: "Polski",
	"pt-BR": "Português",
	ru: "Русский",
	tr: "Türkçe",
	vi: "Tiếng Việt",
	"zh-CN": "简体中文",
	"zh-TW": "繁體中文",
}

/**
 * Gets the language name, handling both full codes (pt-BR, zh-CN) and normalized codes (pt, zh)
 * @param lang - Language code (e.g., "pt-BR", "zh-CN", "pt", "zh", "en")
 * @returns The full language name
 */
export const getLanguageName = (lang: string | undefined): string => {
	if (!lang) return "English"
	if (isLanguage(lang)) {
		return LANGUAGES[lang]
	}
	// Fallback for normalized codes
	const normalizedLang = lang.toLowerCase()
	if (normalizedLang === "pt") return LANGUAGES["pt-BR"]
	if (normalizedLang === "zh") return LANGUAGES["zh-CN"]
	return lang
}

/**
 * Formats a VSCode locale string to ensure the region code is uppercase.
 * For example, transforms "en-us" to "en-US" or "fr-ca" to "fr-CA".
 *
 * @param vscodeLocale - The VSCode locale string to format (e.g., "en-us", "fr-ca")
 * @returns The formatted locale string with uppercase region code
 */

export function formatLanguage(vscodeLocale: string): Language {
	if (!vscodeLocale) {
		return "en"
	}

	const formattedLocale = vscodeLocale.replace(/-(\w+)$/, (_, region) => `-${region.toUpperCase()}`)
	return isLanguage(formattedLocale) ? formattedLocale : "en"
}
