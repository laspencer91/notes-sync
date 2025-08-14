import { ApiClient } from "@notes-sync/shared";
import { ServiceDiscovery } from "../service-discovery";

export async function searchCommand(query: string, options: { days?: string }) {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  try {
    const daysBack = options.days ? parseInt(options.days) : undefined;
    const result = await client.searchNotes({ query, daysBack });

    if (result.results.length === 0) {
      console.log(`🔍 No results found for "${query}"`);
      return;
    }

    console.log(`🔍 Found ${result.results.length} results for "${query}":`);
    console.log();

    for (const item of result.results) {
      console.log(`📅 ${item.date}`);
      console.log(`   ${item.context.split("\n").join("\n   ")}`);
      console.log();
    }
  } catch (error) {
    console.error("❌ Failed to search notes:", error as Error);
    console.log("💡 Is the service running? Try: notes-sync install");
  }
}
