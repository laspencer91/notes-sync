import { ApiClient, SearchFilters } from '@notes-sync/shared';
import { ServiceDiscovery } from '../service-discovery';

export async function searchCommand(
  query: string,
  options: {
    days?: string;
    section?: string;
    dateRange?: string;
    status?: string;
  }
) {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  try {
    const daysBack = options.days ? parseInt(options.days) : undefined;

    let dateRange: { start: string; end: string } | undefined;
    if (options.dateRange) {
      const [start, end] = options.dateRange.split(':');
      if (!start || !end) {
        console.error(
          '❌ Invalid --date-range format. Use YYYY-MM-DD:YYYY-MM-DD'
        );
        return;
      }
      dateRange = { start, end };
    }

    // Validating section and status
    const section =
      options.section && ['todos', 'notes', 'done'].includes(options.section)
        ? (options.section as 'todos' | 'notes' | 'done')
        : undefined;

    const status =
      options.status && ['complete', 'incomplete'].includes(options.status)
        ? (options.status as 'complete' | 'incomplete')
        : undefined;

    const filters: SearchFilters = {
      section,
      status,
      dateRange,
      daysBack,
    };

    const result = await client.searchNotes({ query, ...filters });

    if (result.results.length === 0) {
      console.log(`🔍 No results found for "${query}"`);
      return;
    }

    console.log(`🔍 Found ${result.results.length} results for "${query}":`);
    console.log();

    for (const item of result.results) {
      console.log(`📅 ${item.date}`);
      console.log(`   ${item.context.split('\n').join('\n   ')}`);
      console.log();
    }
  } catch (error) {
    console.error('❌ Failed to search notes:', error as Error);
    console.log('💡 Is the service running? Try: notes-sync install');
  }
}
