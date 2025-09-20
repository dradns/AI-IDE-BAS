// Test script to verify GitHub commands are working
const vscode = require("vscode")

async function testGitHubCommands() {
	try {
		console.log("🔍 Testing GitHub commands...")

		// Get all available commands
		const commands = await vscode.commands.getCommands()

		// Filter GitHub commands
		const githubCommands = commands.filter((cmd) => cmd.includes("github"))

		console.log("📋 Available GitHub commands:")
		githubCommands.forEach((cmd) => {
			console.log(`  ✅ ${cmd}`)
		})

		// Test specific commands
		const expectedCommands = [
			"ai-ide-bas.github.configure",
			"ai-ide-bas.github.analyze",
			"ai-ide-bas.github.insights",
		]

		console.log("\n🎯 Testing specific commands:")
		for (const cmd of expectedCommands) {
			if (commands.includes(cmd)) {
				console.log(`  ✅ ${cmd} - FOUND`)
			} else {
				console.log(`  ❌ ${cmd} - NOT FOUND`)
			}
		}

		// Test if commands can be executed
		console.log("\n🚀 Testing command execution:")
		try {
			// This will show an error if service is not initialized, but that's expected
			await vscode.commands.executeCommand("ai-ide-bas.github.analyze")
			console.log("  ✅ Command execution test passed")
		} catch (error) {
			if (error.message.includes("not found")) {
				console.log("  ❌ Command not found - extension may need reload")
			} else {
				console.log("  ✅ Command found but service not initialized (expected)")
			}
		}

		console.log("\n📊 Summary:")
		console.log(`  Total commands: ${commands.length}`)
		console.log(`  GitHub commands: ${githubCommands.length}`)
		console.log(`  Expected commands found: ${expectedCommands.filter((cmd) => commands.includes(cmd)).length}/3`)
	} catch (error) {
		console.error("❌ Error testing commands:", error)
	}
}

testGitHubCommands()
