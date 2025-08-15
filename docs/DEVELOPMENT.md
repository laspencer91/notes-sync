# Development Guide 🛠️

Welcome to the Notes Sync development guide! This document covers everything you need to know about developing, testing, and contributing to the project.

## 🚀 Quick Development Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **Yarn** (for package management)
- **Git** (for version control)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd notes-sync-mono

# Install dependencies
yarn install

# Build all packages
yarn build
```

## 🏗️ Local Development Workflow

### **Important: Port Conflicts**

⚠️ **Critical**: The service runs on port `3127` by default. If you have a globally installed version of `@notes-sync/service`, it will conflict with your local development service.

**Solutions:**
1. **Uninstall global service** (recommended):
   ```bash
   npm uninstall -g @notes-sync/service
   ```

2. **Use different port** in development:
   ```bash
   # Edit packages/service/config.json
   {
     "server": {
       "port": 3128,  // Use different port
       "host": "127.0.0.1"
     }
   }
   ```

### Running in Development Mode

#### **1. Start the Service**

```bash
# From project root
yarn dev:service

# Or from service directory
cd packages/service
npm run dev
```

The service will:
- Watch for file changes and auto-rebuild
- Use `packages/service/config.json` for configuration
- Run on the configured port (default: 3127)

#### **2. Test the CLI**

```bash
# From project root
yarn dev:cli status

# Or from CLI directory
cd packages/cli
npm run dev -- status
```

#### **3. Test Specific Commands**

```bash
# Add notes and todos
yarn dev:cli add -n "Test note from development"
yarn dev:cli add -t "Test todo from development"

# Interactive commands
yarn dev:cli mark-complete
yarn dev:cli delete

# Search and view
yarn dev:cli search "test"
yarn dev:cli view --today

# AI features
yarn dev:cli ai query "What should I focus on?"
```

### **Development Configuration**

The service uses different config files based on environment:

#### **Development Mode** (`packages/service/config.json`)
```json
{
  "notesDir": "/path/to/your/dev/notes",
  "notesFile": "Daily.md",
  "server": {
    "port": 3127,
    "host": "127.0.0.1"
  },
  "ai": {
    "enabled": true,
    "provider": "gemini",
    "apiKey": "your-dev-api-key"
  }
}
```

#### **Production Mode** (`~/.config/notes-sync/config.json`)
- Used when service is installed globally
- Created during `notes-sync install`

### **Environment Detection**

The service automatically detects development vs production:

```typescript
// packages/service/src/config.ts
function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.argv.includes('--dev') ||
         !fs.existsSync(path.join(os.homedir(), '.config', 'notes-sync'));
}
```

## 🏛️ System Architecture

Notes Sync follows a **distributed microservices architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   CLI Package   │───▶│  Shared Package  │◀───│ Service Package │
│                 │    │                  │    │                 │
│  • Commander.js │    │  • TypeScript    │    │  • HTTP Server  │
│  • User Input   │    │    Types         │    │  • File Watcher │
│  • Inquirer UI  │    │  • API Client    │    │  • Git Sync     │
│                 │    │  • HTTP Requests │    │  • NoteInteractor│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│  User Terminal  │    │  Network Layer   │    │ Markdown Files  │
│                 │    │                  │    │                 │
│  • Interactive  │    │  • HTTP/JSON     │    │  • Daily.md     │
│    Selection    │    │  • localhost:3127│    │  • Git History  │
│  • Fast Input   │    │  • Type Safety   │    │  • Auto-sync    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Core Components**

#### **1. CLI Package** (`packages/cli/`)
- **Commander.js**: Command-line argument parsing
- **Inquirer.js**: Interactive user selection menus
- **Service Discovery**: Automatic service detection and connection
- **User Experience**: Fast input, clear feedback, error handling

#### **2. Service Package** (`packages/service/`)
- **HTTP Server**: Fastify-based REST API
- **File Watcher**: Chokidar monitoring for markdown changes
- **Git Integration**: Smart sync with conflict resolution
- **NoteInteractor**: Core markdown parsing and manipulation
- **Wake Detection**: Auto-creates daily sections on system wake-up

#### **3. Shared Package** (`packages/shared/`)
- **TypeScript Types**: Full type safety across packages
- **API Client**: Centralized HTTP request logic
- **Request/Response Interfaces**: Consistent data contracts

## 🔄 Data Flow

### **Command Execution Flow**

```
1. User Command
   ↓
2. CLI Parser (Commander.js)
   ↓
3. Service Discovery
   ↓
4. API Client (HTTP Request)
   ↓
5. HTTP Server (Fastify)
   ↓
6. Business Logic (NoteInteractor)
   ↓
7. File Operations + Git Sync
   ↓
8. HTTP Response
   ↓
9. CLI Output
   ↓
10. User Feedback
```

### **Example: Adding a Note**

```bash
notes-sync add -n "Meeting with John about API design"
```

**Flow Breakdown:**

1. **CLI Parsing**: Commander.js parses `add -n "Meeting with John about API design"`
2. **Service Discovery**: CLI detects service running on localhost:3127
3. **API Request**: Sends POST to `/add-note` with content
4. **Server Processing**: Fastify receives request, validates payload
5. **NoteInteractor**: Finds today's section, appends note to "Notes" section
6. **File Write**: Updates markdown file with new content
7. **Git Sync**: Debounced commit and push to repository
8. **Response**: Returns success status to CLI
9. **User Feedback**: CLI displays "✅ Note added successfully!"

### **File Watching Flow**

```
1. User edits markdown file
   ↓
