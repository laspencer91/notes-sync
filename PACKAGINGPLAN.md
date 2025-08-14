# Notes Sync - NPM Global Package Plan

## 📦 Distribution Strategy

### Primary Method: NPM Global Package

```bash
npm install -g @notes-sync/cli
```

**Why NPM Global:**

- Universal compatibility (works on all platforms with Node.js)
- Familiar installation method for developers
- Easy updates via `npm update -g @notes-sync/cli`
- Supports both `npm` and `yarn global add`
- Can be used with `npx` for one-time usage

---

## 🚀 Installation Flow & User Experience

### Phase 1: Package Installation

```bash
# User installs globally
npm install -g @notes-sync/cli

# Package provides two binaries:
# - notes-sync (main CLI)
# - notes-sync-service (background service)
```

### Phase 2: Interactive Setup

```bash
# First run triggers interactive setup
notes-sync init

# OR automatic on any command if not configured
notes-sync status
# → "No configuration found. Running setup..."
```

### Phase 3: Interactive Prompts

The `init` command will prompt:

1. **"Where do you want to store your notes?"**
   - Default: `~/Documents/Notes`
   - Validates directory exists or offers to create

2. **"Do you want the background service to run on system startup?"**
   - Yes: Automatically installs service (launchd/systemd/etc)
   - No: Manual start required (`notes-sync service start`)

3. **"Enable AI features? (requires API key)"**
   - Yes: Prompts for Gemini API key
   - No: Uses fallback quotes

4. **"Git repository setup"**
   - Auto-detects if notes directory is a git repo
   - Offers to initialize git + add remote if not

### Phase 4: Post-Setup

```bash
✅ Configuration saved to ~/.config/notes-sync/config.json
✅ Background service installed and started
✅ Git repository configured
✅ Ready to use!

Try: notes-sync add -t "My first todo"
```

---

## ⚙️ Configuration Management API Plan

### Current State

- Configuration lives in `config.json` files
- Service reads config on startup
- No runtime configuration changes

### Proposed CLI Configuration API

#### **Config Commands Architecture**

```bash
# View current configuration
notes-sync config show
notes-sync config show --json

# Get specific values
notes-sync config get notesDir
notes-sync config get ai.enabled

# Set values (updates config + restarts service if needed)
notes-sync config set notesDir "/new/path"
notes-sync config set ai.apiKey "new-key"
notes-sync config set ai.enabled true

# Interactive configuration editor
notes-sync config edit

# Reset to defaults
notes-sync config reset
notes-sync config reset ai  # Reset just AI section

# Export/Import configuration
notes-sync config export > my-config.json
notes-sync config import my-config.json

# Validate current configuration
notes-sync config validate
```

#### **Implementation Concept**

**1. Config Service Layer**

- Abstract config operations from file system
- Handle validation, defaults, and type safety
- Support multiple config sources (file, env vars, CLI flags)

**2. CLI Config Commands**

- Each command maps to config service operations
- Automatic service restart when needed
- Validation before applying changes
- Rollback capability for failed changes

**3. Service Integration**

- Service watches config file for changes
- Graceful reload without losing state
- API endpoint for config status: `GET /config/status`
- Hot-reload for non-critical settings (debounce, AI settings)
- Restart required for critical settings (notesDir, server port)

**4. Configuration Schema**

```typescript
// Typed configuration with validation
interface ConfigSchema {
  notesDir: string; // Requires service restart
  debounceMs: number; // Hot-reloadable
  server: {
    port: number; // Requires service restart
    host: string; // Requires service restart
  };
  ai: {
    enabled: boolean; // Hot-reloadable
    provider: string; // Hot-reloadable
    apiKey: string; // Hot-reloadable (sensitive)
  };
  // ... etc
}
```

---

## 🔧 Service Management Plan

### Service Lifecycle Commands

```bash
# Service status and control
notes-sync service status
notes-sync service start
notes-sync service stop
notes-sync service restart
notes-sync service logs
notes-sync service logs --follow

# Installation/uninstallation
notes-sync service install    # Install as system service
notes-sync service uninstall  # Remove system service

# Health and diagnostics
notes-sync service health     # Full health check
notes-sync service diagnose   # Debug connection issues
```

### Platform-Specific Service Integration

**macOS (launchd)**

- Install: Create `~/Library/LaunchAgents/com.notes-sync.service.plist`
- Auto-start on login
- Logs to `~/Library/Logs/notes-sync/`

**Linux (systemd)**

- Install: Create `~/.config/systemd/user/notes-sync.service`
- User-level service (no sudo required)
- Logs via `journalctl --user -u notes-sync`

**Windows (NSSM/sc.exe)**

- Install as Windows Service
- Start with user login
- Windows Event Log integration

### Service Health Monitoring

```bash
notes-sync service health
# ✅ Service running (PID: 12345)
# ✅ HTTP server responding (http://localhost:3000)
# ✅ Notes directory accessible (/Users/logan/Documents/Notes)
# ✅ Git repository healthy
# ⚠️  AI service: API key not configured
# ✅ File watcher active (monitoring 15 files)
```

---

## 📁 Package Structure Plan

