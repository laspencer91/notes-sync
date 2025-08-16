import * as path from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';

/**
 * Windows service manager implementation
 */
export class WindowsServiceManager {
  private static readonly SERVICE_NAME = 'NotesSyncService';
  private static readonly NODE_WINDOWS_MODULE = 'node-windows';

  /**
   * Checks if node-windows is installed
   */
  static checkDependencies(): boolean {
    try {
      require.resolve(this.NODE_WINDOWS_MODULE);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Installs node-windows if not already installed
   */
  static async installDependencies(): Promise<void> {
    if (!this.checkDependencies()) {
      console.log('Installing node-windows package...');
      execSync('npm install node-windows --save', { stdio: 'inherit' });
    }
  }

  /**
   * Creates and installs a Windows service
   */
  static async install(): Promise<void> {
    try {
      await this.installDependencies();

      // Create a Windows service install script
      const scriptPath = path.join(
        __dirname,
        '..',
        '..',
        'install-windows-service.js'
      );

      // Generate the script content
      const scriptContent = this.generateServiceScript();

      // Write the script to file
      fs.writeFileSync(scriptPath, scriptContent);

      // Execute the script
      console.log('Installing Notes Sync as a Windows service...');
      execSync(`node "${scriptPath}"`, { stdio: 'inherit' });

      // Clean up the temporary script
      fs.unlinkSync(scriptPath);

      console.log('Windows service installed successfully!');
    } catch (error) {
      console.error('Failed to install Windows service:', error);
      throw error;
    }
  }

  /**
   * Uninstalls the Windows service
   */
  static async uninstall(): Promise<void> {
    try {
      await this.installDependencies();

      // Create an uninstall script
      const scriptPath = path.join(
        __dirname,
        '..',
        '..',
        'uninstall-windows-service.js'
      );

      // Generate the uninstall script content
      const scriptContent = this.generateUninstallScript();

      // Write the script to file
      fs.writeFileSync(scriptPath, scriptContent);

      // Execute the script
      console.log('Uninstalling Notes Sync Windows service...');
      execSync(`node "${scriptPath}"`, { stdio: 'inherit' });

      // Clean up the temporary script
      fs.unlinkSync(scriptPath);

      console.log('Windows service uninstalled successfully!');
    } catch (error) {
      console.error('Failed to uninstall Windows service:', error);
      throw error;
    }
  }

  /**
   * Generates a script for installing the Windows service
   */
  private static generateServiceScript(): string {
    return `const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: '${this.SERVICE_NAME}',
  description: 'Notes Sync Service - Auto-syncs and manages your notes',
  script: path.join(__dirname, 'dist', 'main.js'),
  nodeOptions: [],
  workingDirectory: __dirname,
  allowServiceLogon: true
});

// Listen for service install events
svc.on('install', () => {
  console.log('Service installed successfully');
  svc.start();
});

svc.on('start', () => {
  console.log('Service started');
});

svc.on('error', (err) => {
  console.error('Service error:', err);
});

// Install the service
svc.install();
`;
  }

  /**
   * Generates a script for uninstalling the Windows service
   */
  private static generateUninstallScript(): string {
    return `const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: '${this.SERVICE_NAME}',
  script: path.join(__dirname, 'dist', 'main.js')
});

// Listen for uninstall events
svc.on('uninstall', () => {
  console.log('Service uninstalled successfully');
});

svc.on('error', (err) => {
  console.error('Service uninstall error:', err);
});

// Uninstall the service
svc.uninstall();
`;
  }
}
