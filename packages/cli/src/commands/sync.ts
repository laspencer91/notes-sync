import { ApiClient } from '@notes-sync/shared';
import { ServiceDiscovery } from '../service-discovery';

export async function syncCommand(options: { force?: boolean }) {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  try {
    console.log('🔄 Triggering sync...');
    await client.sync({ force: options.force });
    console.log('✅ Sync completed');
  } catch (error) {
    console.error('❌ Sync failed:', (error as Error).message);
  }
}