### Repository Structure

```
notes-sync-mono/
├── packages/
│   ├── cli/                 # Main CLI package (published)
│   ├── service/             # Background service (bundled)
│   └── shared/              # Shared types (internal)
├── scripts/
│   ├── build-global.js      # Build script for global package
│   ├── postinstall.js       # NPM postinstall hook
│   └── platform-install.js  # Platform-specific service setup
└── dist-global/             # Built global package
    ├── package.json         # Global package manifest
    ├── bin/
    │   ├── notes-sync       # CLI entry point
    │   └── notes-sync-service # Service entry point
    ├── lib/                 # Bundled code
    └── templates/           # Config templates
```

### Published Package (`@notes-sync/cli`)

```json
{
  "name": "@notes-sync/cli",
  "version": "1.0.0",
  "description": "Automated note-taking and task management with AI",
  "bin": {
    "notes-sync": "./bin/notes-sync",
    "notes-sync-service": "./bin/notes-sync-service"
  },
  "files": ["bin/", "lib/", "templates/", "scripts/"],
  "scripts": {
    "postinstall": "node scripts/postinstall.js"
  },
  "preferGlobal": true,
  "engines": {
    "node": ">=16.0.0"
  }
}
```

---

## 🏗️ Implementation Phases

### Phase 1: Package Preparation

**Goal:** Transform monorepo into publishable global package

**Tasks:**

- [ ] Create build script to bundle all packages
- [ ] Configure proper entry points for CLI and service
- [ ] Set up binary executable files
- [ ] Create package.json for global distribution
- [ ] Add postinstall script for setup detection

**Deliverables:**

- `scripts/build-global.js` - Builds publishable package
- `dist-global/` - Ready-to-publish package
- Binary executables with proper shebang

### Phase 2: Interactive Setup System

**Goal:** Smooth first-run experience

**Tasks:**

- [ ] Build `notes-sync init` command with inquirer prompts
- [ ] Implement configuration file creation
- [ ] Add git repository detection and setup
- [ ] Create service installation prompts
- [ ] Add configuration validation

**Deliverables:**

- Interactive setup wizard
- Cross-platform config directory detection
- Git integration setup

### Phase 3: Service Management

**Goal:** Reliable background service control

**Tasks:**

- [ ] Implement platform detection (macOS/Linux/Windows)
- [ ] Create launchd plist generation (macOS)
- [ ] Create systemd service generation (Linux)
- [ ] Add Windows service support (NSSM)
- [ ] Build service status monitoring
- [ ] Add log file management

**Deliverables:**

- `notes-sync service` command suite
- Platform-specific service installers
- Health monitoring and diagnostics

### Phase 4: Configuration Management API

**Goal:** Runtime configuration without service restarts

**Tasks:**

- [ ] Build config command parser (`notes-sync config`)
- [ ] Implement config validation and type safety
- [ ] Add hot-reload capability to service
- [ ] Create config export/import functionality
- [ ] Add configuration backup/restore

**Deliverables:**

- Complete config management CLI
- Service hot-reload system
- Configuration validation framework

### Phase 5: Publishing & Distribution

**Goal:** Public NPM package release

**Tasks:**

- [ ] Set up NPM organization/scope
- [ ] Configure automated builds (GitHub Actions)
- [ ] Create comprehensive README for NPM
- [ ] Set up semantic versioning
- [ ] Add update notification system
- [ ] Create migration guides

**Deliverables:**

- Published NPM package
- Automated release pipeline
- User documentation

---

## 🎯 Success Metrics

### Installation Experience

- [ ] One-command global install: `npm install -g @notes-sync/cli`
- [ ] Automatic setup wizard on first run
- [ ] Service running within 60 seconds of install
- [ ] Zero-configuration for basic usage

### Service Reliability

- [ ] Service auto-starts on system boot
- [ ] Graceful handling of config changes
- [ ] Health monitoring and self-recovery
- [ ] Cross-platform compatibility

### Configuration Management

- [ ] Runtime config changes without restart
- [ ] Configuration validation and error reporting
- [ ] Easy migration between versions
- [ ] Secure handling of sensitive data (API keys)

### Developer Experience

- [ ] Clear error messages and troubleshooting guides
- [ ] Comprehensive CLI help system
- [ ] Debug mode for troubleshooting
- [ ] Easy uninstall process

---

## 🚨 Risk Mitigation

### Platform Compatibility

- **Risk:** Service installation fails on different platforms
- **Mitigation:** Extensive testing on macOS/Linux/Windows, fallback to manual service setup

### Configuration Complexity

- **Risk:** Users overwhelmed by configuration options
- **Mitigation:** Smart defaults, progressive disclosure, setup wizard

### Service Management

- **Risk:** Background service becomes orphaned or unmanageable
- **Mitigation:** Robust health checking, easy restart/reinstall commands

### Update Path

- **Risk:** Breaking changes in updates
- **Mitigation:** Configuration migration system, semantic versioning, rollback capability

---

This plan provides a comprehensive roadmap for transforming the current monorepo into a production-ready, globally installable NPM package with professional service management and configuration capabilities.
