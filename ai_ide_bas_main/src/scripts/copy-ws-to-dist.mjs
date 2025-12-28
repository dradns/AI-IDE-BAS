#!/usr/bin/env node
/* eslint-disable no-undef */
// Script to copy ws module to root node_modules before packaging (ws is native and can't be bundled)

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename     = fileURLToPath(import.meta.url);
const __dirname      = path.dirname(__filename);
const srcDir         = path.resolve(__dirname, "..");
const rootDir        = path.resolve(srcDir, "..");
const nodeModulesDir = path.join(srcDir, "node_modules");

// Locate ws module (pnpm workspace may have deps in root or pnpm store)
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

const wsDestDir = path.join(nodeModulesDir, "ws");

if (!wsSourceDir || !fs.existsSync(wsSourceDir)) {
    console.warn(`⚠️  ws module not found. Checked:`);
    console.warn(`   - ${path.join(rootDir, "node_modules", "ws")}`);
    console.warn(`   - pnpm store (${path.join(rootDir, "node_modules", ".pnpm", "ws@*", "node_modules", "ws")})`);
    console.warn("   Make sure to run 'pnpm install' first");
    process.exit(0);
}

// Remove old ws copy if exists
if (fs.existsSync(wsDestDir)) {
    fs.rmSync(wsDestDir, { recursive: true, force: true });
}

// Copy ws module recursively
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
            // Skip unnecessary files
            if (entry === "node_modules" || entry === ".git") {
                continue;
            }
            const srcPath  = path.join(src, entry);
            const destPath = path.join(dest, entry);
            copyRecursive(srcPath, destPath);
        }
    } else {
        // Create directory for file if needed
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
    }
};

console.log(`📋 Copying ws module from: ${wsSourceDir}`);
console.log(`📋 To: ${wsDestDir}`);

try {
    copyRecursive(wsSourceDir, wsDestDir);
    console.log("✅ ws module copied successfully");
} catch (error) {
    console.error(`❌ Error copying ws module: ${error.message}`);
    console.error(`   Source: ${wsSourceDir}`);
    console.error(`   Destination: ${wsDestDir}`);
    throw error;
}
