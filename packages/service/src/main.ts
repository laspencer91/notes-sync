import { createServer } from "./server";
import { FileWatcher } from "./watcher";
import { loadConfig } from "./config";
import { createGit, isGitRepo, hasOriginRemote, safeSync } from "./git";
import { Logger } from "./logger";
import { NoteInteractor } from "./note-interactor";
import { SystemEvents } from "./system-events";

async function main() {
  Logger.log("Notes Sync Service starting...");

  // Load configuration
  const config = loadConfig();
  Logger.log(`Config loaded: watching ${config.notesDir}`);

  ///////////////////////////
  // GIT INIT
  //////////////////////////
  if (!isGitRepo(config.notesDir)) {
    Logger.error(`NOTES_DIR is not a Git repo: ${config.notesDir}`);
    process.exit(1);
  }

  const git = createGit(config.notesDir);
  const hasOrigin = await hasOriginRemote(git);
  if (!hasOrigin) {
    Logger.error(
      'No "origin" remote configured. Please set it to your GitHub repo.',
    );
    process.exit(1);
  }

  ///////////////////////////
  // SYNC INIT
  //////////////////////////
  await safeSync(git, "initial");

  // Setup debounced sync
  let debounceTimer: NodeJS.Timeout | null = null;
  let pendingEvents = 0;

  const scheduleSync = (reason: string) => {
    pendingEvents += 1;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const count = pendingEvents;
      pendingEvents = 0;
      await safeSync(git, `${reason}:${count}`);
    }, config.debounceMs);
  };

  ///////////////////////////
  // INIT NOTE INTERACTOR
  //////////////////////////
  const noteInteractor = new NoteInteractor(config.notesDir, "Daily.md");

  SystemEvents.onAddNote((text) => noteInteractor.writeNewDay());

  ///////////////////////////
  // START HTTP SERVER
  //////////////////////////
  const server = createServer(config, scheduleSync);

  try {
    await server.listen({ port: config.server.port, host: config.server.host });
    Logger.log(
      `Server listening on http://${config.server.host}:${config.server.port}`,
    );
  } catch (err) {
    Logger.error("Failed to start server:", err);
    process.exit(1);
  }

  ///////////////////////////
  // START FILE WATCHER
  //////////////////////////
  const watcher = new FileWatcher();
  watcher.start(config.notesDir, config.glob, config.ignore, () => {
    scheduleSync("file-change");
  });

  ///////////////////////////
  // SHUTDOWN HANDLING
  //////////////////////////
  const shutdown = async (signal: string) => {
    Logger.log(`${signal} received, shutting down gracefully...`);
    watcher.stop();
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  Logger.error("Fatal error:", err);
  process.exit(1);
});
