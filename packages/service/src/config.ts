import fs from 'fs';
import path from 'path';

export interface ServiceConfig {
  notesDir: string;
  debounceMs: number;
  glob: string;
  ignore: string[];
  server: {
    port: number;
    host: string;
  };
}

export function loadConfig(): ServiceConfig {
  const configPath = path.resolve(__dirname, '..', 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  const cfg = JSON.parse(raw);

  if (!cfg.notesDir || typeof cfg.notesDir !== 'string') {
    throw new Error('config.notesDir is required');
  }
  if (!fs.existsSync(cfg.notesDir)) {
    throw new Error(`config.notesDir does not exist: ${cfg.notesDir}`);
  }
  if (typeof cfg.debounceMs !== 'number') {
    throw new Error('config.debounceMs must be a number');
  }
  if (!cfg.glob || typeof cfg.glob !== 'string') {
    throw new Error('config.glob is required');
  }
  if (!Array.isArray(cfg.ignore)) {
    throw new Error('config.ignore must be an array of glob patterns');
  }

  // Set defaults for server config if not provided
  const server = cfg.server || {};
  return {
    ...cfg,
    server: {
      port: server.port || 3000,
      host: server.host || '127.0.0.1',
    },
  } as ServiceConfig;
}
