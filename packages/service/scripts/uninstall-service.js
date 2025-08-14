#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const AGENT_LABEL = "com.notesync.service";

function uninstall() {
  const plistPath = path.join(
    os.homedir(),
    "Library",
    "LaunchAgents",
    `${AGENT_LABEL}.plist`,
  );
  const configDir = path.join(os.homedir(), ".config", "notes-sync");

  if (fs.existsSync(plistPath)) {
    const result = spawnSync("launchctl", ["unload", "-w", plistPath], {
      stdio: "inherit",
    });

    if (result.status === 0) {
      fs.unlinkSync(plistPath);
      console.log("✅ Service uninstalled successfully");
      
      // Ask if user wants to remove config
      if (fs.existsSync(configDir)) {
        console.log(`📁 Config directory still exists: ${configDir}`);
        console.log("💡 To remove config files, run: rm -rf ~/.config/notes-sync");
      }
    } else {
      console.error("❌ Failed to uninstall service");
      process.exit(1);
    }
  } else {
    console.log("ℹ️  Service not found, nothing to uninstall");
  }
}

uninstall();
