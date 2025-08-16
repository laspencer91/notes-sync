# @notes-sync/service

Background service for Notes Sync - AI-powered note synchronization with Git backup.

## Overview

This package provides a background service that:

- Watches your notes directory for changes
- Automatically commits and pushes to Git
- Provides an HTTP API for the CLI to interact with
- Creates daily note sections with AI-generated quotes
- Handles file formatting and organization

## Installation

```bash
# Install globally
npm install -g @notes-sync/service

# Install as background service
notes-sync install
```

## Usage

### Start Service

```bash
# Start manually (foreground)
notes-sync-service

# Start as background service
notes-sync-service start
```

### Command Line

The service is designed to be used with the CLI package:

```bash
npm install -g @notes-sync/cli
notes-sync status
```

### Configuration

Create a config file at `~/.config/notes-sync/config.json`:

```json
{
  "notesDir": "/path/to/your/notes",
  "notesFile": "Daily.md",
  "server": {
    "host": "127.0.0.1",
    "port": 3127
  },
  "autoCreateDaily": true
}
```

**Interactive Setup**: The easiest way to configure is through the CLI:

```bash
notes-sync install
```

This will detect existing markdown files and ask if you want to use them.

## API Endpoints

The service exposes HTTP endpoints on port 3127:

- `GET /status` - Service health and info
- `POST /sync` - Trigger manual sync
- `POST /add-note` - Add note to today's section
- `POST /add-todo` - Add todo to today's focus
- And many more...

## Documentation

For full documentation, visit the [Notes Sync GitHub repository](https://github.com/yourusername/notes-sync).

## License

MIT
