import { ApiClient } from "@notes-sync/shared";

export async function statusCommand() {
  const client = new ApiClient("http://localhost:3000");

  try {
    const status = await client.getStatus();
    console.log("📊 Service Status:");
    console.log(`  Running: ${status.running ? "✅" : "❌"}`);
    console.log(`  Watching: ${status.watching}`);
    console.log(`  Last Sync: ${status.lastSync}`);
    console.log(`  Uptime: ${Math.floor(status.uptime)}s`);
  } catch (error) {
    console.error("❌ Failed to get status:", error as Error);
    console.log("💡 Is the service running? Try: notes-sync install");
  }
}
