import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const ROOT_SCRIPT = path.join(REPO_ROOT, 'scripts', 'rotate-etoro-keys.sh');
const PKG_SCRIPT = path.join(
  REPO_ROOT,
  'backend',
  'etoro-client',
  'scripts',
  'rotate-etoro-keys.sh',
);
const VERIFY_SCRIPT = path.join(
  REPO_ROOT,
  'backend',
  'etoro-client',
  'scripts',
  'verify-credentials.ts',
);
const ETORO_PKG = path.join(REPO_ROOT, 'backend', 'etoro-client');

const FIXTURE_ENV =
  [
    '# Lane 1 — eToro SDK',
    '# ETORO_MODE=demo-readonly',
    'ETORO_DEMO_KEY=old-key',
    'ETORO_DEMO_SECRET=old-secret',
    'ETORO_DEMO_USER_KEY=old-user',
    '',
    '# Unrelated chain block',
    'PRIVATE_KEY=',
    '# RPC_URL=http://localhost:8545',
  ].join('\n') + '\n';

interface RunOpts {
  scriptPath: string;
  args: string[];
  stdin?: string;
  fixture?: string;
}

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
  envBefore: Buffer;
  envAfter: Buffer;
  envText: string;
  auditText: string;
  cwd: string;
}

function freshTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rotate-etoro-keys-'));
}

function runScript(opts: RunOpts): RunResult {
  const cwd = freshTmpDir();
  const envFile = path.join(cwd, '.env');
  const auditFile = path.join(cwd, 'audit.log');
  fs.writeFileSync(envFile, opts.fixture ?? FIXTURE_ENV);
  const envBefore = fs.readFileSync(envFile);

  const result = spawnSync('bash', [opts.scriptPath, ...opts.args], {
    cwd,
    input: opts.stdin ?? '',
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? cwd,
      ENV_FILE: envFile,
      ROTATE_AUDIT_LOG: auditFile,
      ROTATE_SKIP_PM2: '1',
    },
  });

  const envAfter = fs.readFileSync(envFile);
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    envBefore,
    envAfter,
    envText: envAfter.toString('utf8'),
    auditText: fs.existsSync(auditFile) ? fs.readFileSync(auditFile, 'utf8') : '',
    cwd,
  };
}

describe('rotate-etoro-keys.sh — refusal paths (no .env / audit writes)', () => {
  it('exits 2 on "real" and leaves .env / audit.log untouched', () => {
    const r = runScript({ scriptPath: ROOT_SCRIPT, args: ['real'] });
    expect(r.status).toBe(2);
    expect(r.envAfter.equals(r.envBefore)).toBe(true);
    expect(r.auditText).toBe('');
    expect(r.stderr).toMatch(/real/i);
    expect(r.stderr).toMatch(/REAL_TRADING_ENABLED|spec\.md/);
  });

  it('exits 2 on legacy "sandbox" arg and leaves .env / audit.log untouched', () => {
    const r = runScript({ scriptPath: ROOT_SCRIPT, args: ['sandbox'] });
    expect(r.status).toBe(2);
    expect(r.envAfter.equals(r.envBefore)).toBe(true);
    expect(r.auditText).toBe('');
    expect(r.stderr).toMatch(/sandbox/);
  });

  it('exits 2 on unknown arg', () => {
    const r = runScript({ scriptPath: ROOT_SCRIPT, args: ['prod'] });
    expect(r.status).toBe(2);
    expect(r.envAfter.equals(r.envBefore)).toBe(true);
  });

  it('exits 2 with usage when no arg passed', () => {
    const r = runScript({ scriptPath: ROOT_SCRIPT, args: [] });
    expect(r.status).toBe(2);
    expect(r.envAfter.equals(r.envBefore)).toBe(true);
    expect(r.stderr).toMatch(/usage/i);
  });
});

