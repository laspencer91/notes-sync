import fs from 'fs';
import path from 'path';
import os from 'os';
import { AIConfig } from '@notes-sync/shared';
import { Logger } from './logger';

export interface ServiceConfig {
  notesDir: string;
  notesFile?: string; // Optional, defaults to "Daily.md"
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

function isDevelopmentMode(): boolean {
  try {
    const cwd = process.cwd();

    // Check if we're in a globally installed npm package
    // Global packages are typically in node_modules or lib directories
    if (
      cwd.includes('node_modules') ||
      cwd.includes('/lib/') ||
      cwd.includes('\\lib\\')
    ) {
      return false; // This is a globally installed package, not development
    }

    // Check if we're in the monorepo root
    const rootPackageJson = path.join(cwd, 'package.json');
    if (fs.existsSync(rootPackageJson)) {
      const packageJson = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
      if (
        packageJson.workspaces &&
        packageJson.workspaces.includes('packages/*')
      ) {
        return true;
      }
    }

    // Check if we're in a packages directory
    const parentDir = path.dirname(cwd);
    const parentPackageJson = path.join(parentDir, 'package.json');
    if (fs.existsSync(parentPackageJson)) {
      const parentJson = JSON.parse(fs.readFileSync(parentPackageJson, 'utf8'));
      if (
        parentJson.workspaces &&
        parentJson.workspaces.includes('packages/*')
      ) {
        return true;
      }
    }

    // Check if we're in packages/cli or packages/service
    const grandParentDir = path.dirname(parentDir);
    const grandParentPackageJson = path.join(grandParentDir, 'package.json');
    if (fs.existsSync(grandParentPackageJson)) {
      const grandParentJson = JSON.parse(
        fs.readFileSync(grandParentPackageJson, 'utf8')
      );
      if (
        grandParentJson.workspaces &&
        grandParentJson.workspaces.includes('packages/*')
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn('Error detecting development mode:', error);
    return false;
  }
}

export function loadConfig(): ServiceConfig {
  const isDevelopment = isDevelopmentMode();

  // In development mode, prioritize local config
  // In production mode, prioritize user config
  const configPaths = isDevelopment
    ? [
        path.resolve(__dirname, '..', 'config.json'), // Package config (development priority)
        path.join(os.homedir(), '.config', 'notes-sync', 'config.json'), // User config (fallback)
        path.resolve(process.cwd(), 'config.json'), // Current working directory
      ]
    : [
        path.join(os.homedir(), '.config', 'notes-sync', 'config.json'), // User config (production priority)
        path.resolve(__dirname, '..', 'config.json'), // Package config (fallback)
        path.resolve(process.cwd(), 'config.json'), // Current working directory
      ];

  let configPath: string | null = null;
  let raw: string = '';

  for (const candidatePath of configPaths) {
    if (fs.existsSync(candidatePath)) {
      configPath = candidatePath;
      raw = fs.readFileSync(configPath, 'utf8');
      break;
    }
  }

  if (!configPath) {
    throw new Error(`Config file not found. Tried: ${configPaths.join(', ')}`);
  }

  Logger.log(`- [CONFIG] loaded config from ${configPath}`);

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

  // Set defaults for AI config if not provided
  const ai = cfg.ai || {};
  const defaultAIConfig: AIConfig = {
    enabled: false,
    provider: 'gemini',
    apiKey: ai.apiKey || process.env.GEMINI_API_KEY,
    model: ai.model || 'gemini-1.5-flash',
    features: {
      dailyQuotes: {
        maxLength: ai.features?.dailyQuotes?.maxLength || 15,
        focus: ai.features?.dailyQuotes?.focus || [
          'productivity',
          'personal growth',
        ],
        adjectives: ai.features?.dailyQuotes?.adjectives || [
          'actionable',
          'motivational',
        ],
        additionalRules: ai.features?.dailyQuotes?.additionalRules || [
          'If quoting from spiritual texts, include the book name as author',
          'Prefer wisdom that applies to daily work and life',
        ],
        allowGenerated: ai.features?.dailyQuotes?.allowGenerated ?? false,
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

  // Ensure allowGenerated is always a boolean
  if (
    defaultAIConfig.features.dailyQuotes &&
    typeof defaultAIConfig.features.dailyQuotes.allowGenerated !== 'boolean'
  ) {
    defaultAIConfig.features.dailyQuotes.allowGenerated = false;
  }

  return {
    ...cfg,
    notesFile: cfg.notesFile || 'Daily.md', // Default to Daily.md if not specified
    server: {
      port: server.port || 3127,
      host: server.host || '127.0.0.1',
    },
    ai: defaultAIConfig,
  } as ServiceConfig;
}
