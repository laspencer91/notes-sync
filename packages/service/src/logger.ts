import fs from 'fs';
import path from 'path';
import * as os from 'node:os';

class LoggerClass {
  private logFilePath: string;
  private logStream: fs.WriteStream;

  constructor() {
    const logDir = path.join(os.homedir(), 'Library', 'Logs', 'NotesSync');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.logFilePath = path.join(logDir, 'service.log');

    // Create log file if it doesn't exist
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, '');
    }

    // Create write stream for appending
    this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });

    // Setup shutdown handlers
    this.setupShutdownHandlers();

    this.log('Logger initialized - ' + new Date().toLocaleString());
  }

  private makeTime() {
    const now = new Date();
    return (
      now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) +
      '.' +
      now.getMilliseconds().toString().padStart(3, '0')
    );
  }

  log(msg: string, ...rest: any) {
    const logMessage = `[DEBUG | ${this.makeTime()}] ${msg}`;

    console.log(logMessage, ...rest);
    this.logStream.write(logMessage + '\n');
  }

  error(msg: any, ...rest: any) {
    const logMessage = `[ERROR | ${this.makeTime()}] ${String(msg)}`;

    console.error(logMessage, ...rest);
    this.logStream.write(logMessage + '\n');
  }

  private setupShutdownHandlers() {
    const shutdown = (signal: string) => {
      this.log(`Received ${signal}, shutting down gracefully`);
      this.logStream.write('END ---\n');
      this.logStream.end(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('exit', () => {
      this.logStream.write('END ---\n');
    });
  }
}

export const Logger = new LoggerClass();
