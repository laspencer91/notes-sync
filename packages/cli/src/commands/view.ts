import { ServiceDiscovery } from '../service-discovery';

export async function viewCommand(options: {
  today?: boolean;
  recent?: boolean;
  all?: boolean;
  days?: string;
}) {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  try {
    let requestType: 'today' | 'recent' | 'all';

    if (options.today) {
      requestType = 'today';
    } else if (options.recent) {
      requestType = 'recent';
    } else if (options.all) {
      requestType = 'all';
    } else {
      // Default to today if no option specified
      requestType = 'today';
    }

    const days = options.days ? parseInt(options.days) : undefined;

    const result = await client.viewNotes({
      type: requestType,
      days,
    });

    // Display the content
    console.log(result.content);

    // Show metadata
    console.log();
    console.log(
      `📊 ${result.metadata.type.toUpperCase()}: ${result.metadata.totalLines} lines`
    );
    if (result.metadata.daysCovered) {
      console.log(`📅 Days covered: ${result.metadata.daysCovered}`);
    }
    if (result.metadata.dateRange) {
      console.log(
        `📅 Date range: ${result.metadata.dateRange.start} to ${result.metadata.dateRange.end}`
      );
    }
  } catch (error) {
    console.error('❌ Failed to view notes:', (error as Error).message);
    console.log('💡 Is the service running? Try: notes-sync status');
  }
}