2. Chokidar detects change
   ↓
3. Debounce timer starts (20s default)
   ↓
4. Timer expires → Git operations
   ↓
5. Commit with meaningful message
   ↓
6. Push to remote repository
   ↓
7. Log success/failure
```

## 🧪 Testing

### **Unit Testing**

```bash
# Test all packages
yarn test

# Test specific package
cd packages/service && npm test
cd packages/cli && npm test
cd packages/shared && npm test
```

### **Integration Testing**

```bash
# Start service in test mode
cd packages/service
npm run test:integration

# Test CLI commands against running service
cd packages/cli
npm run test:integration
```

### **Manual Testing**

```bash
# 1. Start service
yarn dev:service

# 2. In another terminal, test CLI
yarn dev:cli status
yarn dev:cli add -n "Test note"
yarn dev:cli add -t "Test todo"
yarn dev:cli mark-complete
yarn dev:cli search "test"
```

## 🔧 Development Tools

### **TypeScript Configuration**

Each package has its own `tsconfig.json`:

- **Strict mode**: Enabled for type safety
- **Path mapping**: For clean imports
- **Declaration files**: Generated for shared types

### **Package Scripts**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/main.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

### **Hot Reloading**

The service uses `ts-node-dev` for automatic restarting on file changes:

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
node dist/main.js
```

## 🏗️ Adding New Features

### **Integration Pattern**

To add a new feature, follow this pattern:

1. **Add Types** (`packages/shared/src/types.ts`)
2. **Add API Client Method** (`packages/shared/src/api-client.ts`)
3. **Add Server Endpoint** (`packages/service/src/server.ts`)
4. **Add NoteInteractor Method** (`packages/service/src/note-interactor.ts`)
5. **Add CLI Command** (`packages/cli/src/commands/*.ts` + `cli.ts`)

### **Example: Adding a "Copy Note" Feature**

#### **Step 1: Add Types**
```typescript
// packages/shared/src/types.ts
export interface CopyNoteRequest {
  noteId: string;
  targetDate: string;
}

export interface CopyNoteResponse {
  success: boolean;
  message: string;
}
```

#### **Step 2: Add API Client Method**
```typescript
// packages/shared/src/api-client.ts
async copyNote(request: CopyNoteRequest): Promise<CopyNoteResponse> {
  return this.post('/copy-note', request);
}
```

#### **Step 3: Add Server Endpoint**
```typescript
// packages/service/src/server.ts
app.post('/copy-note', async (request, reply) => {
  const result = await noteInteractor.copyNote(request.body);
  return reply.send(result);
});
```

#### **Step 4: Add NoteInteractor Method**
```typescript
// packages/service/src/note-interactor.ts
async copyNote(request: CopyNoteRequest): Promise<CopyNoteResponse> {
  // Implementation here
}
```

#### **Step 5: Add CLI Command**
```typescript
// packages/cli/src/commands/copy-note.ts
export async function copyNoteCommand(noteId: string, targetDate: string) {
  const client = await serviceDiscovery.ensureService();
  const result = await client.copyNote({ noteId, targetDate });
  console.log(result.message);
}
```

## 🐛 Debugging

### **Service Debugging**

```bash
# Enable debug logging
DEBUG=notes-sync:* yarn dev:service

# Check service logs
yarn dev:cli logs

# Monitor file changes
tail -f ~/Documents/DailyNotes/Daily.md
```

### **CLI Debugging**

```bash
# Enable verbose output
yarn dev:cli status --verbose

# Test service connection
yarn dev:cli status --debug
```

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :3127

# Kill the process
kill -9 <PID>

# Or use different port in config
```

#### **Service Not Found**
```bash
# Check if service is running
curl http://localhost:3127/status

# Restart service
yarn dev:service
```

#### **Git Conflicts**
```bash
# Check git status
cd ~/Documents/DailyNotes
git status

# Resolve conflicts manually
git pull --rebase
```

## 📦 Publishing

### **Version Management**

```bash
# Show current versions
./scripts/publish.sh --version

# Bump and publish
./scripts/publish.sh --minor

# Dry run (no actual publishing)
./scripts/publish.sh --patch --dry-run
```

### **Package Dependencies**

The packages have specific dependency relationships:

- **Shared**: No dependencies (base types)
- **Service**: Depends on Shared
- **CLI**: Depends on Shared

### **Publishing Order**

1. **Shared** (types and API client)
2. **Service** (depends on Shared)
3. **CLI** (depends on Shared)

## 🤝 Contributing

### **Code Style**

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config with custom rules
- **Prettier**: Automatic code formatting
- **Jest**: Unit and integration testing

### **Commit Messages**

Follow conventional commits:

```
feat: add copy note functionality
fix: resolve git conflict handling
docs: update development guide
test: add integration tests for CLI
```

### **Pull Request Process**

1. **Fork** the repository
2. **Create** feature branch
3. **Implement** changes with tests
4. **Update** documentation
5. **Submit** pull request

### **Development Checklist**

- [ ] Code follows TypeScript strict mode
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Manual testing completed
- [ ] Service discovery works correctly
- [ ] Git integration tested

## 📚 Additional Resources

- **API Documentation**: See `packages/shared/src/types.ts`
- **Configuration**: See `packages/service/config.example.json`
- **CLI Commands**: See `packages/cli/src/commands/`
- **Service Endpoints**: See `packages/service/src/server.ts`

---

Happy coding! 🚀
