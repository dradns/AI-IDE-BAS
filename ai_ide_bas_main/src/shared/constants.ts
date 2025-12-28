export const AIIDEBAS_PLATFORM_STORAGE_KEY = "aiidebas.platform"
export const AIIDEBAS_EXTENSION_URI_SCHEME = "vscode://8eton.ai-ide-bas/auth/callback"

// ⚠️ TEST BRANCH: Default values point to test API
// ⚠️ ВАЖНО: Endpoint /modes доступен только в тестовом окружении (api-test.aiidebas.com)
// ⚠️ В продакшене endpoint /modes возвращает 404 до явного включения в бэкенде
// 
// For production/main branch, change defaults back to:
// - AIIDEBAS_API_BASE_URL: "https://api.aiidebas.com/api/v1"
// - AIIDEBAS_PROMPTS_API_BASE_URL: "https://api.aiidebas.com"
// 
// Environment variables can still override these defaults
export const AIIDEBAS_API_BASE_URL = process.env.AIIDEBAS_API_URL || "https://api-test.aiidebas.com/api/v1"
export const AIIDEBAS_API_BASE_URL_WITHOUT_PATH = AIIDEBAS_API_BASE_URL.replace("/api/v1", "")

// Prompts API URL - supports test environment via environment variable
// ⚠️ TEST BRANCH: Default value points to test API
// ⚠️ ВАЖНО: Endpoint /modes работает только с api-test.aiidebas.com
// ⚠️ При использовании продакшн API расширение автоматически fallback на старый endpoint /prompts
export const AIIDEBAS_PROMPTS_API_BASE_URL = process.env.AIIDEBAS_PROMPTS_API_URL || "https://api-test.aiidebas.com"


