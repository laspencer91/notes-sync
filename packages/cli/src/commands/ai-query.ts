import { ApiClient, AIQueryRequest } from "@notes-sync/shared";
import inquirer from "inquirer";

export async function aiQueryCommand(
  queryWords: string[],
  options: {
    days?: number;
    today?: boolean;
    week?: boolean;
    month?: boolean;
    focus?: boolean;
    review?: boolean;
    next?: boolean;
  },
) {
  const client = new ApiClient("http://localhost:3000");

  // Determine query text
  let query = queryWords.join(" ");

  // Handle shortcut analysis types
  if (options.focus) query = query || "What should I focus on next?";
  if (options.review)
    query = query || "Summarize my recent progress and accomplishments";
  if (options.next)
    query = query || "Based on my notes, what should I work on next?";

  // If no query provided, prompt user
  if (!query) {
    const { userQuery } = await inquirer.prompt([
      {
        type: "input",
        name: "userQuery",
        message: "What would you like to know about your notes?",
        default: "What should I focus on next?",
      },
    ]);
    query = userQuery;
  }

  // Determine time range
  let timeRange: AIQueryRequest["timeRange"] = { type: "today" };
  if (options.days) timeRange = { days: options.days, type: "custom" };
  if (options.week) timeRange = { type: "week" };
  if (options.month) timeRange = { type: "month" };

  // Determine analysis type
  let analysisType: AIQueryRequest["analysisType"] = "general";
  if (options.focus) analysisType = "focus";
  if (options.review) analysisType = "review";
  if (options.next) analysisType = "next";

  try {
    console.log("🤔 Analyzing your notes...");

    const response = await client.aiQuery({
      query,
      timeRange,
      analysisType,
    });

    console.log("\n🧠 AI Insights:");
    console.log("─".repeat(50));
    console.log(response.response);

    if (response.suggestions?.length) {
      console.log("\n💡 Suggestions:");
      response.suggestions.forEach((suggestion, i) => {
        console.log(`  ${i + 1}. ${suggestion}`);
      });
    }

    console.log(
      `\n📊 Analysis based on ${response.contextUsed.daysCovered} days (${response.contextUsed.charactersUsed} characters${response.contextUsed.truncated ? ", truncated" : ""})`,
    );

    if (response.contextUsed.truncated) {
      console.log(
        "💡 Tip: Use fewer days (-d 2) for full detail, or more days for broader patterns",
      );
    }
  } catch (error) {
    console.error("❌ Failed to process AI query:", (error as Error).message);
    console.log("💡 Is the service running? Try: notes-sync install");
  }
}
