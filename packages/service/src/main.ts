#!/usr/bin/env node
import { createServer } from './server';
import { FileWatcher } from './watcher';
import { loadConfig } from './config';
import { createGit, isGitRepo, hasOriginRemote, safeSync } from './git';
import { Logger } from './logger';
import { NoteInteractor } from './note-interactor';
import { AIService } from './ai/ai-service';
import { WakeDetector } from './wake-detect';
import path from 'path';

// Handle install/uninstall commands
if (process.argv.includes('install')) {
  require(path.join(__dirname, '..', 'scripts', 'install-service.js'));
  // The install script will handle its own exit
} else if (process.argv.includes('uninstall')) {
  require(path.join(__dirname, '..', 'scripts', 'uninstall-service.js'));
  // The uninstall script will handle its own exit
} else {
  // Only run the main service if not installing/uninstalling
  main().catch(error => {
    Logger.error(`Service failed: ${(error as Error).message}`);
    process.exit(1);
  });
}

export async function main() {
  Logger.log('Notes Sync Service starting...');

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
      'No "origin" remote configured. Please set it to your GitHub repo.'
    );
    process.exit(1);
  }

  ///////////////////////////
  // SYNC INIT
  //////////////////////////
  await safeSync(git, 'initial');

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
  // INIT AI SERVICE
  //////////////////////////
  let aiService: AIService | undefined;
  if (config.ai) {
    try {
      aiService = new AIService(config.ai);
      if (aiService.isEnabled()) {
        Logger.log(
          `AI Service initialized with ${config.ai.provider} provider`
        );
      } else {
        Logger.log('AI Service initialized but disabled (no API key)');
      }
    } catch (error) {
      Logger.error(
        `Failed to initialize AI service: ${(error as Error).message}`
      );
    }
  }

  ///////////////////////////
  // INIT NOTE INTERACTOR
  //////////////////////////
  const noteInteractor = new NoteInteractor(
    config.notesDir,
    config.notesFile || 'Daily.md',
    aiService
  );

  // Auto-create today's section on startup (if enabled)
  if (config.autoCreateDaily !== false) {
    // Default to true
    Logger.log('Checking for missing daily sections...');
    const result = await noteInteractor.autoCreateDailySection();
    if (result.created) {
      Logger.log(`Daily section auto-created: ${result.reason}`);
      scheduleSync('auto-daily-startup');
    } else {
      Logger.log(`Daily section check: ${result.reason}`);
    }
  }

  ///////////////////////////
  // SETUP WAKE DETECTION
  //////////////////////////
  if (config.wakeDetection?.enabled !== false) {
    // Default to true
    const wakeConfig = config.wakeDetection || {
      enabled: true,
      intervalMs: 20000,
      thresholdMs: 20000,
    };
    const intervalMs = wakeConfig.intervalMs || 20000;
    const thresholdMs = wakeConfig.thresholdMs || 20000;

    Logger.log(
      `Starting wake detection (interval: ${intervalMs}ms, threshold: ${thresholdMs}ms)`
    );

    WakeDetector.onWake(async () => {
      Logger.log('Wake detected! Checking for new daily section...');

      // Auto-create daily section on wake
      const result = await noteInteractor.autoCreateDailySection();
      if (result.created) {
        Logger.log(`Daily section created on wake: ${result.reason}`);
        scheduleSync('auto-daily-wake');
      } else {
        Logger.log(`No daily section needed: ${result.reason}`);
      }
    });

    WakeDetector.start(intervalMs);
  }

  ///////////////////////////
  // START HTTP SERVER
  //////////////////////////
  const server = createServer(config, scheduleSync, noteInteractor);

  try {
    await server.listen({ port: config.server.port, host: config.server.host });
    Logger.log(
      `Server listening on http://${config.server.host}:${config.server.port}`
    );
  } catch (err) {
    Logger.error('Failed to start server:', err);
    process.exit(1);
  }

  ///////////////////////////
  // START FILE WATCHER
  //////////////////////////
  const watcher = new FileWatcher();
  watcher.start(config.notesDir, config.glob, config.ignore, () => {
    scheduleSync('file-change');
  });

  ///////////////////////////
  // SHUTDOWN HANDLING
  //////////////////////////
  const shutdown = async (signal: string) => {
    Logger.log(`${signal} received, shutting down gracefully...`);
    watcher.stop();
    WakeDetector.stop();
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
