import { spawn } from "child_process";
import path from "path";

export async function installCommand() {
  console.log("🔧 Installing Notes Sync Service...");

  // Path to service install script
  const serviceDir = path.resolve(__dirname, "..", "..", "..", "service");
  const installScript = path.join(serviceDir, "scripts", "install-service.js");

  const child = spawn("node", [installScript], { stdio: "inherit" });

  child.on("close", (code) => {
    if (code === 0) {
      console.log("✅ Service installed successfully!");
      console.log('💡 Use "notes-sync status" to check if it\'s running');
    } else {
      console.error("❌ Installation failed");
      process.exit(1);
    }
  });
}
