# @notes-sync/shared

Shared types and API client for Notes Sync - an AI-powered note synchronization system.

## Overview

This package contains:
- TypeScript interfaces for API communication
- API client for interacting with the Notes Sync service
- Shared types for consistent data contracts across packages

## Installation

```bash
npm install @notes-sync/shared
```

## Usage

```typescript
import { ApiClient } from '@notes-sync/shared';

// Create client instance
const client = new ApiClient('http://localhost:3127');

// Use client methods
const status = await client.getStatus();
console.log(`Service running: ${status.running}`);

// Add note or todo
await client.addNote('Meeting notes from today');
await client.addTodo('Follow up with team');

// Search notes
const results = await client.searchNotes({ query: 'meeting', daysBack: 7 });
```

## Types

```typescript
// Use shared types in your code
import { ServiceStatus, SearchNotesResponse } from '@notes-sync/shared';
```

## Documentation

For full documentation, visit the [Notes Sync GitHub repository](https://github.com/yourusername/notes-sync).

## License

MIT
