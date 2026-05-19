import fs from 'fs';
import path from 'path';
import { AuditLogEntry, EtoroMode } from './types';

const DEFAULT_LOG_PATH = path.resolve(__dirname, '..', 'audit.log');

export class AuditLogger {
  private readonly logPath: string;
  private readonly mode: EtoroMode;

  constructor(mode: EtoroMode, logPath?: string) {
    this.mode = mode;
    this.logPath = logPath ?? DEFAULT_LOG_PATH;
  }

  log(entry: Omit<AuditLogEntry, 'timestamp' | 'mode'>): void {
    const full: AuditLogEntry = {
      ...entry,
      mode: this.mode,
      timestamp: new Date().toISOString(),
    };

    const line = JSON.stringify(full) + '\n';

    try {
      fs.appendFileSync(this.logPath, line, 'utf8');
    } catch {
      // Silently ignore write failures — audit logging is best-effort
    }
  }
}
