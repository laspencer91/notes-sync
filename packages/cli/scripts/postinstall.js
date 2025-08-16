#!/usr/bin/env node

/**
 * Post-installation script for the CLI package
 * Handles platform-specific setup requirements
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Detect platform
const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

console.log(`Notes Sync CLI installed on ${process.platform}`);

// Get config directory path
function getConfigDir() {
  if (isWindows) {
    return path.join(process.env.APPDATA || '', 'notes-sync');
  }
  return path.join(os.homedir(), '.config', 'notes-sync');
}

// Create config directory if it doesn't exist
function createConfigDir() {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`Created config directory: ${configDir}`);
  }
}

// Windows-specific setup
function setupWindows() {
  // No additional Windows setup needed at the moment
  // This function is a placeholder for future Windows-specific setup
}

// macOS-specific setup
function setupMacOS() {
  // No additional macOS setup needed at the moment
  // This function is a placeholder for future macOS-specific setup
}

try {
  // Create config directory
  createConfigDir();

  // Platform-specific setup
  if (isWindows) {
    setupWindows();
  } else if (isMacOS) {
    setupMacOS();
  }

  console.log('Notes Sync CLI setup completed successfully!');
} catch (error) {
  console.error('Error during post-install setup:', error);
}
