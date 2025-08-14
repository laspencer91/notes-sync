import { ApiClient } from "@notes-sync/shared";

export async function dailyCommand(
  options: { status?: boolean; create?: boolean; force?: boolean },
  command?: any,
) {
  const client = new ApiClient("http://localhost:3000");

  // Debug info to see what Commander.js is actually passing
  console.log("=== DEBUG INFO ===");
  console.log("Arguments length:", arguments.length);
  console.log("options received:", JSON.stringify(options, null, 2));
  console.log("command object present:", !!command);
  if (command) {
    console.log("command.args:", command.args);
    console.log("command.opts():", JSON.stringify(command.opts(), null, 2));
  }
  console.log("===================");

  try {
    if (options.status) {
      // Show daily status
      const status = await client.getDailyStatus();

      console.log("📅 Daily Section Status:");
      console.log(`  Today exists: ${status.hasToday ? "✅" : "❌"}`);

      if (status.missingDays.length > 0) {
        console.log(`  Missing days: ${status.missingDays.join(", ")}`);
      } else {
        console.log("  Missing days: None");
      }

      if (status.timeSinceLastEntry === Infinity) {
        console.log("  Last entry: No entries found");
      } else {
        const hoursAgo = Math.floor(
          status.timeSinceLastEntry / (1000 * 60 * 60),
        );
        const daysAgo = Math.floor(hoursAgo / 24);

        if (daysAgo > 0) {
          console.log(
            `  Last entry: ${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`,
          );
        } else if (hoursAgo > 0) {
          console.log(
            `  Last entry: ${hoursAgo} hour${hoursAgo > 1 ? "s" : ""} ago`,
          );
        } else {
          console.log("  Last entry: Less than an hour ago");
        }
      }
    } else if (options.create) {
      // Create daily section
      const result = await client.createDaily({ force: options.force });

      if (result.created) {
        console.log(`✅ ${result.reason}`);
      } else {
        console.log(`📅 ${result.reason}`);
      }
    } else {
      // Default: show status if no options provided
      console.log(
        "📅 Use --status to check daily status or --create to create today's section",
      );
      console.log("   Examples:");
      console.log("   notes-sync daily --status");
      console.log("   notes-sync daily --create");
      console.log("   notes-sync daily --create --force");
    }
  } catch (error) {
    console.error("❌ Failed to manage daily sections:", error as Error);
    console.log("💡 Is the service running? Try: notes-sync install");
  }
}
