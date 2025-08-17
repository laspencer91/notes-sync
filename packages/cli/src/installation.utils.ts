import { spawn, spawnSync } from 'child_process';
import { ApiClient } from '@notes-sync/shared';
import path from 'path';

const isWindows = process.platform === 'win32';

/**
 * Install the service using npm -g
 */
export function installService() {
  return spawnSync('npm', ['install', '-g', '@notes-sync/service'], {
    stdio: 'inherit',
    shell: isWindows,
  });
}

export async function startService(
  host: string,
  port: number
): Promise<boolean> {
  console.log('🚀 Starting service, this may take a few seconds...');

  if (isWindows) {
    const servicePath = require.resolve('@notes-sync/service');

    console.log(`Running ${servicePath} as background...`);

    const serviceProcess = spawn('node', [servicePath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    serviceProcess.unref();
  } else {
    // Unix doesn't have the console window issue
    const serviceProcess = spawn('notes-sync-service', [], {
      detached: true,
      stdio: 'ignore',
    });
    serviceProcess.unref();
  }

  const apiClient = new ApiClient(`http://${host}:${port}`);

  let tries = 0;

  while (tries <= 8) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const response = await apiClient.getStatus();
      if (response.running) {
        console.log('✅ Service started and responding');
        return true;
      }
    } catch (error) {}
    tries += 1;
  }

  console.error('❌ Service not responding');
  return false;
}
