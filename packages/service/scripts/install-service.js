#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const readline = require('readline');

const AGENT_LABEL = 'com.notesync.service';

function createPlist() {
  const nodeBin = process.execPath;
  const serviceMain = path.resolve(__dirname, '..', 'dist', 'main.js');
  const logsDir = path.resolve(__dirname, '..', 'logs');

  const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodeBin}</string>
    <string>${serviceMain}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${path.join(logsDir, 'out.log')}</string>
  <key>StandardErrorPath</key>
  <string>${path.join(logsDir, 'err.log')}</string>
  <key>ProcessType</key>
  <string>Background</string>
  <key>CFBundleName</key>
  <string>Notes Sync Service</string>
  <key>CFBundleDisplayName</key>
  <string>Notes Sync Service</string>
  <key>CFBundleIdentifier</key>
  <string>com.notesync.service</string>
  <key>CFBundleVersion</key>
  <string>${version ?? '1.0.3'}</string>
  <key>CFBundleShortVersionString</key>
  <string>${version ?? '1.0.3'}</string>
</dict>
</plist>`;
}

function question(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    console.log(query);
    rl.question('', ans => {
      rl.close();
      resolve(ans);
    });
  });
}

function findExistingMarkdownFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    const mdFiles = files.filter(file => file.toLowerCase().endsWith('.md'));
    return mdFiles;
  } catch (error) {
    return [];
  }
}

function isGitRepo(dir) {
  return fs.existsSync(path.join(dir, '.git'));
}

function initGitRepo(dir) {
  console.log(`🔧 Initializing Git repository in ${dir}...`);
  const result = spawnSync('git', ['init'], {
    cwd: dir,
    stdio: 'inherit',
  });
  return result.status === 0;
}

function createInitialNotesFile(dir) {
  const notesFile = path.join(dir, 'notes.md');
  if (!fs.existsSync(notesFile)) {
    const initialContent = `# Daily Notes

Welcome to Notes Sync! This file will be automatically updated with your daily notes and todos.

## Getting Started

- Use \`notes-sync add -n "Your note"\` to add notes
- Use \`notes-sync add -t "Your todo"\` to add todos
- Use \`notes-sync view --today\` to view today's notes
- Use \`notes-sync search "query"\` to search your notes

Your notes will be automatically synced to Git when you make changes.
`;
    fs.writeFileSync(notesFile, initialContent);
    console.log(`📄 Created initial notes file: ${notesFile}`);
  }
}

