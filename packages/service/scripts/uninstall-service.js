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

  if (fs.existsSync(plistPath)) {
    const result = spawnSync("launchctl", ["unload", "-w", plistPath], {
      stdio: "inherit",
    });

    if (result.status === 0) {
      fs.unlinkSync(plistPath);
      console.log("✅ Service uninstalled successfully");
    } else {
      console.error("❌ Failed to uninstall service");
      process.exit(1);
    }
  } else {
    console.log("ℹ️  Service not found, nothing to uninstall");
  }
}

uninstall();
