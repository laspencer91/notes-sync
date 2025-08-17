#!/usr/bin/env node

/**
 * Cross-platform service uninstallation script
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Platform detection
const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';

// Service configuration
const AGENT_LABEL = 'com.notesync.service';

/**
 * Uninstall Windows service
 */
async function uninstallWindowsService() {
  try {
    // We'll dynamically load the service manager from the compiled TypeScript
    const {
      WindowsServiceManager,
    } = require('../dist/services/windows-service-manager');
    await WindowsServiceManager.uninstall();
  } catch (error) {
    console.error('Failed to uninstall Windows service:', error);
    throw error;
  }
}

/**
 * Uninstall macOS LaunchAgent
 */
async function uninstallMacService() {
  try {
    const homeDir = os.homedir();
    const plistPath = path.join(
      homeDir,
      'Library',
      'LaunchAgents',
      `${AGENT_LABEL}.plist`
    );
    const configDir = path.join(homeDir, '.config', 'notes-sync');

    // Unload the service if the plist file exists
    if (fs.existsSync(plistPath)) {
      try {
        execSync(`launchctl unload "${plistPath}"`);
        console.log('✅ Service unloaded successfully');
      } catch (err) {
        console.warn(
          '⚠️  Warning: Could not unload service, it may not be running.'
        );
      }

      // Remove the plist file
      fs.unlinkSync(plistPath);
      console.log('✅ Service plist file removed');
    } else {
      console.log('ℹ️  Service plist file not found');
    }

    // Ask if user wants to remove config
    if (fs.existsSync(configDir)) {
      console.log(`📁 Config directory still exists: ${configDir}`);
      console.log(
        '💡 To remove config files, run: rm -rf ~/.config/notes-sync'
      );
    }

    console.log('macOS service uninstalled successfully!');
  } catch (error) {
    console.error('Failed to uninstall macOS service:', error);
    throw error;
  }
}

// Main uninstall function
async function uninstallService() {
  try {
    if (isWindows) {
      await uninstallWindowsService();
    } else if (isMacOS) {
      await uninstallMacService();
    } else {
      console.error(
        'Unsupported platform. Only macOS and Windows are currently supported.'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('Error uninstalling service:', error);
    process.exit(1);
  }
}

// Run the uninstall function
uninstallService();
