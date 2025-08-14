import { ApiClient } from "@notes-sync/shared";

export async function syncCommand(options: { force?: boolean }) {
  const client = new ApiClient();

  try {
    console.log("🔄 Triggering sync...");
    await client.sync({ force: options.force });
    console.log("✅ Sync completed");
  } catch (error) {
    console.error("❌ Sync failed:", (error as Error).message);
  }
}
