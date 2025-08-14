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

function install() {
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
  } else {
    console.error("❌ Failed to install service");
    process.exit(1);
  }
}

install();
