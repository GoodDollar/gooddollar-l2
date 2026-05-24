import { spawnSync } from 'child_process';
import path from 'path';
import express from 'express';
import {
  resolveRuntime,
  checkRealTradingFence,
  REAL_TRADING_FENCE_MESSAGE,
  REAL_TRADING_FENCE_EXIT_CODE,
} from '../runtime';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';
import { SourceStatus } from '../types';

const ENV_KEYS = ['ETORO_MODE', 'REAL_TRADING_ENABLED', 'PRICE_SERVICE_NETWORK'] as const;

function snapshotEnv(): Record<(typeof ENV_KEYS)[number], string | undefined> {
  return {
    ETORO_MODE: process.env.ETORO_MODE,
    REAL_TRADING_ENABLED: process.env.REAL_TRADING_ENABLED,
    PRICE_SERVICE_NETWORK: process.env.PRICE_SERVICE_NETWORK,
  };
}

function restoreEnv(snap: ReturnType<typeof snapshotEnv>): void {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

const NOW = 1700000000000;
const NOW_ISO = '2023-11-14T22:13:20.000Z';

describe('resolveRuntime — env permutations (task 0055)', () => {
  let envSnap: ReturnType<typeof snapshotEnv>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    for (const k of ENV_KEYS) delete process.env[k];
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it('all env vars unset → defaults: sandbox / false / testnet', () => {
    const status: SourceStatus = {
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    };
    const out = resolveRuntime(NOW, status);
    expect(out.etoroMode).toBe('sandbox');
    expect(out.realTradingEnabled).toBe(false);
    expect(out.network).toBe('testnet');
    expect(out.fixtureOnly).toBe(true);
    expect(out.configuredAtMs).toBe(NOW);
    expect(out.configuredAtIso).toBe(NOW_ISO);
  });

  it('ETORO_MODE=demo overrides default', () => {
    process.env.ETORO_MODE = 'demo';
    const out = resolveRuntime(NOW, {
      connected: false,
      reason: 'not-attached',
      lastAttachAt: null,
    });
    expect(out.etoroMode).toBe('demo');
  });

  it('ETORO_MODE=sandbox explicit also reads through', () => {
    process.env.ETORO_MODE = 'sandbox';
    const out = resolveRuntime(NOW, {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: NOW,
    });
    expect(out.etoroMode).toBe('sandbox');
  });

  it('PRICE_SERVICE_NETWORK overrides default testnet', () => {
    process.env.PRICE_SERVICE_NETWORK = 'localnet';
    const out = resolveRuntime(NOW, {
      connected: false,
      reason: 'not-attached',
      lastAttachAt: null,
    });
    expect(out.network).toBe('localnet');
  });

  it('fixtureOnly is false when source is connected', () => {
    const out = resolveRuntime(NOW, {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: NOW,
    });
    expect(out.fixtureOnly).toBe(false);
  });

  it('fixtureOnly is true on every disconnected branch', () => {
    const reasons = ['not-attached', 'etoro-client-not-installed', 'source-unavailable'];
    for (const reason of reasons) {
      const out = resolveRuntime(NOW, {
        connected: false,
        reason,
        lastAttachAt: null,
      });
      expect(out.fixtureOnly).toBe(true);
    }
  });

  it('REAL_TRADING_ENABLED=true round-trips on the wire (boot fence is separate concern)', () => {
    process.env.REAL_TRADING_ENABLED = 'true';
    const out = resolveRuntime(NOW, {
      connected: false,
      reason: 'not-attached',
      lastAttachAt: null,
    });
    expect(out.realTradingEnabled).toBe(true);
  });

  it('REAL_TRADING_ENABLED=false / unset / "1" all map to false (strict equality)', () => {
    for (const v of [undefined, 'false', '1', 'TRUE', 'yes']) {
      if (v === undefined) delete process.env.REAL_TRADING_ENABLED;
      else process.env.REAL_TRADING_ENABLED = v;
      const out = resolveRuntime(NOW, {
        connected: false,
        reason: 'not-attached',
        lastAttachAt: null,
      });
      expect(out.realTradingEnabled).toBe(false);
    }
  });
});

describe('checkRealTradingFence (task 0055)', () => {
  it('returns null when env var is unset', () => {
    expect(checkRealTradingFence({})).toBeNull();
  });

  it('returns null when env var is "false"', () => {
    expect(checkRealTradingFence({ REAL_TRADING_ENABLED: 'false' })).toBeNull();
  });

  it('returns null when env var is "1" (strict equality on "true")', () => {
    expect(checkRealTradingFence({ REAL_TRADING_ENABLED: '1' })).toBeNull();
    expect(checkRealTradingFence({ REAL_TRADING_ENABLED: 'TRUE' })).toBeNull();
    expect(checkRealTradingFence({ REAL_TRADING_ENABLED: 'yes' })).toBeNull();
  });

  it('returns a fatal payload when env var is exactly "true"', () => {
    const out = checkRealTradingFence({ REAL_TRADING_ENABLED: 'true' });
    expect(out).not.toBeNull();
    expect(out!.fatal).toBe(true);
    expect(out!.message).toBe(REAL_TRADING_FENCE_MESSAGE);
    expect(out!.exitCode).toBe(REAL_TRADING_FENCE_EXIT_CODE);
    expect(out!.exitCode).toBe(78);
  });
});

async function listen(app: express.Express): Promise<{
  server: import('http').Server;
  baseUrl: string;
}> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.on('listening', () => resolve()));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function close(s: import('http').Server): Promise<void> {
  await new Promise<void>((resolve) => s.close(() => resolve()));
}

