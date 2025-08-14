import { ServiceDiscovery } from "../service-discovery";

export async function archiveCommand() {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  try {
    const result = await client.archiveCompletedTodos();

    if (result.archivedCount === 0) {
      console.log("📋 No completed todos to archive");
    } else {
      console.log(
        `✅ Archived ${result.archivedCount} completed todo${result.archivedCount > 1 ? "s" : ""}`,
      );
    }
  } catch (error) {
    console.error("❌ Failed to archive todos:", error as Error);
    console.log("💡 Is the service running? Try: notes-sync install");
  }
}
