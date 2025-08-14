#!/usr/bin/env node
import { Command } from "commander";
import { statusCommand } from "./commands/status";
import { installCommand } from "./commands/install";
import { syncCommand } from "./commands/sync";
import { addCommand } from "./commands/add";
import { markCompleteCommand } from "./commands/mark-complete";
import { deleteCommand } from "./commands/delete";
import { searchCommand } from "./commands/search";
import { incompleteTodosCommand } from "./commands/incomplete-todos";
import { archiveCommand } from "./commands/archive";
import { formatCommand } from "./commands/format";
import { dailyCommand } from "./commands/daily";
import { aiQueryCommand } from "./commands/ai-query";

const program = new Command();

program
  .name("notes-sync")
  .description("CLI for Notes Sync Service")
  .version("0.1.0");

program
  .command("status")
  .description("Show service status")
  .action(statusCommand);

program
  .command("install")
  .description("Install service as system daemon")
  .action(installCommand);

program
  .command("add")
  .description("Add content to your notes")
  .option("-n, --note", "Add as a note")
  .option("-t, --todo", "Add as a todo item")
  .argument("<text...>", "Text content to add")
  .action(addCommand);

program
  .command("sync")
  .description("Trigger manual sync")
  .option("-f, --force", "force sync even if no changes")
  .action(syncCommand);

program
  .command("logs")
  .description("Show service logs")
  .action(() => {
    console.log("📋 Logs command - TODO: Implement");
  });

program
  .command("complete")
  .description("Mark a todo as completed (interactive)")
  .action(markCompleteCommand);

program
  .command("delete")
  .description("Delete a todo (interactive)")
  .action(deleteCommand);

program
  .command("search")
  .description("Search through notes")
  .argument("<query>", "Search query")
  .option("-d, --days <number>", "Number of days to search back (default: 30)")
  .action(searchCommand);

program
  .command("incomplete-todos")
  .description("Show incomplete todos")
  .option("-d, --days <number>", "Number of days to look back (default: 7)")
  .action(incompleteTodosCommand);

program
  .command("archive")
  .description("Archive completed todos to Done section")
  .action(archiveCommand);

program
  .command("format")
  .description("Format and clean up the notes document")
  .option("-s, --section <section>", "Format specific section (todos, notes)")
  .option("-v, --validate", "Validate formatting without making changes")
  .action(formatCommand);

program
  .command("daily")
  .description("Manage daily sections")
  .option("--status", "Show daily section status")
  .option("-c, --create", "Create today's daily section")
  .option("-f, --force", "Force create even if exists")
  .action(dailyCommand);

program
  .command("ai")
  .description("AI-powered analysis and insights")
  .addCommand(
    new Command("query")
      .description("Ask AI questions about your notes")
      .argument("[query...]", "Question to ask about your notes")
      .option("-d, --days <number>", "Number of days to analyze", parseInt)
      .option("--today", "Analyze only today")
      .option("--week", "Analyze past week")
      .option("--month", "Analyze past month")
      .option("--focus", "What should I focus on?")
      .option("--review", "Review my progress")
      .option("--next", "What should I do next?")
      .action(aiQueryCommand),
  );

program.parse();
