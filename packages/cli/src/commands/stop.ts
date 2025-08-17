import { ServiceDiscovery } from '../service-discovery';
import { spawnSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

export async function stopCommand() {
  const serviceDiscovery = new ServiceDiscovery();

  try {
    console.log('🛑 Stopping Notes Sync Service...');

    // First try graceful shutdown via API
    try {
      const client = await serviceDiscovery.ensureService(false); // Don't prompt for install
      await client.shutdown();
      console.log('✅ Sent shutdown signal to service');
    } catch (error) {
      console.log(
        '⚠️ Could not connect to service API, trying alternative methods'
      );
    }

    // On macOS, also unload the LaunchAgent to prevent auto-restart
    if (process.platform === 'darwin') {
      const AGENT_LABEL = 'com.notesync.service';
      const plistPath = path.join(
        os.homedir(),
        'Library',
        'LaunchAgents',
        `${AGENT_LABEL}.plist`
      );

      if (fs.existsSync(plistPath)) {
        console.log(
          '🔄 Temporarily unloading LaunchAgent to prevent auto-restart'
        );
        const unloadResult = spawnSync('launchctl', ['unload', plistPath], {
          stdio: 'inherit',
        });

        if (unloadResult.status === 0) {
          console.log('✅ LaunchAgent unloaded successfully');
        } else {
          console.log('⚠️ Could not unload LaunchAgent');
        }
      }
    }

    // As a last resort, find and kill any remaining processes
    console.log('🔍 Checking for any remaining service processes...');

    if (process.platform === 'win32') {
      // Windows process handling
      const findCmd = spawnSync(
        'wmic',
        [
          'process',
          'where',
          'name like "%node%"',
          'get',
          'processid,commandline',
        ],
        { encoding: 'utf8', shell: true }
      );

      if (findCmd.status === 0) {
        const processes = findCmd.stdout
          .split('\n')
          .filter(line => line.includes('notes-sync-service'));

        if (processes.length > 0) {
          console.log(
            `Found ${processes.length} service processes still running`
          );
          processes.forEach(proc => {
            const pidMatch = proc.match(/\s+(\d+)\s*$/);
            if (pidMatch) {
              const pid = pidMatch[1];
              console.log(`Stopping process ${pid}`);
              spawnSync('taskkill', ['/F', '/PID', pid], { shell: true });
            }
          });
        } else {
          console.log('✅ No service processes found running');
        }
      }
    } else {
      // Linux / Mac process kill handling
      const findCmd = spawnSync('ps', ['aux'], { encoding: 'utf8' });
      if (findCmd.status === 0) {
        const processes = findCmd.stdout
          .split('\n')
          .filter(
            line =>
              line.includes('notes-sync-service') && !line.includes('grep')
          );

        if (processes.length > 0) {
          console.log(
            `Found ${processes.length} service processes still running`
          );
          processes.forEach(proc => {
            const pid = proc.split(/\s+/)[1];
            if (pid) {
              console.log(`Stopping process ${pid}`);
              spawnSync('kill', [pid]);
            }
          });
        } else {
          console.log('✅ No service processes found running');
        }
      }
    }

    console.log('✅ Service stopped successfully');
    console.log('💡 To restart the service, run: notes-sync install');
  } catch (error) {
    console.error('❌ Failed to stop service:', (error as Error).message);
    console.log(
      "💡 Try stopping manually: kill $(ps aux | grep notes-sync-service | grep -v grep | awk '{print $2}')"
    );
  }
}
