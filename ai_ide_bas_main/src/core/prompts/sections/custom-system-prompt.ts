import fs from "fs/promises"
import path from "path"
import { Mode } from "../../../shared/modes"
import { fileExistsAtPath } from "../../../utils/fs"
import * as vscode from "vscode"

export type PromptVariables = {
	workspace?: string
	mode?: string
	language?: string
	shell?: string
	operatingSystem?: string
}

function interpolatePromptContent(content: string, variables: PromptVariables): string {
	let interpolatedContent = content
	for (const key in variables) {
		if (
			Object.prototype.hasOwnProperty.call(variables, key) &&
			variables[key as keyof PromptVariables] !== undefined
		) {
			const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g")
			interpolatedContent = interpolatedContent.replace(placeholder, variables[key as keyof PromptVariables]!)
		}
	}
	return interpolatedContent
}

/**
 * Safely reads a file, returning an empty string if the file doesn't exist
 */
async function safeReadFile(filePath: string): Promise<string> {
	try {
		const content = await fs.readFile(filePath, "utf-8")
		// When reading with "utf-8" encoding, content should be a string
		return content.trim()
	} catch (err) {
		const errorCode = (err as NodeJS.ErrnoException).code
		if (!errorCode || !["ENOENT", "EISDIR"].includes(errorCode)) {
			throw err
		}
		return ""
	}
}

/**
 * Get the path to a system prompt file for a specific mode
 */
export function getSystemPromptFilePath(cwd: string, mode: Mode): string {
	return path.join(cwd, ".roo", `system-prompt-${mode}`)
}

// Map mode slugs to built-in prompt filenames
function getBuiltinPromptFilename(mode: Mode): string | undefined {
	switch (mode) {
		case "code":
			return "ba.txt"
		case "architect":
			return "architect.txt"
		case "ask":
			return "sa.txt"
		case "debug":
			return "reviewer.txt"
		case "designer":
			return "designer.txt"
		case "helper":
			return "helper.txt"
		case "pm":
			return "pm.txt"
		default:
			return undefined
	}
}

/**
 * Loads custom system prompt from a file at .roo/system-prompt-[mode slug]
 * If the file doesn't exist, tries to load from the extension's dist/prompts/[filename]
 * If neither exists, returns an empty string
 */
export async function loadSystemPromptFile(cwd: string, mode: Mode, variables: PromptVariables): Promise<string> {
	// 1) Project-local override: .roo/system-prompt-[mode]
	const projectFilePath = getSystemPromptFilePath(cwd, mode)
	let rawContent = await safeReadFile(projectFilePath)
	if (rawContent) {
		return interpolatePromptContent(rawContent, variables)
	}

	// 2) Built-in prompts packaged with the extension: dist/prompts/<mapped filename>
	const filename = getBuiltinPromptFilename(mode)
	if (filename) {
		try {
			const uri = vscode.Uri.joinPath(vscode.extensions.getExtension("8eton.ai-ide-bas")!.extensionUri, "dist", "prompts", filename)
			const content = await fs.readFile(uri.fsPath, "utf-8")
			rawContent = content.trim()
			if (rawContent) {
				return interpolatePromptContent(rawContent, variables)
			}
		} catch (err) {
			// ignore, fallback to empty
		}
	}

	return ""
}

/**
 * Ensures the .roo directory exists, creating it if necessary
 */
export async function ensureRooDirectory(cwd: string): Promise<void> {
	const rooDir = path.join(cwd, ".roo")

	// Check if directory already exists
	if (await fileExistsAtPath(rooDir)) {
		return
	}

	// Create the directory
	try {
		await fs.mkdir(rooDir, { recursive: true })
	} catch (err) {
		// If directory already exists (race condition), ignore the error
		const errorCode = (err as NodeJS.ErrnoException).code
		if (errorCode !== "EEXIST") {
			throw err
		}
	}
}
