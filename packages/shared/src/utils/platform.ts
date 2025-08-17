import * as os from 'os';
import * as path from 'path';

/**
 * Platform detection utilities and path helpers for cross-platform compatibility
 */
export class Platform {
  /**
   * Check if the current platform is Windows
   */
  static isWindows(): boolean {
    return process.platform === 'win32';
  }

  /**
   * Check if the current platform is macOS
   */
  static isMacOS(): boolean {
    return process.platform === 'darwin';
  }

  /**
   * Check if the current platform is Linux
   */
  static isLinux(): boolean {
    return process.platform === 'linux';
  }

  /**
   * Gets the appropriate home directory path for the current platform
   */
  static getHomeDir(): string {
    return os.homedir();
  }

  /**
   * Gets the appropriate config directory for the current platform
   * macOS/Linux: ~/.config/notes-sync
   * Windows: %APPDATA%\notes-sync
   */
  static getConfigDir(): string {
    if (this.isWindows()) {
      return path.join(process.env.APPDATA || '', 'notes-sync');
    }
    return path.join(this.getHomeDir(), '.config', 'notes-sync');
  }

  /**
   * Gets the default documents directory for the current platform
   * macOS/Linux: ~/Documents
   * Windows: %USERPROFILE%\Documents
   */
  static getDefaultDocumentsDir(): string {
    return path.join(this.getHomeDir(), 'Documents');
  }

  /**
   * Gets the default notes directory path
   */
  static getDefaultNotesDir(): string {
    return path.join(this.getDefaultDocumentsDir(), 'DailyNotes');
  }

  /**
   * Normalizes a path string based on the current platform
   */
  static normalizePath(pathStr: string): string {
    // Replace ~ with home directory
    if (pathStr.startsWith('~')) {
      pathStr = path.join(this.getHomeDir(), pathStr.substring(1));
    }

    return path.normalize(pathStr);
  }
}
