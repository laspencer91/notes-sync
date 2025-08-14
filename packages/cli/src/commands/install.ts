import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { ServiceDiscovery } from "../service-discovery";

export async function installCommand() {
  console.log("🔧 Installing Notes Sync Service...");

  try {
    const serviceDiscovery = new ServiceDiscovery();
    const serviceInfo = await serviceDiscovery.discoverService();

    if (!serviceInfo.isInstalled) {
      console.log("📦 Service not installed. Installing it now...");

      // Install the service globally
      const { spawnSync } = require("child_process");
      const installResult = spawnSync(
        "npm",
        ["install", "-g", "@notes-sync/service"],
        {
          stdio: "inherit",
        },
      );

      if (installResult.status !== 0) {
        console.error("❌ Failed to install service");
        console.log(
          "💡 Try running manually: npm install -g @notes-sync/service",
        );
        process.exit(1);
      }

      console.log("✅ Service installed successfully!");
    }

    // Now run the service's install script
    let child;

    // Check if notes-sync-service is available globally
    const { spawnSync } = require("child_process");
    const globalCheck = spawnSync("which", ["notes-sync-service"], {
      stdio: "pipe",
    });

    if (globalCheck.status === 0) {
      // Global command exists
      child = spawn("notes-sync-service", ["install"], { stdio: "inherit" });
    } else {
      // Try to find the service in node_modules
      const servicePath = path.join(
        process.cwd(),
        "node_modules",
        ".bin",
        "notes-sync-service",
      );
      if (fs.existsSync(servicePath)) {
        child = spawn(servicePath, ["install"], { stdio: "inherit" });
      } else {
        console.log("📦 Service not found. Please install it first:");
        console.log("npm install -g @notes-sync/service");
        return;
      }
    }

    child.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Service installed successfully!");
        console.log('💡 Use "notes-sync status" to check if it\'s running');
      } else {
        console.error("❌ Installation failed");
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Failed to install service:", error);
    process.exit(1);
  }
}