async function setupConfig() {
  const configDir = path.join(os.homedir(), '.config', 'notes-sync');
  const configPath = path.join(configDir, 'config.json');

  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`📁 Created config directory: ${configDir}`);
  }

  // Check if config already exists
  if (fs.existsSync(configPath)) {
    console.log('⚠️  Config file already exists at:', configPath);
    console.log(
      '💡 You can take your time to decide - the installation will wait for your input.'
    );
    const overwrite = await question(
      'Do you want to overwrite it with new settings? (y/N): '
    );
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('ℹ️  Using existing config file');
      console.log('💡 To reconfigure later, run: notes-sync-service install');
      return;
    }
    console.log('✅ Will overwrite existing config');
  }

  console.log('\n🎯 Notes Sync Setup');
  console.log('==================\n');

  // Prompt for notes directory
  const defaultNotesDir = path.join(os.homedir(), 'Documents', 'DailyNotes');
  let notesDir = await question(
    `📁 Notes directory (default: ${defaultNotesDir}): `
  );
  notesDir = notesDir.trim() || defaultNotesDir;

  // Resolve relative paths
  if (!path.isAbsolute(notesDir)) {
    notesDir = path.resolve(notesDir);
  }

  // Check if directory exists, create if not
  if (!fs.existsSync(notesDir)) {
    const create = await question(
      `📁 Directory doesn't exist: ${notesDir}\nCreate it? (Y/n): `
    );
    if (create.toLowerCase() !== 'n' && create.toLowerCase() !== 'no') {
      fs.mkdirSync(notesDir, { recursive: true });
      console.log(`✅ Created directory: ${notesDir}`);
    } else {
      console.log('❌ Installation cancelled');
      process.exit(1);
    }
  }

  // Check if it's a git repo
  if (!isGitRepo(notesDir)) {
    const initGit = await question(
      '🔧 Initialize Git repository for automatic note syncing? (Y/n): '
    );
    if (initGit.toLowerCase() !== 'n' && initGit.toLowerCase() !== 'no') {
      if (!initGitRepo(notesDir)) {
        console.log('❌ Failed to initialize Git repository');
        process.exit(1);
      }
    } else {
      console.log(
        "⚠️  Git repository not initialized. Notes won't be synced automatically."
      );
    }
  } else {
    console.log('✅ Git repository found');
  }

  // Check for existing markdown files
  const existingMdFiles = findExistingMarkdownFiles(notesDir);
  let notesFileName = 'Daily.md'; // Default

  if (existingMdFiles.length > 0) {
    console.log('\n📄 Found existing markdown files:');
    existingMdFiles.forEach(file => console.log(`  - ${file}`));

    const useExisting = await question(
      'Do you want to use one of these files for Notes Sync? (Y/n): '
    );

    if (
      useExisting.toLowerCase() !== 'n' &&
      useExisting.toLowerCase() !== 'no'
    ) {
      if (existingMdFiles.length === 1) {
        notesFileName = existingMdFiles[0];
        console.log(`✅ Will use: ${notesFileName}`);
      } else {
        console.log('Which file would you like to use?');
        existingMdFiles.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file}`);
        });

        const choice = await question(
          `Enter number (1-${existingMdFiles.length}): `
        );
        const choiceIndex = parseInt(choice) - 1;

        if (choiceIndex >= 0 && choiceIndex < existingMdFiles.length) {
          notesFileName = existingMdFiles[choiceIndex];
          console.log(`✅ Will use: ${notesFileName}`);
        } else {
          console.log('❌ Invalid choice, will create new file');
          notesFileName = 'Daily.md';
        }
      }
    } else {
      console.log('✅ Will create new file: Daily.md');
    }
  } else {
    console.log('📄 No existing markdown files found, will create: Daily.md');
  }

  // Create initial notes file
  createInitialNotesFile(notesDir);

  // Prompt for AI features
  console.log('\n🤖 AI Features');
  console.log('=============');
  console.log(
    'AI features can generate daily quotes and help analyze your notes.'
  );
  console.log(
    "You'll need a free Gemini API key from: https://makersuite.google.com/app/apikey"
  );
  console.log(
    '💡 You can skip this for now and add your API key later by editing the config file.'
  );
  const enableAI = await question('Enable AI features? (y/N): ');

  let aiConfig = {
    enabled: false,
    provider: 'gemini',
    apiKey: 'your-gemini-api-key-here',
    model: 'gemini-2.5-flash-lite',
    features: {
      dailyQuotes: {
        maxLength: 30,
        focus: ['productivity', 'personal growth'],
        adjectives: ['actionable or practical', 'motivational'],
        additionalRules: ['Prefer wisdom that applies to daily work and life'],
        allowGenerated: false,
      },
    },
    rateLimiting: {
      requestsPerMinute: 10,
      requestsPerDay: 100,
    },
  };

  if (enableAI.toLowerCase() === 'y' || enableAI.toLowerCase() === 'yes') {
    console.log('\n🔑 API Key Setup');
    console.log('===============');
    console.log('Enter your Gemini API key (or press Enter to skip for now):');
    console.log(
      '💡 Take your time - you can open another terminal to get your API key if needed.'
    );
    const apiKey = await question('API Key: ');
    if (apiKey.trim()) {
      aiConfig.enabled = true;
      aiConfig.apiKey = apiKey.trim();
      console.log('✅ AI features enabled');
    } else {
      console.log('⚠️  No API key provided, AI features disabled');
      console.log(
        '💡 You can add your API key later by editing the config file'
      );
    }
  } else {
    console.log('ℹ️  AI features disabled');
  }

  // Create config object
  const config = {
    notesDir: notesDir,
    notesFile: notesFileName,
    debounceMs: 20000,
    glob: '**/*.md',
    ignore: [
      '**/.git/**',
      '**/.git',
      '**/node_modules/**',
      '**/.DS_Store',
      '**/.Trash/**',
      '**/.Spotlight-V100/**',
      '**/.fseventsd/**',
    ],
    autoCreateDaily: true,
    wakeDetection: {
      enabled: true,
      intervalMs: 20000,
      thresholdMs: 20000,
    },
    ai: aiConfig,
    server: {
      port: 3127,
      host: 'localhost',
    },
  };

  // Write config file
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`\n✅ Config created: ${configPath}`);

  // Show summary
  console.log('\n📋 Configuration Summary');
  console.log('=======================');
  console.log(`📁 Notes Directory: ${notesDir}`);
  console.log(`📄 Notes File: ${notesFileName}`);
  console.log(
    `🔧 Git Repository: ${isGitRepo(notesDir) ? '✅ Initialized' : '❌ Not initialized'}`
  );
  console.log(
    `🤖 AI Features: ${aiConfig.enabled ? '✅ Enabled' : '❌ Disabled'}`
  );
  console.log(`🌐 Service Port: ${config.server.port}`);
  console.log(`\n💡 Edit config anytime at: ${configPath}`);
}

function install() {
  // Setup config first
  setupConfig()
    .then(() => {
      const plistPath = path.join(
        os.homedir(),
        'Library',
        'LaunchAgents',
        `${AGENT_LABEL}.plist`
      );
      const plistContent = createPlist();

      fs.writeFileSync(plistPath, plistContent);

      const result = spawnSync('launchctl', ['load', '-w', plistPath], {
        stdio: 'inherit',
      });

      if (result.status === 0) {
        console.log(`\n✅ Service installed: ${plistPath}`);
        console.log('🚀 Notes Sync is now running in the background!');
        console.log('\n📖 Next Steps:');
        console.log('  • Try: notes-sync status');
        console.log('  • Add a note: notes-sync add -n "Hello world!"');
        console.log('  • View today: notes-sync view --today');
      } else {
        console.error('❌ Failed to install service');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

install();