describe('runtime block on / and /health (task 0055)', () => {
  let envSnap: ReturnType<typeof snapshotEnv>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    for (const k of ENV_KEYS) delete process.env[k];
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  function makeApp(srcStatus: SourceStatus, runtimeNow: number = NOW): express.Express {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    return createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => srcStatus,
      undefined,
      undefined,
      undefined,
      () => resolveRuntime(runtimeNow, srcStatus),
    );
  }

  it.each(['/', '/health'])('%s body carries the runtime block with all keys', async (path) => {
    const app = makeApp({
      connected: false,
      reason: 'etoro-client-not-installed',
      lastAttachAt: null,
    });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}${path}`)).json()) as Record<string, unknown>;
      const r = body.runtime as Record<string, unknown> | undefined;
      expect(r).toBeDefined();
      expect(r!.etoroMode).toBe('sandbox');
      expect(r!.realTradingEnabled).toBe(false);
      expect(r!.network).toBe('testnet');
      expect(r!.fixtureOnly).toBe(true);
      expect(r!.configuredAtMs).toBe(NOW);
      expect(r!.configuredAtIso).toBe(NOW_ISO);
    } finally {
      await close(server);
    }
  });

  it('runtime is omitted when no runtimeGetter is wired (back-compat fixture path)', async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    const { server, baseUrl } = await listen(app);
    try {
      const root = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const health = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, unknown>;
      expect('runtime' in root).toBe(false);
      expect('runtime' in health).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('fixtureOnly flips on the wire when source attaches', async () => {
    const status: SourceStatus = {
      connected: false,
      reason: 'not-attached',
      lastAttachAt: null,
    };
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => status,
      undefined,
      undefined,
      undefined,
      () => resolveRuntime(NOW, status),
    );
    const { server, baseUrl } = await listen(app);
    try {
      let body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      let r = body.runtime as Record<string, unknown>;
      expect(r.fixtureOnly).toBe(true);

      // Mutate the closure-captured status (the app reads the same
      // reference via the closure, mirroring how PriceService wires it).
      Object.assign(status, {
        connected: true,
        symbols: ['AAPL'],
        lastAttachAt: NOW,
      });
      body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      r = body.runtime as Record<string, unknown>;
      expect(r.fixtureOnly).toBe(false);
    } finally {
      await close(server);
    }
  });

  it('runtime block field ordering: etoroMode, realTradingEnabled, network, fixtureOnly, configuredAtMs, configuredAtIso', async () => {
    const app = makeApp({
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: NOW,
    });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/health`)).json()) as Record<string, unknown>;
      const keys = Object.keys(body.runtime as Record<string, unknown>);
      expect(keys).toEqual([
        'etoroMode',
        'realTradingEnabled',
        'network',
        'fixtureOnly',
        'configuredAtMs',
        'configuredAtIso',
      ]);
    } finally {
      await close(server);
    }
  });

  it('catalog responseShape for / and /health advertises runtime', async () => {
    const app = makeApp({
      connected: false,
      reason: 'not-attached',
      lastAttachAt: null,
    });
    const { server, baseUrl } = await listen(app);
    try {
      const body = (await (await fetch(`${baseUrl}/`)).json()) as Record<string, unknown>;
      const eps = body.endpoints as Array<{ path: string; responseShape: string }>;
      const root = eps.find((e) => e.path === '/');
      const health = eps.find((e) => e.path === '/health');
      expect(root).toBeDefined();
      expect(health).toBeDefined();
      expect(root!.responseShape).toMatch(/runtime/);
      expect(health!.responseShape).toMatch(/runtime/);
      expect(root!.responseShape.length).toBeLessThanOrEqual(240);
      expect(health!.responseShape.length).toBeLessThanOrEqual(240);
    } finally {
      await close(server);
    }
  });
});

/**
 * Boot-time refusal: spawn the binary with REAL_TRADING_ENABLED=true
 * and assert exit code 78 + the FATAL stderr line. Distinct from the
 * pure-function `checkRealTradingFence` test above so a future
 * refactor that moves the fence has to update both — the pure check
 * AND the actual `index.ts` boot path.
 *
 * Spawn `ts-node src/index.ts` so the test always exercises the
 * current source (no dist staleness coupling); ts-node is a dev
 * dependency on this package and runs the same code path the
 * production `node dist/index.js` invocation does.
 */
describe('REAL_TRADING_ENABLED=true boot refusal (task 0055)', () => {
  it('spawning src/index.ts with the env var exits 78 and prints the fence message', () => {
    const srcPath = path.resolve(__dirname, '..', 'index.ts');
    const result = spawnSync(
      'npx',
      ['--yes', 'ts-node', '--transpile-only', srcPath],
      {
        env: { ...process.env, REAL_TRADING_ENABLED: 'true' },
        encoding: 'utf8',
        timeout: 15000,
      },
    );
    expect(result.status).toBe(REAL_TRADING_FENCE_EXIT_CODE);
    expect(result.stderr).toContain(REAL_TRADING_FENCE_MESSAGE);
  });
});
