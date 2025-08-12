import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as path from "path"

/**
 * Export current Markdown document to PDF with a watermark.
 * We render Markdown to HTML using VS Code's built-in Markdown engine,
 * then print to PDF via Puppeteer-Core with a bundled Chromium.
 *
 * Note: We already depend on puppeteer-core and puppeteer-chromium-resolver in package.json.
 * This avoids requiring the external extension dependency.
 */
export async function exportMarkdownToPdf(): Promise<void> {
	const editor = vscode.window.activeTextEditor
	if (!editor || editor.document.languageId !== "markdown") {
		vscode.window.showErrorMessage("Откройте Markdown файл и повторите попытку.")
		return
	}

	const doc = editor.document
	const markdownText = doc.getText()

	// Ask for output path
	const defaultPdfPath = doc.uri.fsPath.replace(/\.md$/i, ".pdf")
	const target = await vscode.window.showSaveDialog({
		filters: { PDF: ["pdf"] },
		defaultUri: vscode.Uri.file(defaultPdfPath),
	})
	if (!target) return

	const html = await renderMarkdownToHtml(markdownText, doc.uri)
	await renderHtmlToPdfWithWatermark(html, target.fsPath)

	vscode.window.showInformationMessage(`PDF сохранён: ${target.fsPath}`)
}

async function renderMarkdownToHtml(markdown: string, resource: vscode.Uri): Promise<string> {
	// Use built-in Markdown converter via command
	// Fallback to simple wrapper if command is unavailable
	try {
		const html = (await vscode.commands.executeCommand("markdown.api.render", markdown, resource)) as
			| string
			| undefined
		if (typeof html === "string") {
			return wrapHtml(html)
		}
	} catch {
		// ignore and fallback
	}
	return wrapHtml(escapeHtml(markdown))
}

function wrapHtml(innerHtml: string): string {
	// Basic print-oriented HTML with light defaults and watermark container
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'; line-height: 1.6; }
    .page { position: relative; padding: 1.5cm; box-sizing: border-box; }
    .content { position: relative; z-index: 1; }
    pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
    pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; }
    h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
    img, table, pre { page-break-inside: avoid; }
    @page { size: A4; margin: 1.5cm; }
  </style>
  <title>Markdown Export</title>
 </head>
<body>
  <main class="page">
    <div class="content">${innerHtml}</div>
  </main>
</body>
</html>`
}

function escapeHtml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

async function renderHtmlToPdfWithWatermark(html: string, pdfPath: string): Promise<void> {
	// Resolve Chromium path robustly
	const executablePath = await resolveChromiumExecutablePath()

	const pptrMod: any = await import("puppeteer-core")
	const puppeteer = pptrMod?.default ?? pptrMod
	const launchOpts: any = {
		headless: true,
		args: ["--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox"],
	}
	if (executablePath) {
		launchOpts.executablePath = executablePath
	} else {
		// As a fallback, try using system Chrome channel (supported by newer puppeteer-core)
		launchOpts.channel = "chrome"
	}
	const browser = await puppeteer.launch(launchOpts)

	try {
		const page = await browser.newPage()
		// Use a data URL to avoid temp files
		const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
		await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 120_000 })
		await page.pdf({
			path: pdfPath,
			printBackground: true,
			format: "A4",
			displayHeaderFooter: true,
			headerTemplate: "<div></div>",
			footerTemplate:
				'<div style="font-size:9px; color: rgba(0,0,0,0.45); width: 100%; text-align: center; padding: 0 1cm;">Сделано в AI IDE BAS</div>',
			margin: { top: "1.5cm", bottom: "1.7cm", left: "1.5cm", right: "1.5cm" },
		})
	} finally {
		await browser.close()
	}
}

async function resolveChromiumExecutablePath(): Promise<string | undefined> {
	try {
		const pcrMod: any = await import("puppeteer-chromium-resolver")
		const resolverFn = pcrMod?.PuppeteerChromiumResolver ?? pcrMod?.default ?? pcrMod
		if (typeof resolverFn === "function") {
			const pcr = await resolverFn({ revision: "1263111", silent: true })
			if (pcr && typeof pcr.executablePath === "string" && (await pathExists(pcr.executablePath))) {
				return pcr.executablePath
			}
		}
	} catch (_) {
		// ignore and try fallbacks
	}

	// Fallbacks by platform (best-effort)
	if (process.platform === "darwin") {
		const candidates = [
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		]
		for (const p of candidates) {
			if (await pathExists(p)) return p
		}
	}

	// No reliable path found
	return undefined
}

async function pathExists(p: string): Promise<boolean> {
	try {
		await fs.access(p)
		return true
	} catch {
		return false
	}
}
