#!/usr/bin/env node

/**
 * Cross-platform publish script for notes-sync packages
 * Works on Windows, macOS, and Linux
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to display usage
function showUsage() {
  console.log('Usage: node scripts/publish.js [OPTIONS]');
  console.log('');
  console.log('Options:');
  console.log('  --patch     Bump patch version (1.0.0 -> 1.0.1)');
  console.log('  --minor     Bump minor version (1.0.0 -> 1.1.0)');
  console.log('  --major     Bump major version (1.0.0 -> 2.0.0)');
  console.log('  --version   Show current versions of all packages');
  console.log(
    '  --dry-run   Show what would be done without actually doing it'
  );
  console.log('  --help      Show this help message');
  console.log('');
  console.log('Examples:');
  console.log(
    '  node scripts/publish.js                    # Publish current versions'
  );
  console.log(
    '  node scripts/publish.js --patch            # Bump patch version and publish'
  );
  console.log(
    '  node scripts/publish.js --minor            # Bump minor version and publish'
  );
  console.log(
    '  node scripts/publish.js --major            # Bump major version and publish'
  );
  console.log(
    '  node scripts/publish.js --patch --dry-run  # Test version bumping without publishing'
  );
  console.log('');
}

// Function to get current version
function getVersion(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

// Function to bump version
function bumpVersion(packagePath, bumpType) {
  const currentVersion = getVersion(packagePath);

  console.log(`📦 Bumping ${packagePath} from ${currentVersion}...`);

  // Use npm version to bump the version
  const originalCwd = process.cwd();
  process.chdir(packagePath);
  execSync(`npm version ${bumpType} --no-git-tag-version`, {
    stdio: 'inherit',
  });
  process.chdir(originalCwd);

  const newVersion = getVersion(packagePath);
  console.log(`✅ Bumped to ${newVersion}`);
}

// Function to update yarn lockfile
function updateLockfile() {
  console.log('🔄 Updating yarn lockfile...');
  execSync('yarn install --silent', { stdio: 'inherit' });
  console.log('✅ Lockfile updated');
}

// Function to show current versions
function showVersions() {
  console.log('📋 Current package versions:');
  console.log(`  - @notes-sync/shared@${getVersion('./packages/shared')}`);
  console.log(`  - @notes-sync/service@${getVersion('./packages/service')}`);
  console.log(`  - @notes-sync/cli@${getVersion('./packages/cli')}`);
  console.log('');
}

// Parse command line arguments
const args = process.argv.slice(2);
let bumpType = '';
let showVersionsFlag = false;
let dryRun = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case '--patch':
      bumpType = 'patch';
      break;
    case '--minor':
      bumpType = 'minor';
      break;
    case '--major':
      bumpType = 'major';
      break;
    case '--version':
      showVersionsFlag = true;
      break;
    case '--dry-run':
      dryRun = true;
      break;
    case '--help':
    case '-h':
      showUsage();
      process.exit(0);
      break;
    default:
      console.log(`❌ Unknown option: ${arg}`);
      showUsage();
      process.exit(1);
  }
}

// Show versions if requested
if (showVersionsFlag) {
  showVersions();
  process.exit(0);
}

// Bump versions if requested
if (bumpType) {
  console.log(`🚀 Bumping versions (${bumpType}) for all packages...`);
  console.log('');

  // Bump versions in dependency order
  bumpVersion('./packages/shared', bumpType);
  bumpVersion('./packages/service', bumpType);
  bumpVersion('./packages/cli', bumpType);

  // Update yarn lockfile to sync with new versions
  updateLockfile();

  console.log('');
  console.log('📋 New versions:');
  showVersions();
  console.log('');
}

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No actual publishing will occur');
  console.log('');
  console.log('📦 Would build packages...');
  console.log('📦 Would publish @notes-sync/shared...');
  console.log('📦 Would publish @notes-sync/service...');
  console.log('📦 Would publish @notes-sync/cli...');
  console.log('');
  console.log('📋 Would publish packages:');
  showVersions();
  console.log('✅ Dry run completed successfully!');
  process.exit(0);
}

console.log('🚀 Publishing notes-sync packages...');

// Build all packages first
console.log('📦 Building packages...');
execSync('yarn build', { stdio: 'inherit' });

// Publish shared package first (dependency)
console.log('📦 Publishing @notes-sync/shared...');
const originalCwd = process.cwd();
process.chdir('packages/shared');
execSync('npm publish --access public', { stdio: 'inherit' });
process.chdir(originalCwd);

// Publish service package
console.log('📦 Publishing @notes-sync/service...');
process.chdir('packages/service');
execSync('npm publish --access public', { stdio: 'inherit' });
process.chdir(originalCwd);

// Publish CLI package last
console.log('📦 Publishing @notes-sync/cli...');
process.chdir('packages/cli');
execSync('npm publish --access public', { stdio: 'inherit' });
process.chdir(originalCwd);

console.log('✅ All packages published successfully!');
console.log('');
console.log('📋 Published packages:');
showVersions();
console.log('🎉 Installation instructions:');
console.log('  npm install -g @notes-sync/cli');
console.log('  npm install -g @notes-sync/service');
console.log('');
console.log('💡 To upgrade existing installations:');
console.log('  notes-sync upgrade');
