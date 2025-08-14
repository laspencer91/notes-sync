#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const AGENT_LABEL = "com.notesync.service";

function createPlist() {
  const nodeBin = process.execPath;
  const serviceMain = path.resolve(__dirname, "..", "dist", "main.js");
  const logsDir = path.resolve(__dirname, "..", "logs");

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodeBin}</string>
    <string>${serviceMain}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${path.join(logsDir, "out.log")}</string>
  <key>StandardErrorPath</key>
  <string>${path.join(logsDir, "err.log")}</string>
</dict>
</plist>`;
}

function setupConfig() {
  const configDir = path.join(os.homedir(), ".config", "notes-sync");
  const configPath = path.join(configDir, "config.json");
  const exampleConfigPath = path.resolve(__dirname, "..", "config.example.json");

  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`📁 Created config directory: ${configDir}`);
  }

  // Copy example config if config doesn't exist
  if (!fs.existsSync(configPath) && fs.existsSync(exampleConfigPath)) {
    fs.copyFileSync(exampleConfigPath, configPath);
    console.log(`📄 Created config file from example: ${configPath}`);
    console.log(`⚠️  Please edit ${configPath} with your settings before starting the service`);
  } else if (fs.existsSync(configPath)) {
    console.log(`📄 Config file already exists: ${configPath}`);
  } else {
    console.log(`⚠️  No example config found. Please create ${configPath} manually`);
  }
}

function install() {
  // Setup config first
  setupConfig();

  const plistPath = path.join(
    os.homedir(),
    "Library",
    "LaunchAgents",
    `${AGENT_LABEL}.plist`,
  );
  const plistContent = createPlist();

  fs.writeFileSync(plistPath, plistContent);

  const result = spawnSync("launchctl", ["load", "-w", plistPath], {
    stdio: "inherit",
  });

  if (result.status === 0) {
    console.log(`✅ Service installed: ${plistPath}`);
    console.log(`💡 Edit your config at: ${path.join(os.homedir(), ".config", "notes-sync", "config.json")}`);
  } else {
    console.error("❌ Failed to install service");
    process.exit(1);
  }
}

install();
