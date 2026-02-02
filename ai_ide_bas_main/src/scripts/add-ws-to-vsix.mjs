#!/usr/bin/env node
/* eslint-disable no-undef */
// Script to add ws module to VSIX package after packaging (ws is native and can't be bundled)

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const srcDir     = path.resolve(__dirname, "..");
const rootDir    = path.resolve(srcDir, "..");

// Get version from package.json
const packageJson  = JSON.parse(fs.readFileSync(path.join(srcDir, "package.json"), "utf-8"));
const version      = packageJson.version;
const name         = packageJson.name;
const vsixFileName = `${name}-${version}.vsix`;
const vsixPath     = path.join(rootDir, "bin", vsixFileName);

if (!fs.existsSync(vsixPath)) {
    console.error(`❌ VSIX file not found: ${vsixPath}`);
    console.error("Make sure to run 'pnpm vsix' first");
    process.exit(1);
}

console.log(`📦 Adding ws module to VSIX: ${vsixFileName}`);

// Locate ws module
let wsSourceDir    = null;
const rootWsPath   = path.join(rootDir, "node_modules", "ws");

if (fs.existsSync(rootWsPath)) {
    wsSourceDir = rootWsPath;
} else {
    // Try to find via .pnpm store
    try {
        const pnpmDir = path.join(rootDir, "node_modules", ".pnpm");
        if (fs.existsSync(pnpmDir)) {
            const entries = fs.readdirSync(pnpmDir);
            for (const entry of entries) {
                if (entry.startsWith("ws@")) {
                    const candidatePath = path.join(pnpmDir, entry, "node_modules", "ws");
                    if (fs.existsSync(candidatePath)) {
                        wsSourceDir = candidatePath;
                        break;
                    }
                }
            }
        }
    } catch (e) {
        // Ignore search errors
    }
}

if (!wsSourceDir || !fs.existsSync(wsSourceDir)) {
    console.error(`❌ ws module not found`);
    console.error("   Make sure to run 'pnpm install' first");
    process.exit(1);
}

// Create temp directory for extraction
const tempDir = path.join(rootDir, ".vsix-temp");

if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

try {
    // Extract VSIX
    console.log("📂 Extracting VSIX...");
    execSync(`unzip -q "${vsixPath}" -d "${tempDir}"`, { stdio: "inherit" });

    const extensionDir   = path.join(tempDir, "extension");
    const nodeModulesDir = path.join(extensionDir, "node_modules");
    const wsDestDir      = path.join(nodeModulesDir, "ws");

    // Create node_modules in extracted package
    if (!fs.existsSync(nodeModulesDir)) {
        fs.mkdirSync(nodeModulesDir, { recursive: true });
    }

    // Copy ws module recursively
    console.log("📋 Copying ws module...");

    const copyRecursive = (src, dest) => {
        if (!fs.existsSync(src)) {
            throw new Error(`Source path does not exist: ${src}`);
        }

        const stats = fs.statSync(src);

        if (stats.isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            const entries = fs.readdirSync(src);
            for (const entry of entries) {
                if (entry === "node_modules" || entry === ".git") {
                    continue;
                }
                copyRecursive(path.join(src, entry), path.join(dest, entry));
            }
        } else {
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFileSync(src, dest);
        }
    };

    copyRecursive(wsSourceDir, wsDestDir);
    console.log("✅ ws module copied successfully");

    // Repackage VSIX: zip entire contents (keep [Content_Types].xml, extension.vsixmanifest at root).
    // -X = no extra zip fields (Open VSX rejects "extra fields"); -x = exclude macOS junk.
    console.log("📦 Repackaging VSIX...");
    const cwd = process.cwd();
    process.chdir(tempDir);
    try {
        execSync(`zip -r -X -q "${vsixPath}" . -x "*.DS_Store" -x "__MACOSX*" -x "*__MACOSX*"`, { stdio: "inherit" });
    } finally {
        process.chdir(cwd);
    }

    console.log(`✅ Successfully added ws module to ${vsixFileName}`);
} catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
} finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
