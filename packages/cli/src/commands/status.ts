import { ApiClient } from "@notes-sync/shared";
import { ServiceDiscovery } from "../service-discovery";

export async function statusCommand() {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  try {
    const status = await client.getStatus();
    console.log("📊 Service Status:");
    console.log(`  Running: ${status.running ? "✅" : "❌"}`);
    console.log(`  Watching: ${status.watching}`);
    console.log(`  Last Sync: ${status.lastSync}`);
    console.log(`  Uptime: ${Math.floor(status.uptime)}s`);
  } catch (error) {
    console.error("❌ Failed to get status:", error as Error);
  }
}
