import * as vscode from "vscode"
import { forceRefreshPrompt, refreshAllPromptsFromApi } from "./prompt-api-service"
import { formatLanguage } from "../shared/language"

// Checks and refreshes prompt for a specific mode.
export async function checkAndRefreshPromptForMode(
    context: vscode.ExtensionContext,
    mode: string,
    language?: string
): Promise<void> {
    const lang = language || formatLanguage(vscode.env.language)

    try {
        console.log(`[PromptRefresh] 🔄 Checking updates for mode=${mode}`)

        // Force fetch fresh version (clears cache + loads).
        await forceRefreshPrompt(context, mode, lang)

        console.log(`[PromptRefresh] ✅ Refreshed mode=${mode}`)
    } catch (error) {
        // Don't block user on refresh errors.
        console.error(`[PromptRefresh] ❌ Failed to refresh mode=${mode}:`, error)
    }
}

// Checks and refreshes all prompts for all modes.
export async function checkAndRefreshAllPrompts(
    context: vscode.ExtensionContext,
    language?: string
): Promise<void> {
    const lang = language || formatLanguage(vscode.env.language)

    try {
        console.log(`[PromptRefresh] 🔄 Checking updates for all modes`)

        // Refresh all prompts (loads only if changed).
        await refreshAllPromptsFromApi(context, lang)

        console.log(`[PromptRefresh] ✅ Refreshed all modes`)
    } catch (error) {
        // Don't block user on refresh errors.
        console.error(`[PromptRefresh] ❌ Failed to refresh all modes:`, error)
    }
}

// Quick non-blocking background refresh check.
export async function checkAndRefreshPromptsIfNeeded(
    context: vscode.ExtensionContext,
    language?: string
): Promise<void> {
    // Run in background, don't block UI. Log errors silently.
    checkAndRefreshAllPrompts(context, language).catch((err) => {
        console.debug(`[PromptRefresh] Background refresh failed:`, err)
    })
}
