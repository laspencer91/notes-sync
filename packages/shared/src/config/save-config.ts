import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { Config } from '../types';
import { Platform } from '../utils/platform';

export function saveConfig(config: Config): void {
  const configDir = Platform.getConfigDir();

  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
