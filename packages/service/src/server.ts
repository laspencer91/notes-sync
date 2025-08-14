import fastify from "fastify";
import { ServiceStatus, SyncRequest, LogsResponse } from "@notes-sync/shared";
import { ServiceConfig } from "./config";
import { Logger } from "./logger";
import { SystemEvents } from "./system-events";

export function createServer(
  config: ServiceConfig,
  scheduleSync: (reason: string) => void,
) {
  const server = fastify({ logger: true });
  let lastSyncTime = new Date().toISOString();

  let onAddNote: Array<() => Promise<string>> = [];

  // GET /status - Service status
  server.get<{ Reply: ServiceStatus }>("/status", async (request, reply) => {
    return {
      running: true,
      watching: config.notesDir,
      lastSync: lastSyncTime,
      uptime: process.uptime(),
    };
  });

  // POST /sync - Trigger sync
  server.post<{ Body: SyncRequest }>("/sync", async (request, reply) => {
    Logger.log("Manual sync requested:", request.body);
    const reason = request.body?.force ? "manual-force" : "manual";
    scheduleSync(reason);
    lastSyncTime = new Date().toISOString();
    return { success: true };
  });

  // GET /logs - Get service logs
  server.get<{ Reply: LogsResponse }>("/logs", async (request, reply) => {
    // TODO: Implement actual log reading from files
    return {
      logs: [
        "Service started",
        `File watcher initialized for ${config.notesDir}`,
        `Watching ${config.glob} pattern`,
        `Last sync: ${lastSyncTime}`,
      ],
      total: 4,
    };
  });

  server.post<{ Body: { text: string } }>(
    "/add-note",
    async (request, reply) => {
      Logger.log("Add note requested via API");
      SystemEvents.emitAddNote(request.body.text);
      return { message: "Added note" };
    },
  );

  // POST /shutdown - Graceful shutdown
  server.post("/shutdown", async (request, reply) => {
    Logger.log("Shutdown requested via API");
    setTimeout(() => process.exit(0), 1000);
    return { message: "Shutting down..." };
  });

  return server;
}
