import * as path from "path"
import * as os from "os"
import fs from "fs/promises"
import * as vscode from "vscode"

// Cache for global .roo directory existence check to avoid repeated macOS permission dialogs
// Cache TTL: 30 seconds (enough to avoid repeated prompts, but not too long to miss actual changes)
const GLOBAL_ROO_CACHE_TTL = 30_000 // 30 seconds
let globalRooCache: { exists: boolean; timestamp: number } | null = null

/**
 * Gets the global .roo directory path based on the current platform
 *
 * @returns The absolute path to the global .roo directory
 *
 * @example Platform-specific paths:
 * ```
 * // macOS/Linux: ~/.roo/
 * // Example: /Users/john/.roo
 *
 * // Windows: %USERPROFILE%\.roo\
 * // Example: C:\Users\john\.roo
 * ```
 *
 * @example Usage:
 * ```typescript
 * const globalDir = getGlobalRooDirectory()
 * // Returns: "/Users/john/.roo" (on macOS/Linux)
 * // Returns: "C:\\Users\\john\\.roo" (on Windows)
 * ```
 */
export function getGlobalRooDirectory(): string {
	const homeDir = os.homedir()
	return path.join(homeDir, ".roo")
}

/**
 * Checks if global .roo directory exists with caching to avoid repeated macOS permission dialogs
 * @returns Promise<boolean> - true if directory exists, false otherwise
 */
export async function globalRooDirectoryExists(): Promise<boolean> {
	const now = Date.now()
	
	// Return cached result if still valid
	if (globalRooCache && (now - globalRooCache.timestamp) < GLOBAL_ROO_CACHE_TTL) {
		return globalRooCache.exists
	}
	
	// Check directory existence
	const globalDir = getGlobalRooDirectory()
	
	// ВАЖНО: Проверяем, не открыта ли папка ~/.roo как workspace
	// Если да, то не проверяем её существование, чтобы избежать запросов доступа macOS
	const workspaceFolders = vscode.workspace.workspaceFolders
	
	if (workspaceFolders) {
		for (const folder of workspaceFolders) {
			const workspacePath = path.normalize(folder.uri.fsPath)
			const normalizedGlobalDir = path.normalize(globalDir)
			
			// Если workspace является глобальной директорией .roo, возвращаем true без проверки
			// Это предотвращает постоянные запросы доступа macOS
			if (workspacePath === normalizedGlobalDir) {
				// Кэшируем результат как true, чтобы не проверять снова
				globalRooCache = { exists: true, timestamp: now }
				return true
			}
		}
	}
	
	let exists = false
	
	try {
		const stat = await fs.stat(globalDir)
		exists = stat.isDirectory()
	} catch (error: any) {
		// Only catch expected "not found" errors
		if (error.code === "ENOENT" || error.code === "ENOTDIR") {
			exists = false
		} else {
			// For permission errors (EACCES, EPERM), assume directory might exist but we can't access it
			// This prevents repeated permission dialogs
			// Cache the "false" result to avoid repeated prompts
			exists = false
		}
	}
	
	// Update cache
	globalRooCache = { exists, timestamp: now }
	
	return exists
}

/**
 * Clears the global .roo directory existence cache
 * Useful when directory is created/deleted and we want to re-check immediately
 */
export function clearGlobalRooCache(): void {
	globalRooCache = null
}

/**
 * Gets the project-local .roo directory path for a given cwd
 *
 * @param cwd - Current working directory (project path)
 * @returns The absolute path to the project-local .roo directory
 *
 * @example
 * ```typescript
 * const projectDir = getProjectRooDirectoryForCwd('/Users/john/my-project')
 * // Returns: "/Users/john/my-project/.roo"
 *
 * const windowsProjectDir = getProjectRooDirectoryForCwd('C:\\Users\\john\\my-project')
 * // Returns: "C:\\Users\\john\\my-project\\.roo"
 * ```
 *
 * @example Directory structure:
 * ```
 * /Users/john/my-project/
 * ├── .roo/                    # Project-local configuration directory
 * │   ├── rules/
 * │   │   └── rules.md
 * │   ├── custom-instructions.md
 * │   └── config/
 * │       └── settings.json
 * ├── src/
 * │   └── index.ts
 * └── package.json
 * ```
 */
