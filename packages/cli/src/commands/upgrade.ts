import { spawn, spawnSync } from "child_process";

export async function upgradeCommand() {
  console.log("🔄 Upgrading Notes Sync packages...");

  try {
    // First stop the service if it's running
    console.log("⏹️ Stopping service...");
    try {
      const stopResult = spawnSync("notes-sync", ["stop"], { stdio: "inherit" });
      if (stopResult.status === 0) {
        console.log("✅ Service stopped successfully");
      } else {
        console.log("⚠️ Service may not have been running");
      }
    } catch (error) {
      console.log("⚠️ Service may not have been running");
    }

    // Wait a moment for the service to fully stop
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Upgrade shared package first
    console.log("📦 Upgrading shared package...");
    const sharedResult = spawnSync("npm", ["install", "-g", "@notes-sync/shared@latest"], {
      stdio: "inherit",
    });

    if (sharedResult.status !== 0) {
      console.error("❌ Failed to upgrade shared package");
      process.exit(1);
    }

    // Upgrade service package
    console.log("📦 Upgrading service package...");
    const serviceResult = spawnSync("npm", ["install", "-g", "@notes-sync/service@latest"], {
      stdio: "inherit",
    });

    if (serviceResult.status !== 0) {
      console.error("❌ Failed to upgrade service package");
      process.exit(1);
    }

    // Upgrade CLI package
    console.log("📦 Upgrading CLI package...");
    const cliResult = spawnSync("npm", ["install", "-g", "@notes-sync/cli@latest"], {
      stdio: "inherit",
    });

    if (cliResult.status !== 0) {
      console.error("❌ Failed to upgrade CLI package");
      process.exit(1);
    }

    console.log("✅ All packages upgraded successfully!");
    console.log("💡 Restart the service with: notes-sync install");
  } catch (error) {
    console.error("❌ Upgrade failed:", (error as Error).message);
    process.exit(1);
  }
}