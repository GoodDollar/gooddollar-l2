import fs from 'fs';
import os from 'os';
import path from 'path';
import { AuditLogger, resolveDefaultLogPath } from '../audit-logger';
import { EtoroMode } from '../types';

const MODE: EtoroMode = 'demo-trading';

function makeFakeFs(opts: {
  failingDirs?: ReadonlyArray<string>;
} = {}) {
  const failing = new Set(opts.failingDirs ?? []);
  const created: string[] = [];
  return {
    created,
    mkdirSync: (dir: string, _opts: { recursive: boolean }): void => {
      if (failing.has(dir)) {
        const err = new Error(`EACCES: permission denied, mkdir '${dir}'`);
        throw err;
      }
      created.push(dir);
    },
  };
}

describe('resolveDefaultLogPath', () => {
  it('uses ETORO_AUDIT_LOG_PATH when set, in preference to cwd/tmpdir', () => {
    const fsLike = makeFakeFs();
    const resolved = resolveDefaultLogPath({
      env: { ETORO_AUDIT_LOG_PATH: '/var/log/etoro/audit.log' },
      cwd: '/srv/app',
      mode: MODE,
      fsLike,
    });
    expect(resolved).toBe('/var/log/etoro/audit.log');
    expect(fsLike.created).toContain('/var/log/etoro');
  });

  it('ignores blank/whitespace-only ETORO_AUDIT_LOG_PATH and falls through to cwd', () => {
    const fsLike = makeFakeFs();
    const resolved = resolveDefaultLogPath({
      env: { ETORO_AUDIT_LOG_PATH: '   ' },
      cwd: '/srv/app',
      mode: MODE,
      fsLike,
    });
    expect(resolved).toBe(path.join('/srv/app', '.etoro-audit', `${MODE}.log`));
  });

  it('uses cwd/.etoro-audit/<mode>.log when env is unset and cwd is writable', () => {
    const fsLike = makeFakeFs();
    const resolved = resolveDefaultLogPath({
      env: {},
      cwd: '/srv/app',
      mode: MODE,
      fsLike,
    });
    expect(resolved).toBe(path.join('/srv/app', '.etoro-audit', `${MODE}.log`));
    expect(fsLike.created).toContain(path.join('/srv/app', '.etoro-audit'));
  });

  it('falls back to os.tmpdir/etoro-audit/<mode>.log when cwd dir cannot be created', () => {
    const cwdDir = path.join('/srv/app', '.etoro-audit');
    const fsLike = makeFakeFs({ failingDirs: [cwdDir] });
    const resolved = resolveDefaultLogPath({
      env: {},
      cwd: '/srv/app',
      mode: MODE,
      fsLike,
    });
    expect(resolved).toBe(path.join(os.tmpdir(), 'etoro-audit', `${MODE}.log`));
  });

  it('never resolves a default path under any node_modules segment (cwd guard)', () => {
    const fsLike = makeFakeFs();
    const resolved = resolveDefaultLogPath({
      env: {},
      cwd: '/srv/app/node_modules/@goodchain/etoro-client',
      mode: MODE,
      fsLike,
    });
    expect(resolved.split(path.sep)).not.toContain('node_modules');
    expect(resolved).toBe(path.join(os.tmpdir(), 'etoro-audit', `${MODE}.log`));
  });

  it('regression: package loaded from a node_modules layout still resolves under cwd, not __dirname', () => {
    // Simulates the original bug: previously `DEFAULT_LOG_PATH` was
    // derived from `__dirname`, so when this package was consumed by a
    // downstream service the audit log silently landed inside
    // `node_modules/@goodchain/etoro-client/`. The resolver MUST NOT
    // care where the package was loaded from — only the operator's cwd
    // (and the explicit env override) drive the choice.
    const fsLike = makeFakeFs();
    const resolved = resolveDefaultLogPath({
      env: {},
      cwd: '/srv/app',
      mode: MODE,
      fsLike,
    });
    expect(resolved.split(path.sep)).not.toContain('node_modules');
    expect(resolved).toBe(path.join('/srv/app', '.etoro-audit', `${MODE}.log`));
  });

  it('still returns a path even if tmpdir mkdir also fails (best-effort)', () => {
    const cwdDir = path.join('/srv/app', '.etoro-audit');
    const tmpDir = path.join(os.tmpdir(), 'etoro-audit');
    const fsLike = makeFakeFs({ failingDirs: [cwdDir, tmpDir] });
    const resolved = resolveDefaultLogPath({
      env: {},
      cwd: '/srv/app',
      mode: MODE,
      fsLike,
    });
    expect(resolved).toBe(path.join(os.tmpdir(), 'etoro-audit', `${MODE}.log`));
  });
});

