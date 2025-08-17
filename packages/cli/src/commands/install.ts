import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ServiceDiscovery } from '../service-discovery';
import { installService } from '../installation.utils';

export async function installCommand() {
  console.log('🔧 Installing Notes Sync Service...');

  const isWindows = process.platform === 'win32';

  try {
    const serviceDiscovery = new ServiceDiscovery();
    const serviceInfo = await serviceDiscovery.discoverService();

    if (!serviceInfo.isInstalled) {
      console.log('📦 Service not installed. Installing it now...');

      // Install the service globally
      const installResult = installService();

      if (installResult.status !== 0) {
        console.error('❌ Failed to install service');
        console.log(
          '💡 Try running manually: npm install -g @notes-sync/service'
        );
        process.exit(1);
      }

      console.log('✅ Service installed successfully!');
    }

    // Now run the service's install script
    let installResult;

    // Check if notes-sync-service is available globally
    const globalCheck = spawnSync('which', ['notes-sync-service'], {
      stdio: 'pipe',
      shell: isWindows,
    });

    if (globalCheck.status === 0) {
      // Global command exists
      installResult = spawnSync('notes-sync-service', ['install'], {
        stdio: 'inherit',
        shell: isWindows,
      });
    } else {
      // Try to find the service in node_modules/.bin
      const servicePath = path.join(
        process.cwd(),
        'node_modules',
        '.bin',
        isWindows ? 'notes-sync-service.cmd' : 'notes-sync-service' // ✅ Add .cmd for Windows
      );

      if (fs.existsSync(servicePath)) {
        installResult = spawnSync(servicePath, ['install'], {
          stdio: 'inherit',
          shell: false, // Direct paths don't need shell
        });
      } else {
        installResult = installService();
      }
    }

    // Check if installResult exists before checking status
    if (installResult && installResult.status === 0) {
      console.log('✅ Service installed successfully!');
      console.log('💡 Use "notes-sync status" to check if it\'s running');
    } else {
      console.error('❌ Installation failed');
      if (installResult?.error) {
        console.error('Error:', installResult.error);
      }
      console.log(
        '💡 Try manual installation - npm install -g @notes-sync/service'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to install service:', error);
    process.exit(1);
  }
}
