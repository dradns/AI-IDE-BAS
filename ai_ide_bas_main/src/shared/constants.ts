export const AIIDEBAS_PLATFORM_STORAGE_KEY = "aiidebas.platform"
export const AIIDEBAS_EXTENSION_URI_SCHEME = "vscode://8eton.ai-ide-bas/auth/callback"

// Test circuit defaults on this branch. Override via env for local.
// AIIDEBAS_API_URL, AIIDEBAS_PROMPTS_API_URL
export const AIIDEBAS_API_BASE_URL = process.env.AIIDEBAS_API_URL || "https://api-test.aiidebas.com/api/v1"
export const AIIDEBAS_API_BASE_URL_WITHOUT_PATH = AIIDEBAS_API_BASE_URL.replace("/api/v1", "")

// Prompts API base (no /api/v1).
export const AIIDEBAS_PROMPTS_API_BASE_URL = process.env.AIIDEBAS_PROMPTS_API_URL || "https://api-test.aiidebas.com"