export function getProjectRooDirectoryForCwd(cwd: string): string {
	return path.join(cwd, ".roo")
}

/**
 * Checks if a directory exists
 * Uses cache for global .roo directory to avoid repeated macOS permission dialogs
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
	// Use cache for global .roo directory
	const globalDir = getGlobalRooDirectory()
	if (dirPath === globalDir || dirPath.startsWith(globalDir + path.sep)) {
		// Check if global directory exists first (using cache)
		const globalExists = await globalRooDirectoryExists()
		if (!globalExists) {
			return false
		}
		// If checking the global dir itself, return cached result
		if (dirPath === globalDir) {
			return globalExists
		}
		// For subdirectories, still need to check, but global dir exists
	}
	
	try {
		const stat = await fs.stat(dirPath)
		return stat.isDirectory()
	} catch (error: any) {
		// Only catch expected "not found" errors
		if (error.code === "ENOENT" || error.code === "ENOTDIR") {
			return false
		}
		// For permission errors on global .roo, return false to avoid repeated dialogs
		if ((error.code === "EACCES" || error.code === "EPERM") && 
		    (dirPath === globalDir || dirPath.startsWith(globalDir + path.sep))) {
			return false
		}
		// Re-throw unexpected errors (I/O, etc.)
		throw error
	}
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(filePath)
		return stat.isFile()
	} catch (error: any) {
		// Only catch expected "not found" errors
		if (error.code === "ENOENT" || error.code === "ENOTDIR") {
			return false
		}
		// Re-throw unexpected errors (permission, I/O, etc.)
		throw error
	}
}

/**
 * Reads a file safely, returning null if it doesn't exist
 * Uses cache for global .roo directory to avoid repeated macOS permission dialogs
 */
export async function readFileIfExists(filePath: string): Promise<string | null> {
	// Use cache for files in global .roo directory
	const globalDir = getGlobalRooDirectory()
	if (filePath.startsWith(globalDir + path.sep) || filePath === globalDir) {
		// Check if global directory exists first (using cache)
		const globalExists = await globalRooDirectoryExists()
		if (!globalExists) {
			return null
		}
	}
	
	try {
		return await fs.readFile(filePath, "utf-8")
	} catch (error: any) {
		// Only catch expected "not found" errors
		if (error.code === "ENOENT" || error.code === "ENOTDIR" || error.code === "EISDIR") {
			return null
		}
		// For permission errors on global .roo files, return null to avoid repeated dialogs
		if ((error.code === "EACCES" || error.code === "EPERM") && 
		    (filePath.startsWith(globalDir + path.sep) || filePath === globalDir)) {
			return null
		}
		// Re-throw unexpected errors (I/O, etc.)
		throw error
	}
}

/**
 * Gets the ordered list of .roo directories to check (global first, then project-local)
 *
 * @param cwd - Current working directory (project path)
 * @returns Array of directory paths to check in order [global, project-local]
 *
 * @example
 * ```typescript
 * // For a project at /Users/john/my-project
 * const directories = getRooDirectoriesForCwd('/Users/john/my-project')
 * // Returns:
 * // [
 * //   '/Users/john/.roo',           // Global directory
 * //   '/Users/john/my-project/.roo' // Project-local directory
 * // ]
 * ```
 *
 * @example Directory structure:
 * ```
 * /Users/john/
 * ├── .roo/                    # Global configuration
 * │   ├── rules/
 * │   │   └── rules.md
 * │   └── custom-instructions.md
 * └── my-project/
 *     ├── .roo/                # Project-specific configuration
 *     │   ├── rules/
 *     │   │   └── rules.md     # Overrides global rules
 *     │   └── project-notes.md
 *     └── src/
 *         └── index.ts
 * ```
 */
