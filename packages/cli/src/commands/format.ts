import { ApiClient } from "@notes-sync/shared";

export async function formatCommand(options: {
  section?: string;
  validate?: boolean;
}) {
  const client = new ApiClient("http://localhost:3000");

  try {
    if (options.validate) {
      // Validate formatting without making changes
      const result = await client.validateFormatting();

      if (result.isValid) {
        console.log("✅ Document formatting is already perfect!");
      } else {
        console.log("⚠️  Found formatting issues:");
        for (const issue of result.issues) {
          console.log(`   • ${issue}`);
        }
        console.log(
          "\n💡 Run 'notes-sync format' to fix these issues automatically",
        );
      }
    } else if (options.section) {
      // Format specific section
      const result = await client.formatSection({
        sectionName: options.section,
      });

      if (result.success) {
        console.log(`✅ Successfully formatted ${options.section} section`);
      } else {
        console.log(`❌ Failed to format ${options.section} section`);
      }
    } else {
      // Format entire document
      const result = await client.formatDocument();

      if (result.formatted) {
        console.log(`✅ Document formatted successfully!`);
        console.log(`📋 Changes made:`);
        for (const change of result.changesMade) {
          console.log(`   • ${change}`);
        }
      } else {
        console.log("📄 Document was already properly formatted");
      }
    }
  } catch (error) {
    console.error("❌ Failed to format:", error as Error);
    console.log("💡 Is the service running? Try: notes-sync install");
  }
}
