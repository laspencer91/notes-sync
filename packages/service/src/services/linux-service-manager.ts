import * as path from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';

/**
 * Linux service manager implementation
 */
export class LinuxServiceManager {
  private static readonly SERVICE_NAME = 'notessync';
  private static readonly SERVICE_FILE = `/etc/systemd/system/${this.SERVICE_NAME}.service`;

  /**
   * Checks if systemd is available
   */
  static checkDependencies(): boolean {
    try {
      execSync('systemctl --version', { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Installs the service as a systemd background process
   */
  static async install(): Promise<void> {
    try {
      if (!this.checkDependencies()) {
        throw new Error('Systemd not found');
      }

      // Generate systemd service file content
      const serviceContent = this.generateServiceFile();

      // Write service file
      fs.writeFileSync(this.SERVICE_FILE, serviceContent, { mode: 0o644 });

      // Reload systemd and enable service
      console.log('Installing Notes Sync as a systemd service...');
      execSync(`systemctl daemon-reload`, { stdio: 'inherit' });
      execSync(`systemctl enable ${this.SERVICE_NAME}`, { stdio: 'inherit' });
      execSync(`systemctl start ${this.SERVICE_NAME}`, { stdio: 'inherit' });

      console.log('Systemd service installed successfully!');
    } catch (error) {
      console.error('Failed to install systemd service:', error);
      throw error;
    }
  }

  /**
   * Uninstalls the systemd service
   */
  static async uninstall(): Promise<void> {
    try {
      if (!this.checkDependencies()) {
        throw new Error('Systemd not found');
      }

      // Stop and disable service
      console.log('Uninstalling Notes Sync systemd service...');
      execSync(`systemctl stop ${this.SERVICE_NAME}`, { stdio: 'inherit' });
      execSync(`systemctl disable ${this.SERVICE_NAME}`, { stdio: 'inherit' });

      // Remove service file
      if (fs.existsSync(this.SERVICE_FILE)) {
        fs.unlinkSync(this.SERVICE_FILE);
      }

      // Reload systemd
      execSync(`systemctl daemon-reload`, { stdio: 'inherit' });
      execSync(`systemctl reset-failed`, { stdio: 'inherit' });

      console.log('Systemd service uninstalled successfully!');
    } catch (error) {
      console.error('Failed to uninstall systemd service:', error);
      throw error;
    }
  }

  /**
   * Generates systemd service file content
   */
  private static generateServiceFile(): string {
    const execPath = path.join(__dirname, 'dist', 'main.js');
    return `[Unit]
Description=Notes Sync Service - Auto-syncs and manages your notes
After=network.target

[Service]
ExecStart=/usr/bin/node ${execPath}
WorkingDirectory=${__dirname}
Restart=always
User=nobody
Group=nogroup
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;
  }
}
