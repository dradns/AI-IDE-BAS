import fs from "fs/promises"
import path from "path"
import * as vscode from "vscode"
import { formatLanguage } from "../../shared/language"
import { Dirent } from "fs"

/**
 * Read all text files from a directory
 */
async function readTextFilesFromDirectory(dirPath: string): Promise<Array<{ filename: string; content: string }>> {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true })
		const files: Array<{ filename: string; content: string }> = []

		for (const entry of entries) {
			if (entry.isFile() && /\.(md|txt)$/i.test(entry.name)) {
				const filePath = path.join(dirPath, entry.name)
				try {
					const content = await fs.readFile(filePath, "utf-8")
					if (content.trim()) {
						files.push({ filename: entry.name, content: content.trim() })
					}
				} catch (err) {
					// Skip files that can't be read
				}
			}
		}

		return files
	} catch (err) {
		return []
	}
}

/**
 * Format directory content for rules display
 */
function formatDirectoryContent(dirPath: string, files: Array<{ filename: string; content: string }>): string {
	return files
		.map((file) => {
			return `# ${file.filename}\n\n${file.content}`
		})
		.join("\n\n")
}

/**
 * Load built-in rules from extension bundle as fallback
 */
export async function loadBuiltInModeRules(mode: string): Promise<string> {
    try {
        const extension = vscode.extensions.getExtension("8eton.ai-ide-bas")
        if (!extension) return ""

        const lang = formatLanguage(vscode.env.language) || "en"
        const candidates = []
        // Language-specific first (if not English)
        if (lang && lang !== "en") {
            candidates.push(["dist", "prompts", lang, `rules-${mode}`])
        }
        // Explicit English fallback
        candidates.push(["dist", "prompts", "en", `rules-${mode}`])
        // Legacy location without language subfolder
        candidates.push(["dist", "prompts", `rules-${mode}`])

        for (const parts of candidates) {
            try {
                const builtInRulesDir = vscode.Uri.joinPath(extension.extensionUri, ...parts)
                const files = await readTextFilesFromDirectory(builtInRulesDir.fsPath)
                if (files.length > 0) {
                    return formatDirectoryContent(builtInRulesDir.fsPath, files)
                }
            } catch {
                // try next candidate
            }
        }
	} catch (err) {
		// Built-in rules don't exist or can't be read, ignore
	}
	return ""
}
