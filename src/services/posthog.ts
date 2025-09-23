import * as vscode from "vscode"
import * as path from "path"

// Lazily import Node ESM scripts via dynamic import of file URLs from extension assets

function getScriptsRoot(contextPath?: string): string {
	// extension compiled js lives in dist; scripts are outside. We execute them via Node using require('node:child_process').spawn
	return path.join(__dirname, "..", "..", "scripts", "posthog")
}

function ensureEnvLoaded(output: vscode.OutputChannel): void {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require("dotenv").config({ path: path.join(vscode.workspace.rootPath || process.cwd(), ".env") })
		output.appendLine("[PostHog] .env загружен")
	} catch (e) {
		output.appendLine(`[PostHog] dotenv не найден/не загружен: ${e}`)
	}
}

function validateRestEnvOrThrow(kind: "setup" | "analyze" | "alert", output: vscode.OutputChannel): void {
	const apiKey = process.env.POSTHOG_API_KEY || ""
	const projectId = process.env.POSTHOG_PROJECT_ID || ""
	const host = process.env.POSTHOG_HOST || ""

	const problems: string[] = []
	if (!apiKey) problems.push("POSTHOG_API_KEY is missing")
	if (!projectId) problems.push("POSTHOG_PROJECT_ID is missing")
	if (!host) problems.push("POSTHOG_HOST is missing")

	if (apiKey && apiKey.startsWith("phc_")) {
		problems.push("POSTHOG_API_KEY is phc_. Use Personal API Key phx_ for REST")
	}
	if (apiKey && !apiKey.startsWith("phx_")) {
		problems.push("POSTHOG_API_KEY does not look like phx_ Personal API Key")
	}

	if (problems.length) {
		const msg = `[PostHog][REST ${kind}] Env validation failed: ${problems.join(", ")}`
		output.appendLine(msg)
		throw new Error(msg)
	}

	// Optional cross-check to warn if SDK key misused
	const sdkKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || ""
	if (sdkKey && sdkKey.startsWith("phx_")) {
		output.appendLine("[PostHog][SDK] NEXT_PUBLIC_POSTHOG_KEY is phx_. Use phc_ for SDK events")
	}
}

async function runNodeScript(output: vscode.OutputChannel, args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || vscode.workspace.rootPath || process.cwd()
		const scriptPath = path.join(wsRoot, "scripts", "posthog", "setup-and-alerts.mjs")
		const fs = require("node:fs")
		if (!fs.existsSync(scriptPath)) {
			const msg = `[PostHog] Не найден скрипт: ${scriptPath}. Убедитесь, что открыт корень репозитория.`
			output.appendLine(msg)
			return reject(new Error(msg))
		}
		const cp = require("node:child_process").spawn(process.execPath, [scriptPath, ...args], {
			cwd: wsRoot,
			env: process.env,
			shell: false,
		})

		let lastLines: string[] = []
		const pushLine = (line: string) => {
			output.appendLine(line)
			lastLines.push(line)
			if (lastLines.length > 10) lastLines.shift()
		}

		cp.stdout.on("data", (d: Buffer) => pushLine(d.toString().trimEnd()))
		cp.stderr.on("data", (d: Buffer) => pushLine(d.toString().trimEnd()))
		cp.on("close", (code: number) => {
			if (code === 0) resolve()
			else reject(new Error(`Script exited with code ${code}. Last lines: ${lastLines.join(" | ")}`))
		})
	})
}

export async function runPosthogSetup(output: vscode.OutputChannel): Promise<void> {
	ensureEnvLoaded(output)
	output.appendLine("[PostHog] Setup: старт")
	validateRestEnvOrThrow("setup", output)
	await runNodeScript(output, ["setup"]).catch((e: unknown) => {
		throw e
	})
}

export async function runPosthogAnalyze(output: vscode.OutputChannel): Promise<void> {
	ensureEnvLoaded(output)
	output.appendLine("[PostHog] Analyze: старт")
	validateRestEnvOrThrow("analyze", output)
	// analyze is a separate file
	return new Promise((resolve, reject) => {
		const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || vscode.workspace.rootPath || process.cwd()
		const scriptPath = path.join(wsRoot, "scripts", "posthog", "analyze.mjs")
		const fs = require("node:fs")
		if (!fs.existsSync(scriptPath)) {
			const msg = `[PostHog] Не найден скрипт: ${scriptPath}. Убедитесь, что открыт корень репозитория.`
			output.appendLine(msg)
			return reject(new Error(msg))
		}
		const cp = require("node:child_process").spawn(process.execPath, [scriptPath], {
			cwd: wsRoot,
			env: process.env,
			shell: false,
		})
		let lastLines: string[] = []
		const pushLine = (line: string) => {
			output.appendLine(line)
			lastLines.push(line)
			if (lastLines.length > 10) lastLines.shift()
		}
		cp.stdout.on("data", (d: Buffer) => pushLine(d.toString().trimEnd()))
		cp.stderr.on("data", (d: Buffer) => pushLine(d.toString().trimEnd()))
		cp.on("close", (code: number) => {
			if (code === 0) resolve()
			else reject(new Error(`Script exited with code ${code}. Last lines: ${lastLines.join(" | ")}`))
		})
	})
}

export async function runPosthogAlertTest(output: vscode.OutputChannel): Promise<void> {
	ensureEnvLoaded(output)
	output.appendLine("[PostHog] Alert Test: старт")
	validateRestEnvOrThrow("alert", output)
	await runNodeScript(output, ["alert"]).catch((e: unknown) => {
		throw e
	})
}
