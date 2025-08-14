import fs from "fs";
import path from "path";
import { AIConfig } from "@notes-sync/shared";

export interface ServiceConfig {
  notesDir: string;
  debounceMs: number;
  glob: string;
  ignore: string[];
  autoCreateDaily?: boolean;
  wakeDetection?: {
    enabled: boolean;
    intervalMs: number;
    thresholdMs: number;
  };
  ai?: AIConfig;
  server: {
    port: number;
    host: string;
  };
}

export function loadConfig(): ServiceConfig {
  const configPath = path.resolve(__dirname, "..", "config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const cfg = JSON.parse(raw);

  if (!cfg.notesDir || typeof cfg.notesDir !== "string") {
    throw new Error("config.notesDir is required");
  }
  if (!fs.existsSync(cfg.notesDir)) {
    throw new Error(`config.notesDir does not exist: ${cfg.notesDir}`);
  }
  if (typeof cfg.debounceMs !== "number") {
    throw new Error("config.debounceMs must be a number");
  }
  if (!cfg.glob || typeof cfg.glob !== "string") {
    throw new Error("config.glob is required");
  }
  if (!Array.isArray(cfg.ignore)) {
    throw new Error("config.ignore must be an array of glob patterns");
  }

  // Set defaults for server config if not provided
  const server = cfg.server || {};

  // Set defaults for AI config if not provided
  const ai = cfg.ai || {};
  const defaultAIConfig: AIConfig = {
    enabled: false,
    provider: "gemini",
    apiKey: ai.apiKey || process.env.GEMINI_API_KEY,
    model: ai.model || "gemini-1.5-flash",
    features: {
      dailyQuotes: {
        maxLength: ai.features?.dailyQuotes?.maxLength || 15,
        focus: ai.features?.dailyQuotes?.focus || [
          "productivity",
          "personal growth",
        ],
        adjectives: ai.features?.dailyQuotes?.adjectives || [
          "actionable",
          "motivational",
        ],
        additionalRules: ai.features?.dailyQuotes?.additionalRules || [
          "If quoting from spiritual texts, include the book name as author",
          "Prefer wisdom that applies to daily work and life",
        ],
      },
    },
    rateLimiting: {
      requestsPerMinute: ai.rateLimiting?.requestsPerMinute || 10,
      requestsPerDay: ai.rateLimiting?.requestsPerDay || 100,
    },
  };

  // Enable AI if API key is available
  if (defaultAIConfig.apiKey) {
    defaultAIConfig.enabled = ai.enabled !== false; // Default to true if API key exists
  }

  return {
    ...cfg,
    server: {
      port: server.port || 3000,
      host: server.host || "127.0.0.1",
    },
    ai: defaultAIConfig,
  } as ServiceConfig;
}