export function getRooDirectoriesForCwd(cwd: string): string[] {
	const directories: string[] = []
	const globalDir = getGlobalRooDirectory()
	const projectDir = getProjectRooDirectoryForCwd(cwd)

	// ВАЖНО: Если cwd является глобальной директорией .roo, не добавляем её дважды
	// Это предотвращает постоянные запросы доступа macOS при открытии ~/.roo как workspace
	const normalizedCwd = path.normalize(cwd)
	const normalizedGlobalDir = path.normalize(globalDir)
	
	// Добавляем глобальную директорию только если она не совпадает с cwd
	if (normalizedCwd !== normalizedGlobalDir) {
		directories.push(globalDir)
	}

	// Добавляем project-local директорию только если она не совпадает с глобальной
	// (чтобы избежать дублирования, если cwd = ~/.roo)
	if (path.normalize(projectDir) !== normalizedGlobalDir) {
		directories.push(projectDir)
	}

	return directories
}

/**
 * Loads configuration from multiple .roo directories with project overriding global
 *
 * @param relativePath - The relative path within each .roo directory (e.g., 'rules/rules.md')
 * @param cwd - Current working directory (project path)
 * @returns Object with global and project content, plus merged content
 *
 * @example
 * ```typescript
 * // Load rules configuration for a project
 * const config = await loadConfiguration('rules/rules.md', '/Users/john/my-project')
 *
 * // Returns:
 * // {
 * //   global: "Global rules content...",     // From ~/.roo/rules/rules.md
 * //   project: "Project rules content...",   // From /Users/john/my-project/.roo/rules/rules.md
 * //   merged: "Global rules content...\n\n# Project-specific rules (override global):\n\nProject rules content..."
 * // }
 * ```
 *
 * @example File paths resolved:
 * ```
 * relativePath: 'rules/rules.md'
 * cwd: '/Users/john/my-project'
 *
 * Reads from:
 * - Global: /Users/john/.roo/rules/rules.md
 * - Project: /Users/john/my-project/.roo/rules/rules.md
 *
 * Other common relativePath examples:
 * - 'custom-instructions.md'
 * - 'config/settings.json'
 * - 'templates/component.tsx'
 * ```
 *
 * @example Merging behavior:
 * ```
 * // If only global exists:
 * { global: "content", project: null, merged: "content" }
 *
 * // If only project exists:
 * { global: null, project: "content", merged: "content" }
 *
 * // If both exist:
 * {
 *   global: "global content",
 *   project: "project content",
 *   merged: "global content\n\n# Project-specific rules (override global):\n\nproject content"
 * }
 * ```
 */
export async function loadConfiguration(
	relativePath: string,
	cwd: string,
): Promise<{
	global: string | null
	project: string | null
	merged: string
}> {
	const globalDir = getGlobalRooDirectory()
	const projectDir = getProjectRooDirectoryForCwd(cwd)

	const globalFilePath = path.join(globalDir, relativePath)
	const projectFilePath = path.join(projectDir, relativePath)

	// Read global configuration (uses cache internally)
	// Check if global directory exists first to avoid unnecessary file read attempts
	const globalContent = await globalRooDirectoryExists() 
		? await readFileIfExists(globalFilePath)
		: null

	// Read project-local configuration
	const projectContent = await readFileIfExists(projectFilePath)

	// Merge configurations - project overrides global
	let merged = ""

	if (globalContent) {
		merged += globalContent
	}

	if (projectContent) {
		if (merged) {
			merged += "\n\n# Project-specific rules (override global):\n\n"
		}
		merged += projectContent
	}

	return {
		global: globalContent,
		project: projectContent,
		merged: merged || "",
	}
}

// Export with backward compatibility alias
export const loadRooConfiguration: typeof loadConfiguration = loadConfiguration