describe('rotate-etoro-keys.sh — demo rotation', () => {
  it('rotates ETORO_DEMO_KEY and ETORO_DEMO_SECRET; user key untouched when blank', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'new-key-123\nnew-secret-456\n\n',
    });
    expect(r.status).toBe(0);
    expect(r.envText).toMatch(/^ETORO_DEMO_KEY=new-key-123$/m);
    expect(r.envText).toMatch(/^ETORO_DEMO_SECRET=new-secret-456$/m);
    expect(r.envText).toMatch(/^ETORO_DEMO_USER_KEY=old-user$/m);
    expect(r.envText).toMatch(/^PRIVATE_KEY=$/m);
  });

  it('rotates all three vars when user key is supplied', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'k1\ns1\nu1\n',
    });
    expect(r.status).toBe(0);
    expect(r.envText).toMatch(/^ETORO_DEMO_KEY=k1$/m);
    expect(r.envText).toMatch(/^ETORO_DEMO_SECRET=s1$/m);
    expect(r.envText).toMatch(/^ETORO_DEMO_USER_KEY=u1$/m);
  });

  it('uncomments commented placeholder entries (fresh .env from .env.example)', () => {
    const commentedFixture =
      [
        '# ETORO_DEMO_KEY=',
        '# ETORO_DEMO_SECRET=',
        '# ETORO_DEMO_USER_KEY=',
        'PRIVATE_KEY=',
      ].join('\n') + '\n';
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'fresh-key\nfresh-secret\nfresh-user\n',
      fixture: commentedFixture,
    });
    expect(r.status).toBe(0);
    expect(r.envText).toMatch(/^ETORO_DEMO_KEY=fresh-key$/m);
    expect(r.envText).toMatch(/^ETORO_DEMO_SECRET=fresh-secret$/m);
    expect(r.envText).toMatch(/^ETORO_DEMO_USER_KEY=fresh-user$/m);
    expect(r.envText).not.toMatch(/^# ETORO_DEMO_KEY/m);
    expect(r.envText).toMatch(/^PRIVATE_KEY=$/m);
  });

  it('writes one JSON audit entry naming the rotated demo vars (key+secret only)', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'k\ns\n\n',
    });
    const lines = r.auditText.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]);
    expect(entry.action).toBe('key_rotation');
    expect(entry.mode).toBe('demo');
    expect(entry.vars).toEqual(['ETORO_DEMO_KEY', 'ETORO_DEMO_SECRET']);
    expect(typeof entry.timestamp).toBe('string');
    expect(entry.newKeyRedacted).toBeDefined();
  });

  it('audit entry names all three vars when user key is rotated', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'k\ns\nu\n',
    });
    const entry = JSON.parse(r.auditText.trim().split('\n')[0]);
    expect(entry.vars).toEqual([
      'ETORO_DEMO_KEY',
      'ETORO_DEMO_SECRET',
      'ETORO_DEMO_USER_KEY',
    ]);
  });

  it('never writes legacy ETORO_SANDBOX_* or ETORO_REAL_* keys', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'k\ns\nu\n',
    });
    expect(r.envText).not.toMatch(/ETORO_SANDBOX/);
    expect(r.envText).not.toMatch(/ETORO_REAL/);
    expect(r.auditText).not.toMatch(/ETORO_SANDBOX/);
    expect(r.auditText).not.toMatch(/ETORO_REAL/);
  });

  it('writes a timestamped backup alongside the env file', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'k\ns\n\n',
    });
    const backups = fs.readdirSync(r.cwd).filter((f) => f.startsWith('.env.bak.'));
    expect(backups.length).toBeGreaterThan(0);
    expect(fs.readFileSync(path.join(r.cwd, backups[0]), 'utf8')).toBe(FIXTURE_ENV);
  });

  it('refuses an empty key', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: '\n',
    });
    expect(r.status).toBe(2);
    expect(r.envAfter.equals(r.envBefore)).toBe(true);
    expect(r.auditText).toBe('');
  });

  it('refuses an empty secret', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'k\n\n',
    });
    expect(r.status).toBe(2);
    expect(r.envAfter.equals(r.envBefore)).toBe(true);
    expect(r.auditText).toBe('');
  });

  it('prints a verification command pointing at verify-credentials', () => {
    const r = runScript({
      scriptPath: ROOT_SCRIPT,
      args: ['demo'],
      stdin: 'k\ns\n\n',
    });
    expect(r.stdout).toMatch(/verify-credentials/);
  });
});

describe('rotate-etoro-keys.sh — per-package delegate', () => {
  it('delegates demo rotation to the root script', () => {
    const r = runScript({
      scriptPath: PKG_SCRIPT,
      args: ['demo'],
      stdin: 'pkg-key\npkg-secret\n\n',
    });
    expect(r.status).toBe(0);
    expect(r.envText).toMatch(/^ETORO_DEMO_KEY=pkg-key$/m);
    expect(r.envText).toMatch(/^ETORO_DEMO_SECRET=pkg-secret$/m);
  });

  it('refuses real via the per-package delegate', () => {
    const r = runScript({ scriptPath: PKG_SCRIPT, args: ['real'] });
    expect(r.status).toBe(2);
    expect(r.envAfter.equals(r.envBefore)).toBe(true);
    expect(r.auditText).toBe('');
  });
});

describe('verify-credentials.ts — post-rotation smoke', () => {
  function runVerify(env: Record<string, string>): {
    status: number | null;
    stdout: string;
    stderr: string;
  } {
    const r = spawnSync('node', ['-r', 'ts-node/register', VERIFY_SCRIPT], {
      cwd: ETORO_PKG,
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH ?? '',
        HOME: process.env.HOME ?? '',
        ...env,
      },
    });
    return { status: r.status, stdout: r.stdout, stderr: r.stderr };
  }

  it('exits 0 when demo creds resolve cleanly', () => {
    const r = runVerify({
      ETORO_MODE: 'demo-readonly',
      ETORO_DEMO_KEY: 'k',
      ETORO_DEMO_SECRET: 's',
      ETORO_DEMO_USER_KEY: 'u',
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/mode=demo-readonly/);
  });

  it('exits 2 when mode is mock', () => {
    const r = runVerify({ ETORO_MODE: 'mock' });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/mock/);
  });

  it('exits 2 when demo creds are missing', () => {
    const r = runVerify({ ETORO_MODE: 'demo-readonly' });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/ETORO_DEMO_KEY|credentials/i);
  });
});
