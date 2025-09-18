// Load environment variables from .env file
require("dotenv").config()

const { PostHog } = require("posthog-node")
const fs = require("fs")
const path = require("path")

async function sendVSIXBuildEvent() {
	try {
		// Check if PostHog API key is available
		const posthogApiKey = process.env.POSTHOG_API_KEY
		if (!posthogApiKey) {
			console.log("⚠️  POSTHOG_API_KEY not found, skipping telemetry event")
			return
		}

		// Initialize PostHog client
		const client = new PostHog(posthogApiKey, { host: "https://us.i.posthog.com" })

		// Read package.json to get version info
		const packageJsonPath = path.join(__dirname, "../src/package.json")
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

		// Check if VSIX file was created
		const vsixFileName = `${packageJson.name}-${packageJson.version}.vsix`
		const vsixPath = path.join(__dirname, "../bin", vsixFileName)

		if (!fs.existsSync(vsixPath)) {
			console.log("⚠️  VSIX file not found, skipping telemetry event")
			return
		}

		// Get file stats for additional properties
		const stats = fs.statSync(vsixPath)
		const fileSize = stats.size

		// Send the event
		await client.capture({
			distinctId: "build-system", // Use a consistent ID for build events
			event: "VSIX Build Completed",
			properties: {
				extensionName: packageJson.name,
				extensionVersion: packageJson.version,
				publisher: packageJson.publisher,
				vsixFileName: vsixFileName,
				vsixFileSize: fileSize,
				buildTimestamp: new Date().toISOString(),
				buildEnvironment: process.env.NODE_ENV || "development",
				platform: process.platform,
				nodeVersion: process.version,
			},
		})

		console.log("✅ VSIX build event sent to PostHog")

		// Shutdown the client
		await client.shutdown()
	} catch (error) {
		console.error("❌ Failed to send VSIX build event to PostHog:", error.message)
		// Don't exit with error code to avoid breaking the build process
	}
}

// Run the function
sendVSIXBuildEvent()
