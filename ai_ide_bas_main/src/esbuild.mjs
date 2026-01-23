import * as esbuild from "esbuild"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import process from "node:process"
import * as console from "node:console"

import { copyPaths, copyWasms, copyLocales, setupLocaleWatcher } from "@roo-code/build"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function updateExtensionBuildConfigIfNeeded() {
    const updateArg = process.argv.find(arg => arg.startsWith("--update-sec="));
    const updateValueRaw = updateArg ? updateArg.split("=")[1].trim() : null;

    let updateValue = null;

    // Update value validation
    if (updateValueRaw !== null) {
        updateValue = parseInt(updateValueRaw, 10);

        if (isNaN(updateValue)) {
        console.error(
            `[updateExtensionBuildConfigIfNeeded] Invalid --update value "${updateValueRaw}". It must be an integer.`
        );
        process.exit(1);
        }
    } 

	const configPath = path.join(__dirname, "extension-build-config.json")
	if (fs.existsSync(configPath)) {
		const configRaw = fs.readFileSync(configPath, "utf8")
		const config = JSON.parse(configRaw)

		config.featureFlags.updateSec = updateValue

		fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8")
        console.log(JSON.stringify(config, null, 2))
	} else {
		console.warn(`[${name}] extension-build-config.json not found, skipping update`)
	}
}

async function main() {
	const name = "extension"
	const production = process.argv.includes("--production")
	const watch = process.argv.includes("--watch")
	const minify = production
	const sourcemap = true // Always generate source maps for error handling

	/**
	 * @type {import('esbuild').BuildOptions}
	 */
	const buildOptions = {
		bundle: true,
		minify,
		sourcemap,
		logLevel: "silent",
		format: "cjs",
		sourcesContent: false,
		platform: "node",
	}

	const srcDir = __dirname
	const buildDir = __dirname
	const distDir = path.join(buildDir, "dist")

	if (fs.existsSync(distDir)) {
		console.log(`[${name}] Cleaning dist directory: ${distDir}`)
		fs.rmSync(distDir, { recursive: true, force: true })
	}

	/**
	 * @type {import('esbuild').Plugin[]}
	 */
	const plugins = [
		{
			name: "copyFiles",
			setup(build) {
				build.onEnd(() => {
					copyPaths(
						[
							["../README.md", "README.md"],
							["../CHANGELOG.md", "CHANGELOG.md"],
							["../LICENSE", "LICENSE"],
							["../.env", ".env", { optional: true }],
							["node_modules/vscode-material-icons/generated", "assets/vscode-material-icons"],
							["../webview-ui/audio", "webview-ui/audio"],
                            ["../extension-build-config.json", "extension-build-config.json"],
						],
						srcDir,
						buildDir,
					)
				})
			},
		},
        {
            name: 'updateBuildConfig',
            setup(build) {
                build.onEnd(() => {
                    updateExtensionBuildConfigIfNeeded()
                })
            }
        },
		{
			name: "copyWasms",
			setup(build) {
				build.onEnd(() => copyWasms(srcDir, distDir))
			},
		},
		{
			name: "copyLocales",
			setup(build) {
				build.onEnd(() => copyLocales(srcDir, distDir))
			},
		},
		{
			name: "copyPrompts",
			setup(build) {
				build.onEnd(() => {
					// Always skip copying prompts - they are loaded from API at runtime
					console.log(
						`[copyPrompts] Skipping prompts copy - will be loaded from API on first install`,
					)
					return
				})
			},
		},
		{
			name: "esbuild-problem-matcher",
			setup(build) {
				build.onStart(() => console.log("[esbuild-problem-matcher#onStart]"))
				build.onEnd((result) => {
					result.errors.forEach(({ text, location }) => {
						console.error(`✘ [ERROR] ${text}`)
						if (location && location.file) {
							console.error(`    ${location.file}:${location.line}:${location.column}:`)
						}
					})

					console.log("[esbuild-problem-matcher#onEnd]")
				})
			},
		},
	]

	/**
	 * @type {import('esbuild').BuildOptions}
	 */
	const extensionConfig = {
		...buildOptions,
		plugins,
		entryPoints: ["extension.ts"],
		outfile: "dist/extension.js",
		external: ["vscode", "ws"],
	}

	/**
	 * @type {import('esbuild').BuildOptions}
	 */
	const workerConfig = {
		...buildOptions,
		entryPoints: ["workers/countTokens.ts"],
		outdir: "dist/workers",
	}

	const [extensionCtx, workerCtx] = await Promise.all([
		esbuild.context(extensionConfig),
		esbuild.context(workerConfig),
	])

	if (watch) {
		await Promise.all([extensionCtx.watch(), workerCtx.watch()])
		copyLocales(srcDir, distDir)
		setupLocaleWatcher(srcDir, distDir)
	} else {
		await Promise.all([extensionCtx.rebuild(), workerCtx.rebuild()])
		await Promise.all([extensionCtx.dispose(), workerCtx.dispose()])
	}
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
