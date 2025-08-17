import inquirer from 'inquirer';
import { ServiceDiscovery } from '../service-discovery';

export async function markCompleteCommand() {
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
      name: "Cancel - don't mark anything complete",
      value: null,
      short: 'Cancel',
    });

    // Ask user to select a todo to mark complete
    const { selectedTodo } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedTodo',
        message: 'Which todo would you like to mark as complete?',
        choices,
        pageSize: 10,
      },
    ]);

    // If user cancelled, exit
    if (!selectedTodo) {
      console.log('❌ Cancelled');
      return;
    }

    // Mark the todo complete
    const result = await client.markTodoComplete({ todoText: selectedTodo });

    if (result.success) {
      console.log(`✅ Marked todo complete: "${selectedTodo}"`);
    } else {
      console.log(`❌ Failed to mark todo complete - todo not found`);
    }
  } catch (error) {
    console.error('❌ Failed to mark todo complete:', (error as Error).message);
    console.log('💡 Is the service running? Try: notes-sync install');
  }
}
