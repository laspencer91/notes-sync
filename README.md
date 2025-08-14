# Notes Sync

A monorepo containing a background service and CLI for syncing markdown notes to GitHub.

## Structure

- `packages/shared/` - Shared types and API client
- `packages/service/` - HTTP server + file watcher daemon
- `packages/cli/` - Global CLI tool

## Setup

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Install CLI globally
npm run install:cli
```

## Usage

```bash
# Install service as system daemon
notes-sync install

# Check service status
notes-sync status

# Trigger manual sync
notes-sync sync

# View logs
notes-sync logs
```

## Development

```bash
# Run service in development mode
npm run dev:service

# Run CLI in development mode
cd packages/cli && npm run dev -- status
```

## Architecture

- **Service**: HTTP server (port 3000) + file watcher
- **CLI**: Makes HTTP requests to service
- **Shared**: Common types and API client
- **Communication**: REST API over HTTP

