import { ApiClient } from "@notes-sync/shared";
import { ServiceDiscovery } from "../service-discovery";

export async function addCommand(
  text: string[],
  options: { note?: boolean; todo?: boolean },
) {
  const serviceDiscovery = new ServiceDiscovery();
  const client = await serviceDiscovery.ensureService();

  const content = text.join(" ");

  if (!content.trim()) {
    console.error("❌ Error: Please provide text to add");
    console.log("   Examples:");
    console.log('   notes-sync add -n "This is a note"');
    console.log('   notes-sync add -t "This is a todo item"');
    return;
  }

  // Check that exactly one option is specified
  if (options.note && options.todo) {
    console.error(
      "❌ Error: Cannot specify both -n (note) and -t (todo) at the same time",
    );
    return;
  }

  if (!options.note && !options.todo) {
    console.error("❌ Error: Must specify either -n (note) or -t (todo)");
    console.log("   Examples:");
    console.log('   notes-sync add -n "This is a note"');
    console.log('   notes-sync add -t "This is a todo item"');
    return;
  }

  try {
    if (options.note) {
      // Add as note
      await client.addNote({ text: content });
      console.log(`📝 Added note: "${content}"`);
    } else if (options.todo) {
      // Add as todo
      await client.addTodo({ text: content });
      console.log(`✅ Added todo: "${content}"`);
    }
  } catch (error) {
    const action = options.note ? "add note" : "add todo";
    console.error(`❌ Failed to ${action}:`, (error as Error).message);
    console.log("💡 Is the service running? Try: notes-sync install");
  }
}
