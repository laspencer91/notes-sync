import chokidar from "chokidar";
import { Logger } from "./logger";

export class FileWatcher {
  private watcher?: chokidar.FSWatcher;

  start(notesDir: string, glob: string, ignore: string[], onSync: () => void) {
    Logger.log(`Starting file watcher for: ${notesDir}`);

    this.watcher = chokidar.watch(glob, {
      cwd: notesDir,
      ignored: ignore,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 50 },
    });

    this.watcher
      .on("add", (path) => {
        Logger.log(`File added: ${path}`);
        onSync();
      })
      .on("change", (path) => {
        Logger.log(`File changed: ${path}`);
        onSync();
      })
      .on("unlink", (path) => {
        Logger.log(`File removed: ${path}`);
        onSync();
      })
      .on("error", (err) => {
        Logger.error("File watcher error:", err);
      });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      Logger.log("File watcher stopped");
    }
  }
}
