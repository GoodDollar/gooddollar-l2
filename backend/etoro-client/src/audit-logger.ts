import fs from 'fs';
import os from 'os';
import path from 'path';
import { AuditLogEntry, EtoroMode } from './types';

/**
 * Throttle window for the `console.error` heartbeat that fires when audit
 * writes are failing. Exposed for testing so the throttle window doesn't
 * need to be re-derived from clock values inside tests.
 */
export const AUDIT_CONSOLE_THROTTLE_MS = 60_000;

interface MkdirImpl {
  (dir: string, opts: { recursive: boolean }): void;
}

interface AppendImpl {
  (filePath: string, data: string, encoding: 'utf8'): void;
}

export interface ResolveDefaultLogPathInput {
  env: NodeJS.ProcessEnv;
  cwd: string;
  mode: EtoroMode;
  /** Module location (typically `__dirname`). Used for diagnostics only. */
  baseDir?: string;
  /** Injectable for tests. Defaults to `fs.mkdirSync`. */
  fsLike?: { mkdirSync: MkdirImpl };
}

/**
 * Resolves the audit-log file path used when the operator does not supply
 * an explicit `logPath`. Priority (high to low):
 *
 *   1. `env.ETORO_AUDIT_LOG_PATH`
 *   2. `<cwd>/.etoro-audit/<mode>.log` (skipped if cwd is under any
 *      `node_modules` segment, to avoid writing audit evidence into a
 *      directory that gets wiped on `npm install`)
 *   3. `<os.tmpdir()>/etoro-audit/<mode>.log`
 *
 * Parent directories are created via `mkdirSync({ recursive: true })`. The
 * function is best-effort — if every mkdir fails it still returns the
 * tmpdir candidate so callers have a stable path string to log.
 *
 * `baseDir` is accepted for forward compatibility (operator-friendly
 * diagnostics about where the SDK was loaded from) but is intentionally
 * NEVER used as a write target. Historically the default path was
 * `path.resolve(__dirname, '..', 'audit.log')`, which landed inside
 * `node_modules` for every downstream consumer and made audit evidence
 * invisible.
 */
export function resolveDefaultLogPath(input: ResolveDefaultLogPathInput): string {
  const fsLike = input.fsLike ?? fs;

  const envPath = input.env.ETORO_AUDIT_LOG_PATH?.trim();
  if (envPath) {
    tryMkdir(fsLike, path.dirname(envPath));
    return envPath;
  }

  const cwdCandidate = path.join(input.cwd, '.etoro-audit', `${input.mode}.log`);
  if (!isUnderNodeModules(cwdCandidate) && tryMkdir(fsLike, path.dirname(cwdCandidate))) {
    return cwdCandidate;
  }

  const tmpCandidate = path.join(os.tmpdir(), 'etoro-audit', `${input.mode}.log`);
  tryMkdir(fsLike, path.dirname(tmpCandidate));
  return tmpCandidate;
}

function tryMkdir(fsLike: { mkdirSync: MkdirImpl }, dir: string): boolean {
  try {
    fsLike.mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

function isUnderNodeModules(p: string): boolean {
  return path.resolve(p).split(path.sep).includes('node_modules');
}

export interface AuditLoggerOptions {
  /** Explicit log path. Takes precedence over env / cwd / tmpdir resolution. */
  logPath?: string;
  /** Injectable clock for testing the console.error throttle. */
  clock?: () => number;
  /** Injectable `fs.appendFileSync` for testing write-failure handling. */
  appendImpl?: AppendImpl;
  /** Injectable `console.error` for testing the throttle without spying on globals. */
  consoleErrorImpl?: (message: string) => void;
  /** Injectable `fs.mkdirSync` for path-resolution tests. */
  mkdirImpl?: MkdirImpl;
}

const KEY_LIKE_TOKEN = /[A-Za-z0-9_-]{16,}/g;

function maskTokens(message: string): string {
  return message.replace(KEY_LIKE_TOKEN, '[REDACTED]');
}

function normalizeOptions(opts?: string | AuditLoggerOptions): AuditLoggerOptions {
  if (opts === undefined) return {};
  if (typeof opts === 'string') return { logPath: opts };
  return opts;
}

/**
 * Append-only audit logger for the eToro SDK. Each `log()` call writes one
 * JSON line synchronously. The logger is fail-soft — it never throws — but
 * unlike its previous incarnation it does NOT silently swallow write
 * failures: each failure increments `getWriteFailureCount()`, records the
 * masked error in `getLastWriteError()`, and emits a throttled
 * `console.error` heartbeat (at most one per 60 s) so an operator can spot
 * a wedged disk or read-only mount from stderr alone.
 */
export class AuditLogger {
  private readonly resolvedLogPath: string;
  private readonly mode: EtoroMode;
  private readonly clock: () => number;
  private readonly appendImpl: AppendImpl;
  private readonly consoleErrorImpl: (message: string) => void;
  private writeFailureCount = 0;
  private lastWriteError: string | undefined;
  private lastConsoleErrorAt = Number.NEGATIVE_INFINITY;

  constructor(mode: EtoroMode, opts?: string | AuditLoggerOptions) {
    const options = normalizeOptions(opts);
    this.mode = mode;
    this.clock = options.clock ?? Date.now;
    this.appendImpl = options.appendImpl ?? defaultAppendImpl;
    this.consoleErrorImpl = options.consoleErrorImpl ?? defaultConsoleErrorImpl;

    if (options.logPath) {
      this.resolvedLogPath = options.logPath;
    } else {
      this.resolvedLogPath = resolveDefaultLogPath({
        env: process.env,
        cwd: process.cwd(),
        mode,
        baseDir: __dirname,
        fsLike: options.mkdirImpl ? { mkdirSync: options.mkdirImpl } : undefined,
      });
    }
  }

  log(entry: Omit<AuditLogEntry, 'timestamp' | 'mode'>): void {
    const full: AuditLogEntry = {
      ...entry,
      mode: this.mode,
      timestamp: new Date().toISOString(),
    };

    const line = JSON.stringify(full) + '\n';

    try {
      this.appendImpl(this.resolvedLogPath, line, 'utf8');
    } catch (err: unknown) {
      this.recordWriteFailure(err);
    }
  }

  getResolvedLogPath(): string {
    return this.resolvedLogPath;
  }

  getWriteFailureCount(): number {
    return this.writeFailureCount;
  }

  getLastWriteError(): string | undefined {
    return this.lastWriteError;
  }

  private recordWriteFailure(err: unknown): void {
    this.writeFailureCount += 1;
    const raw = err instanceof Error ? err.message : String(err);
    this.lastWriteError = maskTokens(raw);

    const now = this.clock();
    if (now - this.lastConsoleErrorAt > AUDIT_CONSOLE_THROTTLE_MS) {
      this.lastConsoleErrorAt = now;
      this.consoleErrorImpl(
        `[etoro-audit] write failed (n=${this.writeFailureCount}): ${this.lastWriteError}`,
      );
    }
  }
}

function defaultAppendImpl(filePath: string, data: string, encoding: 'utf8'): void {
  fs.appendFileSync(filePath, data, encoding);
}

function defaultConsoleErrorImpl(message: string): void {
  console.error(message);
}
