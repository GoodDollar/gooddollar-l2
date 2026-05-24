import http from 'http';
import express from 'express';
import {
  createServer,
  resolveAdvertisedHostname,
  DEFAULT_HOSTNAME_ALLOWLIST,
} from '../server';
import { QuoteCache } from '../quote-cache';
import { resolveRuntime } from '../runtime';
import { SourceStatus } from '../types';

function listen(app: express.Express): Promise<{
  server: ReturnType<express.Express['listen']>;
  baseUrl: string;
  port: number;
}> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as import('net').AddressInfo;
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${addr.port}`,
        port: addr.port,
      });
    });
  });
}

async function close(s: import('http').Server): Promise<void> {
  await new Promise<void>((resolve) => s.close(() => resolve()));
}

function withHostHeader(
  port: number,
  hostHeader: string,
  path: string,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method: 'GET',
        path,
        headers: { host: hostHeader },
      },
      (res) => {
        let buf = '';
        res.on('data', (chunk) => (buf += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(buf) as Record<string, unknown>);
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

const ENV_KEYS = [
  'PRICE_SERVICE_PUBLIC_HOSTNAME',
  'PRICE_SERVICE_HOSTNAME_ALLOWLIST',
] as const;

function snapshotEnv(): Record<(typeof ENV_KEYS)[number], string | undefined> {
  return {
    PRICE_SERVICE_PUBLIC_HOSTNAME: process.env.PRICE_SERVICE_PUBLIC_HOSTNAME,
    PRICE_SERVICE_HOSTNAME_ALLOWLIST: process.env.PRICE_SERVICE_HOSTNAME_ALLOWLIST,
  };
}

function restoreEnv(snap: ReturnType<typeof snapshotEnv>): void {
  for (const k of ENV_KEYS) {
    if (snap[k] === undefined) delete process.env[k];
    else process.env[k] = snap[k];
  }
}

describe('resolveAdvertisedHostname pure helper (task 0062)', () => {
  const ALLOWLIST = DEFAULT_HOSTNAME_ALLOWLIST;

  it('env pin wins over any header value (including a malicious one)', () => {
    const out = resolveAdvertisedHostname({
      headerHostname: 'attacker.example.com',
      envPin: 'prices.example.com',
      allowlist: ALLOWLIST,
    });
    expect(out).toEqual({ hostname: 'prices.example.com', source: 'env-pinned' });
  });

  it('env pin wins over an empty header', () => {
    const out = resolveAdvertisedHostname({
      headerHostname: '',
      envPin: 'prices.example.com',
      allowlist: ALLOWLIST,
    });
    expect(out).toEqual({ hostname: 'prices.example.com', source: 'env-pinned' });
  });

  it('header in allowlist (case-insensitive) is preserved with original case', () => {
    const out = resolveAdvertisedHostname({
      headerHostname: 'LocalHost',
      envPin: undefined,
      allowlist: ALLOWLIST,
    });
    expect(out).toEqual({ hostname: 'LocalHost', source: 'host-header' });
  });

  it('header not in allowlist falls back to the first allowlist entry', () => {
    const out = resolveAdvertisedHostname({
      headerHostname: 'attacker.example.com',
      envPin: undefined,
      allowlist: ALLOWLIST,
    });
    expect(out).toEqual({ hostname: 'localhost', source: 'allowlist-default' });
  });

  it.each([
    ['whitespace', 'foo bar baz'],
    ['carriage return', 'foo\rbar'],
    ['newline', 'foo\nbar'],
    ['slash', 'foo/bar'],
    ['tab', 'foo\tbar'],
    ['null byte', 'foo\u0000bar'],
    ['empty', ''],
  ])('rejects invalid hostname (%s) and falls back to allowlist default', (_label, header) => {
    const out = resolveAdvertisedHostname({
      headerHostname: header,
      envPin: undefined,
      allowlist: ALLOWLIST,
    });
    expect(out).toEqual({ hostname: 'localhost', source: 'allowlist-default' });
  });

  it('bracketed IPv6 literal passes the validity gate', () => {
    const out = resolveAdvertisedHostname({
      headerHostname: '[::1]',
      envPin: undefined,
      allowlist: ALLOWLIST,
    });
    expect(out).toEqual({ hostname: '[::1]', source: 'host-header' });
  });

  it('IPv4 literal passes the validity gate', () => {
    const out = resolveAdvertisedHostname({
      headerHostname: '127.0.0.1',
      envPin: undefined,
      allowlist: ALLOWLIST,
    });
    expect(out).toEqual({ hostname: '127.0.0.1', source: 'host-header' });
  });

  it('empty env pin treated as unset (does not produce env-pinned)', () => {
    const out = resolveAdvertisedHostname({
      headerHostname: 'localhost',
      envPin: '',
      allowlist: ALLOWLIST,
    });
    expect(out).toEqual({ hostname: 'localhost', source: 'host-header' });
  });
});

describe('GET / and /health respect the hostname pinning gate (task 0062)', () => {
  let envSnap: ReturnType<typeof snapshotEnv>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    for (const k of ENV_KEYS) delete process.env[k];
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  function makeApp(): express.Express {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const status: SourceStatus = {
      connected: true,
      symbols: ['AAPL'],
      lastAttachAt: 1700000000000,
    };
    return createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      () => status,
      undefined,
      () => ({ port: 9301 }),
      undefined,
      () => resolveRuntime(1700000000000, status),
    );
  }

  it('env pin overrides Host: attacker.example.com on / and /health', async () => {
    process.env.PRICE_SERVICE_PUBLIC_HOSTNAME = 'prices.example.com';
    const app = makeApp();
    const { server, port } = await listen(app);
    try {
      for (const path of ['/', '/health']) {
        const body = await withHostHeader(port, 'attacker.example.com', path);
        const ws = body.websocket as Record<string, unknown>;
        expect(ws.url).toBe('ws://prices.example.com:9301');
        expect(ws.hostnameSource).toBe('env-pinned');
      }
    } finally {
      await close(server);
    }
  });

  it('Host: attacker.example.com with no env pin falls back to allowlist default', async () => {
    const app = makeApp();
    const { server, port } = await listen(app);
    try {
      const body = await withHostHeader(port, 'attacker.example.com', '/health');
      const ws = body.websocket as Record<string, unknown>;
      expect(ws.url).toBe('ws://localhost:9301');
      expect(ws.hostnameSource).toBe('allowlist-default');
    } finally {
      await close(server);
    }
  });

  it('Host: localhost (in default allowlist) preserves the header value', async () => {
    const app = makeApp();
    const { server, port } = await listen(app);
    try {
      const body = await withHostHeader(port, 'localhost', '/health');
      const ws = body.websocket as Record<string, unknown>;
      expect(ws.url).toBe('ws://localhost:9301');
      expect(ws.hostnameSource).toBe('host-header');
    } finally {
      await close(server);
    }
  });

  it('Host: foo bar baz (whitespace) falls back to allowlist default', async () => {
    const app = makeApp();
    const { server, port } = await listen(app);
    try {
      const body = await withHostHeader(port, 'foo bar baz', '/health');
      const ws = body.websocket as Record<string, unknown>;
      expect(ws.url).toBe('ws://localhost:9301');
      expect(ws.hostnameSource).toBe('allowlist-default');
    } finally {
      await close(server);
    }
  });

  it('custom allowlist permits a deploy-specific hostname', async () => {
    process.env.PRICE_SERVICE_HOSTNAME_ALLOWLIST = 'prices.example.com, edge.example.com';
    const app = makeApp();
    const { server, port } = await listen(app);
    try {
      const body = await withHostHeader(port, 'edge.example.com', '/health');
      const ws = body.websocket as Record<string, unknown>;
      expect(ws.url).toBe('ws://edge.example.com:9301');
      expect(ws.hostnameSource).toBe('host-header');
    } finally {
      await close(server);
    }
  });

  it('custom allowlist falls back to its first entry on a miss', async () => {
    process.env.PRICE_SERVICE_HOSTNAME_ALLOWLIST = 'prices.example.com, edge.example.com';
    const app = makeApp();
    const { server, port } = await listen(app);
    try {
      const body = await withHostHeader(port, 'attacker.example.com', '/health');
      const ws = body.websocket as Record<string, unknown>;
      expect(ws.url).toBe('ws://prices.example.com:9301');
      expect(ws.hostnameSource).toBe('allowlist-default');
    } finally {
      await close(server);
    }
  });

  it('catch-all 404 endpoints[] entry also respects the env pin', async () => {
    process.env.PRICE_SERVICE_PUBLIC_HOSTNAME = 'prices.example.com';
    const app = makeApp();
    const { server, port } = await listen(app);
    try {
      const body = await withHostHeader(port, 'attacker.example.com', '/no-such-path');
      const endpoints = body.endpoints as Array<{ path: string; methods: string[] }>;
      const wsEntry = endpoints.find((e) => e.path.startsWith('ws://'));
      expect(wsEntry).toBeDefined();
      expect(wsEntry!.path).toBe('ws://prices.example.com:9301');
    } finally {
      await close(server);
    }
  });

  it('runtime.publicHostname rides on / and /health iff env pin is set', async () => {
    process.env.PRICE_SERVICE_PUBLIC_HOSTNAME = 'prices.example.com';
    const app = makeApp();
    const { server, baseUrl } = await listen(app);
    try {
      for (const path of ['/', '/health']) {
        const res = await fetch(`${baseUrl}${path}`);
        const body = (await res.json()) as Record<string, unknown>;
        const runtime = body.runtime as Record<string, unknown>;
        expect(runtime.publicHostname).toBe('prices.example.com');
      }
    } finally {
      await close(server);
    }
  });

  it('runtime.publicHostname omitted when env pin is unset', async () => {
    const app = makeApp();
    const { server, baseUrl } = await listen(app);
    try {
      for (const path of ['/', '/health']) {
        const res = await fetch(`${baseUrl}${path}`);
        const body = (await res.json()) as Record<string, unknown>;
        const runtime = body.runtime as Record<string, unknown>;
        expect('publicHostname' in runtime).toBe(false);
      }
    } finally {
      await close(server);
    }
  });
});
