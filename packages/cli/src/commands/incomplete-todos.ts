import { ServiceDiscovery } from '../service-discovery';

export async function incompleteTodosCommand(options: { days?: string }) {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  try {
    const daysBack = options.days ? parseInt(options.days) : undefined;
    const result = await client.getIncompleteTodos(daysBack);

    if (result.todos.length === 0) {
      console.log('✅ No incomplete todos found');
      return;
    }

    console.log(`📋 Found ${result.todos.length} incomplete todos:`);
    console.log();

    let currentDate = '';
    for (const item of result.todos) {
      if (item.date !== currentDate) {
        currentDate = item.date;
        console.log(`📅 ${item.date}`);
      }
      console.log(`   - [ ] ${item.todo}`);
    }
  } catch (error) {
    console.error('❌ Failed to get incomplete todos:', error as Error);
    console.log('💡 Is the service running? Try: notes-sync install');
  }
}
