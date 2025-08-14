#!/usr/bin/env node
import { Command } from "commander";
import { statusCommand } from "./commands/status";
import { installCommand } from "./commands/install";
import { syncCommand } from "./commands/sync";
import { addNoteCommand } from "./commands/add-note";

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
  .command("add-note")
  .description("Add a note to file")
  .argument("<text...>", "Text to add")
  .action(addNoteCommand);

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

program.parse();