describe('AuditLogger — write-failure surface', () => {
  let appendImpl: jest.Mock;
  let consoleErrorImpl: jest.Mock;
  let mkdirImpl: jest.Mock;

  beforeEach(() => {
    appendImpl = jest.fn();
    consoleErrorImpl = jest.fn();
    mkdirImpl = jest.fn();
  });

  function makeLogger(overrides: {
    clock?: () => number;
    logPath?: string;
  } = {}) {
    return new AuditLogger(MODE, {
      logPath: overrides.logPath ?? '/dev/null',
      clock: overrides.clock,
      appendImpl,
      consoleErrorImpl,
      mkdirImpl,
    });
  }

  it('exposes a healthy zero state', () => {
    const logger = makeLogger();
    expect(logger.getWriteFailureCount()).toBe(0);
    expect(logger.getLastWriteError()).toBeUndefined();
    expect(logger.getResolvedLogPath()).toBe('/dev/null');
  });

  it('back-compat: accepts a positional string as the second arg', () => {
    const logger = new AuditLogger(MODE, '/some/path.log');
    expect(logger.getResolvedLogPath()).toBe('/some/path.log');
  });

  it('increments writeFailureCount on each failure and records the last error', () => {
    appendImpl.mockImplementation(() => {
      throw new Error('ENOSPC: no space left on device');
    });
    const logger = makeLogger();
    logger.log({ action: 'request', method: 'GET', path: '/x' });
    logger.log({ action: 'request', method: 'GET', path: '/y' });
    expect(logger.getWriteFailureCount()).toBe(2);
    expect(logger.getLastWriteError()).toContain('ENOSPC');
  });

  it('masks key-shaped tokens (>=16 alphanumerics) in the recorded error', () => {
    appendImpl.mockImplementation(() => {
      throw new Error('EACCES: bad path /home/x/AKIA_thiscouldbeasecret123/audit.log');
    });
    const logger = makeLogger();
    logger.log({ action: 'request', method: 'GET', path: '/x' });
    const err = logger.getLastWriteError();
    expect(err).toBeDefined();
    expect(err).not.toContain('AKIA_thiscouldbeasecret123');
    expect(err).toContain('[REDACTED]');
  });

  it('does NOT throw out of log() when the append fails', () => {
    appendImpl.mockImplementation(() => {
      throw new Error('boom');
    });
    const logger = makeLogger();
    expect(() => logger.log({ action: 'x', method: 'GET', path: '/x' })).not.toThrow();
  });
});

describe('AuditLogger — throttled console.error', () => {
  it('emits exactly one console.error within a 60s window across 10 sequential failures', () => {
    const appendImpl = jest.fn(() => {
      throw new Error('disk fail');
    });
    const consoleErrorImpl = jest.fn();
    let now = 1_700_000_000_000;
    const logger = new AuditLogger(MODE, {
      logPath: '/dev/null',
      clock: () => now,
      appendImpl,
      consoleErrorImpl,
      mkdirImpl: jest.fn(),
    });
    for (let i = 0; i < 10; i++) {
      now += 1_000;
      logger.log({ action: 'request', method: 'GET', path: `/x${i}` });
    }
    expect(logger.getWriteFailureCount()).toBe(10);
    expect(consoleErrorImpl).toHaveBeenCalledTimes(1);
    expect(consoleErrorImpl.mock.calls[0][0]).toMatch(/\[etoro-audit\] write failed \(n=1\): /);
  });

  it('emits a second console.error after the 60s window elapses', () => {
    const appendImpl = jest.fn(() => {
      throw new Error('disk fail');
    });
    const consoleErrorImpl = jest.fn();
    let now = 1_700_000_000_000;
    const logger = new AuditLogger(MODE, {
      logPath: '/dev/null',
      clock: () => now,
      appendImpl,
      consoleErrorImpl,
      mkdirImpl: jest.fn(),
    });
    logger.log({ action: 'request', method: 'GET', path: '/x' });
    now += 60_001;
    logger.log({ action: 'request', method: 'GET', path: '/y' });
    expect(consoleErrorImpl).toHaveBeenCalledTimes(2);
  });
});

describe('AuditLogger — real filesystem smoke', () => {
  it('writes a real audit line and reports failureCount=0', () => {
    const tmpFile = path.join(os.tmpdir(), `audit-logger-smoke-${Date.now()}.log`);
    try {
      const logger = new AuditLogger(MODE, { logPath: tmpFile });
      logger.log({ action: 'smoke', method: 'GET', path: '/smoke' });
      const contents = fs.readFileSync(tmpFile, 'utf8');
      expect(contents).toContain('"action":"smoke"');
      expect(logger.getWriteFailureCount()).toBe(0);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  });
});
