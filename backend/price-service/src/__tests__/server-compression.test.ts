import express from 'express';
import zlib from 'zlib';
import http from 'http';
import { createServer } from '../server';
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

/**
 * Issue a raw HTTP GET that does NOT auto-decompress, so the test can
 * inspect the on-the-wire bytes (gzip framing, Content-Length,
 * Content-Encoding) directly. Node's stock `fetch` and `request`
 * APIs both transparently un-gzip when `accept-encoding` is set,
 * which would defeat the wire-shape assertions below.
 */
function rawGet(
  port: number,
  path: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path, method: 'GET', headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === 'string') flat[k.toLowerCase()] = v;
            else if (Array.isArray(v)) flat[k.toLowerCase()] = v.join(',');
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: flat,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/**
 * Compression turns the price-service into a polite citizen of every
 * pipe it shares with a poller: load balancers, oracle-signer, the
 * proof page on cellular. Fewer bytes per liveness probe, fewer
 * paid-egress dollars, more battery for mobile clients. The fix is
 * one `app.use(compression({...}))` call; these tests pin the wire
 * contract so a future middleware reorder can't silently drop it.
 * See task 0068.
 */
describe('Compression middleware on every JSON response (task 0068)', () => {
  let server: ReturnType<express.Express['listen']>;
  let baseUrl: string;
  let port: number;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL', 'TSLA'] });
    ({ server, baseUrl, port } = await listen(app));
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET / with Accept-Encoding: gzip returns Content-Encoding: gzip', async () => {
    const r = await rawGet(port, '/', { 'accept-encoding': 'gzip' });
    expect(r.status).toBe(200);
    expect(r.headers['content-encoding']).toBe('gzip');
  });

  it('gzipped body decompresses byte-identical to the identity body', async () => {
    const gzipped = await rawGet(port, '/', { 'accept-encoding': 'gzip' });
    const identity = await rawGet(port, '/', { 'accept-encoding': 'identity' });
    expect(gzipped.headers['content-encoding']).toBe('gzip');
    expect(identity.headers['content-encoding']).toBeUndefined();

    const decoded = zlib.gunzipSync(gzipped.body).toString('utf8');
    const plain = identity.body.toString('utf8');

    // Both bodies were generated from independent requests, so the
    // per-request `timestamp` and `requestId` fields will differ.
    // Strip them before the structural equality check — the rest of
    // the body must match byte-for-byte.
    const stripPerRequest = (s: string): string =>
      JSON.stringify({
        ...JSON.parse(s),
        timestamp: 0,
        timestampIso: '0',
        requestId: '0',
      });
    expect(stripPerRequest(decoded)).toBe(stripPerRequest(plain));
  });

  it('GET / with Accept-Encoding: identity returns no Content-Encoding', async () => {
    const r = await rawGet(port, '/', { 'accept-encoding': 'identity' });
    expect(r.status).toBe(200);
    expect(r.headers['content-encoding']).toBeUndefined();
  });

  it('GET / with no Accept-Encoding header returns no Content-Encoding', async () => {
    const r = await rawGet(port, '/');
    expect(r.status).toBe(200);
    expect(r.headers['content-encoding']).toBeUndefined();
  });

  it('Vary: Accept-Encoding is set on every response that could have been compressed', async () => {
    const paths = ['/', '/health', '/quotes', '/docs/source-reasons', '/audit/stats'];
    for (const path of paths) {
      const r = await rawGet(port, path);
      expect(r.headers.vary).toBeDefined();
      expect(r.headers.vary?.toLowerCase()).toContain('accept-encoding');
    }
  });

  it('compressed / payload is at least 30% smaller than the identity payload', async () => {
    const gzipped = await rawGet(port, '/', { 'accept-encoding': 'gzip' });
    const identity = await rawGet(port, '/', { 'accept-encoding': 'identity' });
    expect(gzipped.body.length).toBeLessThan(identity.body.length * 0.7);
  });

  it('OPTIONS preflight is not gzipped (no body, threshold-skipped)', async () => {
    const r = await rawGet(port, '/quotes', {
      'accept-encoding': 'gzip',
      origin: 'http://example.test',
      'access-control-request-method': 'GET',
    });
    expect(r.headers['content-encoding']).toBeUndefined();
  });
});
