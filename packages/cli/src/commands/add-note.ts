import { ApiClient } from "@notes-sync/shared";

export async function addNoteCommand(text: string[]) {
  const client = new ApiClient("http://localhost:3000");

  try {
    const status = await client.addNote({ text: "\n" + text.join(" ") });
    console.log("📊 Note Added");
  } catch (error) {
    console.error("❌ Failed to add note:", error as Error);
    console.log("💡 Is the service running? Try: notes-sync install");
  }
}
