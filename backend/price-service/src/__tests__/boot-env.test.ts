/**
 * Integration smoke for the boot-time port env contract.
 *
 * Spawns `node dist/index.js` with PRICE_SERVICE_PORT /
 * PRICE_SERVICE_WS_PORT overrides and asserts:
 *
 *   1. Valid override → REST server binds on the override port and
 *      `/health` returns 200 (or any 5xx — the assertion is on the
 *      bind, not the body shape).
 *   2. Invalid override → process exits non-zero with a stderr
 *      message naming the offending env var.
 *
 * Skipped at runtime when `dist/index.js` is missing (e.g. on a fresh
 * clone where `npm run build` has not run yet). In CI, the lane-1
 * install/test scripts always build dist/ first, so the spawn path
 * is exercised end-to-end.
 */
import { spawn, type ChildProcess } from 'child_process';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const DIST_ENTRY = path.resolve(__dirname, '..', '..', 'dist', 'index.js');
const BOOT_TIMEOUT_MS = 5_000;
const POLL_INTERVAL_MS = 100;

const distExists = fs.existsSync(DIST_ENTRY);
const describeIfBuilt = distExists ? describe : describe.skip;

if (!distExists) {
  // Surface a clear reason in test logs; this path is only hit on a
  // dev box where `npm run build` was not run before `npm test`.
  // eslint-disable-next-line no-console
  console.warn(
    `[boot-env.test] skipping spawn smoke — ${DIST_ENTRY} missing. ` +
      `Run \`npm run build\` (or \`bash scripts/build-lane1-backend.sh\`) first.`,
  );
}

function spawnService(env: NodeJS.ProcessEnv): ChildProcess {
  return spawn(process.execPath, [DIST_ENTRY], {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function probeHealth(port: number, deadlineMs: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const req = http.get(
        { hostname: '127.0.0.1', port, path: '/health', timeout: 500 },
        (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        },
      );
      req.on('error', () => {
        if (Date.now() - start >= deadlineMs) {
          reject(new Error(`/health on :${port} did not respond within ${deadlineMs}ms`));
          return;
        }
        setTimeout(tick, POLL_INTERVAL_MS);
      });
      req.on('timeout', () => req.destroy());
    };
    tick();
  });
}

function killChild(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
    }, 1_000);
  });
}

describeIfBuilt('price-service boot — env-overridden ports', () => {
  let child: ChildProcess | undefined;

  afterEach(async () => {
    if (child) {
      await killChild(child);
      child = undefined;
    }
  });

  it('binds REST on PRICE_SERVICE_PORT when set', async () => {
    child = spawnService({
      ETORO_MODE: 'mock',
      PRICE_SERVICE_PORT: '9410',
      PRICE_SERVICE_WS_PORT: '9411',
    });
    const status = await probeHealth(9410, BOOT_TIMEOUT_MS);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(600);
  }, BOOT_TIMEOUT_MS + 5_000);

  it('exits non-zero with a clear message when PRICE_SERVICE_PORT is invalid', async () => {
    const proc = spawnService({
      ETORO_MODE: 'mock',
      PRICE_SERVICE_PORT: 'abc',
    });
    child = proc;
    let stderr = '';
    proc.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    const code = await new Promise<number | null>((resolve) => {
      proc.once('exit', (c) => resolve(c));
    });
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/PRICE_SERVICE_PORT/);
    expect(stderr).toMatch(/must be 1\.\.65535/);
  }, BOOT_TIMEOUT_MS + 5_000);
});
