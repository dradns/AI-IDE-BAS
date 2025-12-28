import fs from "fs/promises"
import path from "path"
import * as vscode from "vscode"

import { ModeConfig } from "@roo-code/types"
import { getRooDirectoriesForCwd } from "../roo-config"
import { loadBuiltInModeRules } from "../builtin-rules"

interface ModeInfo {
	roleDefinition?: string
	description?: string
	whenToUse?: string
}

/**
 * Parse mode info from markdown/text content
 * Looks for specific patterns to extract role definition, description, and when to use
 */
function parseModeInfoFromContent(content: string): ModeInfo {
	const info: ModeInfo = {}
	
	// Look for role definition (You are... pattern)
	const roleDefMatch = content.match(/(?:^|\n)(?:You are|Roo как|Ты являешься)\s+([^]+?)(?:\n\n|\n(?=[A-Z])|$)/i)
	if (roleDefMatch) {
		info.roleDefinition = roleDefMatch[0].trim()
	}
	
	// Look for description patterns
	const descMatch = content.match(/(?:^|\n)(?:Description|Описание|Short description):\s*([^]+?)(?:\n\n|\n(?=[A-Z])|$)/i)
	if (descMatch) {
		info.description = descMatch[1].trim()
	}
	
	// Look for when to use patterns
	const whenMatch = content.match(/(?:^|\n)(?:When to use|Когда использовать|Use this mode):\s*([^]+?)(?:\n\n|\n(?=[A-Z])|$)/i)
	if (whenMatch) {
		info.whenToUse = whenMatch[1].trim()
	}
	
	return info
}

/**
 * Read all files from a directory and extract mode info
 */
async function readModeInfoFromDirectory(dirPath: string): Promise<ModeInfo> {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true })
		let combinedInfo: ModeInfo = {}
		
		for (const entry of entries) {
			if (entry.isFile() && /\.(md|txt)$/i.test(entry.name)) {
				const filePath = path.join(dirPath, entry.name)
				try {
					const content = await fs.readFile(filePath, "utf-8")
					const fileInfo = parseModeInfoFromContent(content)
					
					// Merge info, preferring first found values
					if (!combinedInfo.roleDefinition && fileInfo.roleDefinition) {
						combinedInfo.roleDefinition = fileInfo.roleDefinition
					}
					if (!combinedInfo.description && fileInfo.description) {
						combinedInfo.description = fileInfo.description
					}
					if (!combinedInfo.whenToUse && fileInfo.whenToUse) {
						combinedInfo.whenToUse = fileInfo.whenToUse
					}
				} catch (err) {
					// Skip files that can't be read
				}
			}
		}
		
		return combinedInfo
	} catch (err) {
		return {}
	}
}

/**
 * Load mode information from rules directories with fallback chain:
 * 1. User's project .roo/rules-{mode}/
 * 2. User's global ~/.roo/rules-{mode}/
 * 3. Built-in rules from extension dist/prompts/rules-{mode}/
 * 4. Mode JSON configuration
 */
export async function loadModeInfo(
	modeSlug: string, 
	options: {
		cwd?: string
		customModes?: ModeConfig[]
		builtInMode?: ModeConfig
	} = {}
): Promise<ModeInfo> {
	const { cwd, customModes, builtInMode } = options
	let info: ModeInfo = {}
	
	// Step 1 & 2: Check user's .roo directories (if cwd provided)
	if (cwd) {
		const rooDirectories = getRooDirectoriesForCwd(cwd)
		
		for (const rooDir of rooDirectories) {
			// Use mode slug directly from API (e.g., code, debug)
			const modeRulesDir = path.join(rooDir, `rules-${modeSlug}`)
			const dirInfo = await readModeInfoFromDirectory(modeRulesDir)
			
			// Merge info, preferring first found values
			if (!info.roleDefinition && dirInfo.roleDefinition) {
				info.roleDefinition = dirInfo.roleDefinition
			}
			if (!info.description && dirInfo.description) {
				info.description = dirInfo.description
			}
			if (!info.whenToUse && dirInfo.whenToUse) {
				info.whenToUse = dirInfo.whenToUse
			}
		}
	}
	
	// Step 3: Check built-in rules from extension
	// ⚠️ ВАЖНО: Для новых ролей из API (не встроенных) не используем fallback к встроенным правилам
	// Это предотвращает использование метаданных из встроенных режимов для новых ролей
	const knownModes = ["code", "architect", "ask", "debug", "designer", "helper", "pm"]
	const isBuiltInMode = knownModes.includes(modeSlug)
	
	if (isBuiltInMode && (!info.roleDefinition || !info.description || !info.whenToUse)) {
		try {
			const builtInRules = await loadBuiltInModeRules(modeSlug)
			if (builtInRules) {
				const builtInInfo = parseModeInfoFromContent(builtInRules)
				
				if (!info.roleDefinition && builtInInfo.roleDefinition) {
					info.roleDefinition = builtInInfo.roleDefinition
				}
				if (!info.description && builtInInfo.description) {
					info.description = builtInInfo.description
				}
				if (!info.whenToUse && builtInInfo.whenToUse) {
					info.whenToUse = builtInInfo.whenToUse
				}
			}
		} catch (err) {
			// Ignore errors from built-in rules loading
		}
	} else if (!isBuiltInMode) {
		// Для новых ролей из API не используем fallback к встроенным правилам
		// Метаданные для новых ролей должны быть заданы через API/админку
		console.log(`[loadModeInfo] ⚠️ No rules found for new role mode=${modeSlug}, NOT using fallback to built-in rules`)
	}
	
	// Step 4: Fallback to JSON configuration
	const customMode = customModes?.find(mode => mode.slug === modeSlug)
	const mode = customMode || builtInMode
	
	if (mode) {
		if (!info.roleDefinition && mode.roleDefinition) {
			info.roleDefinition = mode.roleDefinition
		}
		if (!info.description && mode.description) {
			info.description = mode.description
		}
		if (!info.whenToUse && mode.whenToUse) {
			info.whenToUse = mode.whenToUse
		}
	}
	
	return info
}

/**
 * Enhanced versions of the helper functions that load from rules files
 */
export async function getRoleDefinitionFromRules(
	modeSlug: string, 
	options: {
		cwd?: string
		customModes?: ModeConfig[]
		builtInMode?: ModeConfig
	} = {}
): Promise<string> {
	const info = await loadModeInfo(modeSlug, options)
	return info.roleDefinition || ""
}

export async function getDescriptionFromRules(
	modeSlug: string, 
	options: {
		cwd?: string
		customModes?: ModeConfig[]
		builtInMode?: ModeConfig
	} = {}
): Promise<string> {
	const info = await loadModeInfo(modeSlug, options)
	return info.description || ""
}

export async function getWhenToUseFromRules(
	modeSlug: string, 
	options: {
		cwd?: string
		customModes?: ModeConfig[]
		builtInMode?: ModeConfig
	} = {}
): Promise<string> {
	const info = await loadModeInfo(modeSlug, options)
	return info.whenToUse || ""
}
