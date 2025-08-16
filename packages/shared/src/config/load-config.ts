import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { Config } from '../types';
import { Platform } from '../utils/platform';

export function loadConfig(): Config | null {
  try {
    const configPath = path.join(Platform.getConfigDir(), 'config.json');

    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData) as Config;
    }

    return null;
  } catch (error) {
    console.error('Error loading config:', error);
    return null;
  }
}
