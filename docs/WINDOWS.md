# Notes Sync for Windows

This guide provides Windows-specific information for using Notes Sync.

## Installation

Install Notes Sync globally using npm:

```batch
npm install -g @notes-sync/cli
```

Then run the setup wizard:

```batch
notes-sync install
```

## Configuration

Your Notes Sync configuration is stored at:

```
%APPDATA%\notes-sync\config.json
```

## Windows Service

Notes Sync runs as a Windows service using the `node-windows` package. This allows it to:

- Start automatically when you log in
- Run in the background without a console window
- Continue syncing even when you're not actively using the CLI

### Service Management

You can manage the service using these commands:

```batch
notes-sync status        # Check if the service is running
notes-sync stop          # Stop the service
notes-sync start         # Start the service
```

### Troubleshooting

If you encounter issues with the Windows service:

1. Check service status in Windows Services app
   - Press Win+R, type `services.msc` and press Enter
   - Look for "Notes Sync Service"

2. View service logs
   - Check `%APPDATA%\notes-sync\logs\` for service logs
   - Run `notes-sync logs` to view recent logs

3. Reinstall the service
   ```batch
   notes-sync-service uninstall
   notes-sync-service install
   ```

## Uninstallation

To completely remove Notes Sync from your Windows system:

```batch
notes-sync stop
notes-sync-service uninstall
npm uninstall -g @notes-sync/cli @notes-sync/service
rd /s /q %APPDATA%\notes-sync
```

## Known Windows Issues

- **File Locking**: Some Windows applications may lock files while editing, which could temporarily prevent syncing. The service will retry automatically.

- **Path Length**: Windows has a 260 character path length limit. Avoid deeply nested directory structures for your notes.

## Recommended Windows Markdown Editors

- [Typora](https://typora.io/) (Recommended)
- [Visual Studio Code](https://code.visualstudio.com/) with Markdown Preview
- [MarkText](https://marktext.app/)
- [Obsidian](https://obsidian.md/) (Use in single file mode)
