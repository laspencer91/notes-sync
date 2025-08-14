# @notes-sync/cli

Command-line interface for Notes Sync - AI-powered note synchronization with Git backup.

## Overview

This CLI tool allows you to:
- Add notes and todos from anywhere in your terminal
- Search through your notes with context
- Manage todos (complete, delete, archive)
- Format and organize your notes
- Create daily sections with AI-generated quotes
- Sync your notes to Git automatically

## Installation

```bash
# Install CLI globally
npm install -g @notes-sync/cli

# The CLI will guide you through service setup
notes-sync status
```

## Key Commands

```bash
# Service management
notes-sync status            # Check service status
notes-sync install           # Install background service
notes-sync stop              # Stop the service
notes-sync upgrade           # Upgrade CLI and service

# Content management
notes-sync add -n "New note" # Add note
notes-sync add -t "New todo" # Add todo
notes-sync search "query"    # Search notes
notes-sync view --today      # View today's notes

# Todo management
notes-sync mark-complete     # Mark todos as done (interactive)
notes-sync delete            # Delete todos (interactive)
notes-sync incomplete-todos  # Show pending todos

# Document management
notes-sync format            # Clean up formatting
notes-sync daily --create    # Create today's section
```

## AI Integration

```bash
# Ask AI about your notes
notes-sync ai query "What should I focus on next?"
notes-sync ai query --week "How productive was I?"
```

## Documentation

For full documentation, visit the [Notes Sync GitHub repository](https://github.com/yourusername/notes-sync).

## License

MIT
