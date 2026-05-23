import http from 'http';
import express from 'express';
import { createServer, hostnameFromHostHeader } from '../server';
import { QuoteCache } from '../quote-cache';

function listen(app: express.Express): Promise<{
  server: ReturnType<express.Express['listen']>;
  baseUrl: string;
  port: number;
}> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address() as import('net').AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}`, port: addr.port });
    });
  });
}

describe('REST Server — websocket discoverability when getter wired', () => {
  let cache: QuoteCache;
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let port: number;

  beforeAll(async () => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(
      cache,
      { symbols: ['AAPL'] },
      undefined,
      undefined,
      undefined,
      () => ({ port: 9301 }),
    );
    ({ server, baseUrl, port } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET / includes websocket block when wsAddressGetter is wired', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as Record<string, unknown>;
    const ws = body.websocket as Record<string, unknown>;
    expect(typeof ws).toBe('object');
    expect(typeof ws.url).toBe('string');
    expect((ws.url as string).startsWith('ws://')).toBe(true);
    expect(ws.port).toBe(9301);
    expect(ws.frames).toEqual(['snapshot', 'quote']);
    expect(typeof ws.snapshot).toBe('string');
    expect((ws.snapshot as string).length).toBeGreaterThan(0);
    expect(typeof ws.quote).toBe('string');
    expect((ws.quote as string).length).toBeGreaterThan(0);
  });

  it('GET /health includes the same websocket block', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    const ws = body.websocket as Record<string, unknown>;
    expect(typeof ws).toBe('object');
    expect((ws.url as string).startsWith('ws://')).toBe(true);
    expect(ws.port).toBe(9301);
    expect(ws.frames).toEqual(['snapshot', 'quote']);
  });

  it('GET /no-such-path 404 endpoints array includes ws://<host>:<wsPort>', async () => {
    const res = await fetch(`${baseUrl}/no-such-path`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { endpoints: unknown[] };
    const wsEntry = body.endpoints.find((e) => {
      if (typeof e === 'string') return /^ws:\/\/[^/]+:9301$/.test(e);
      if (e && typeof e === 'object' && 'path' in e) {
        const path = (e as { path: unknown }).path;
        return typeof path === 'string' && /^ws:\/\/[^/]+:9301$/.test(path);
      }
      return false;
    });
    expect(wsEntry).toBeDefined();
  });

  it('websocket.url uses req.get("host") for the hostname, not a hardcoded localhost', async () => {
    const body = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          method: 'GET',
          path: '/',
          headers: { host: 'example.test' },
        },
        (res) => {
          let buf = '';
          res.on('data', (chunk) => (buf += chunk));
          res.on('end', () => resolve(JSON.parse(buf) as Record<string, unknown>));
        },
      );
      req.on('error', reject);
      req.end();
    });
    const ws = body.websocket as Record<string, unknown>;
    expect(ws.url).toBe('ws://example.test:9301');
  });
});

describe('REST Server — websocket block omitted when getter absent', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    ({ server, baseUrl } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET / omits websocket block cleanly when wsAddressGetter is undefined', async () => {
    const res = await fetch(`${baseUrl}/`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(body, 'websocket')).toBe(false);
  });

  it('GET /health omits websocket block cleanly when wsAddressGetter is undefined', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(body, 'websocket')).toBe(false);
  });

  it('GET /no-such-path 404 endpoints array omits ws:// entry', async () => {
    const res = await fetch(`${baseUrl}/no-such-path`);
    const body = (await res.json()) as { endpoints: unknown[] };
    const hasWs = body.endpoints.some((e) => {
      if (typeof e === 'string') return e.startsWith('ws://');
      if (e && typeof e === 'object' && 'path' in e) {
        const path = (e as { path: unknown }).path;
        return typeof path === 'string' && path.startsWith('ws://');
      }
      return false;
    });
    expect(hasWs).toBe(false);
  });
});

describe('hostnameFromHostHeader', () => {
  it('returns localhost when header missing or empty', () => {
    expect(hostnameFromHostHeader(undefined)).toBe('localhost');
    expect(hostnameFromHostHeader('')).toBe('localhost');
  });

  it('returns the bare hostname when no port present', () => {
    expect(hostnameFromHostHeader('localhost')).toBe('localhost');
    expect(hostnameFromHostHeader('example.com')).toBe('example.com');
  });

  it('strips the trailing :port when present', () => {
    expect(hostnameFromHostHeader('localhost:3122')).toBe('localhost');
    expect(hostnameFromHostHeader('example.com:9300')).toBe('example.com');
  });

  it('preserves bracketed IPv6 literals', () => {
    expect(hostnameFromHostHeader('[::1]:3122')).toBe('[::1]');
    expect(hostnameFromHostHeader('[::1]')).toBe('[::1]');
  });
});
