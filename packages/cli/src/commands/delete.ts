import inquirer from 'inquirer';
import { ApiClient } from '@notes-sync/shared';
import { ServiceDiscovery } from '../service-discovery';

export async function deleteCommand() {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  try {
    // Get all incomplete todos
    const todosResponse = await client.getIncompleteTodos(7);

    if (todosResponse.todos.length === 0) {
      console.log('📝 No incomplete todos found in the last 7 days');
      return;
    }

    // Create choices for inquirer - include the date for context
    const choices: Array<{
      name: string;
      value: string | null;
      short: string;
    }> = todosResponse.todos.map(todo => ({
      name: `${todo.todo} (${todo.date})`,
      value: todo.todo,
      short: todo.todo,
    }));

    // Add option to cancel
    choices.push({
      name: "Cancel - don't delete anything",
      value: null,
      short: 'Cancel',
    });

    // Ask user to select a todo to delete
    const { selectedTodo } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedTodo',
        message: 'Which todo would you like to delete?',
        choices,
        pageSize: 10,
      },
    ]);

    // If user cancelled, exit
    if (!selectedTodo) {
      console.log('❌ Cancelled');
      return;
    }

    // Confirm deletion
    const { confirmDelete } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to permanently delete: "${selectedTodo}"?`,
        default: true,
      },
    ]);

    if (!confirmDelete) {
      console.log('❌ Cancelled');
      return;
    }

    // Delete the todo
    const result = await client.deleteTodo({ todoText: selectedTodo });

    if (result.success) {
      console.log(`🗑️  Deleted todo: "${selectedTodo}"`);
    } else {
      console.log(`❌ Failed to delete todo: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Failed to delete todo:', (error as Error).message);
    console.log('💡 Is the service running? Try: notes-sync install');
  }
}
