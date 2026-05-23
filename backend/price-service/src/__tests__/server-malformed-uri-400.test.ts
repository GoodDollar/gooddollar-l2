import http from 'http';
import express from 'express';
import { createServer } from '../server';
import { QuoteCache } from '../quote-cache';

interface RawResponse {
  status: number;
  body: string;
}

/**
 * `fetch` and the `URL` constructor pre-encode bare `%` to `%25`, which
 * defeats the test (the server never sees a malformed input). Use raw
 * `http.request` with a manually-set `path` so the test ships the
 * literal malformed sequence on the wire.
 */
function rawGet(path: string, port: number): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path, method: 'GET' },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => resolve({ status: res.statusCode!, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/**
 * Task 0051: malformed percent-encoded paths (`/quotes/AAPL%`, `%G`,
 * `%FF`) hit Express's URL-decode error path with `URIError`/`HttpError`
 * and previously rendered the bare `{error:'bad-request',
 * message:'bad-request'}` envelope — no diagnostic info, no
 * `didYouMean`, no `discovery` pointer.
 *
 * Task 0061 then trimmed off the `endpoints[]` array — the same bloat
 * task 0027 removed from the 404 path — so the malformed-uri 400 now
 * ships only `{error, message, expected, didYouMean?, path, method,
 * discovery, timestamp, timestampIso}`. The `discovery:'/'` pointer
 * stays so an automated client can still find the catalog without
 * the dump being inlined on every reply.
 */
describe('GET /quotes/<malformed-percent> → 400 malformed-uri', () => {
  let server: ReturnType<express.Express['listen']>;
  let port: number;

  beforeAll(async () => {
    const cache = new QuoteCache({ cacheTtlMs: 30_000 });
    const app = createServer(cache, { symbols: ['AAPL'] });
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as import('net').AddressInfo;
        port = addr.port;
        resolve();
      });
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  const CASES: Array<{ input: string; didYouMean: string | undefined }> = [
    { input: '/quotes/AAPL%', didYouMean: '/quotes/AAPL' },
    { input: '/quotes/AAPL%G', didYouMean: '/quotes/AAPL' },
    { input: '/quotes/AAPL%2', didYouMean: '/quotes/AAPL' },
    { input: '/quotes/%FF', didYouMean: undefined },
    { input: '/quotes/%G', didYouMean: undefined },
  ];

  for (const { input, didYouMean } of CASES) {
    it(`${input} → 400 malformed-uri envelope`, async () => {
      const res = await rawGet(input, port);
      expect(res.status).toBe(400);
      const body = JSON.parse(res.body) as Record<string, unknown>;
      expect(body.error).toBe('malformed-uri');
      expect(typeof body.message).toBe('string');
      expect(body.message).toMatch(/malformed percent encoding/i);
      expect(body.message).toMatch(/two hex digits/);
      const expected = body.expected as Record<string, unknown>;
      expect(expected.percentEncoding).toBe('%XX');
      expect(expected.hexDigits).toBe('0-9A-Fa-f');
      expect(body.path).toBe(input);
      expect(body.method).toBe('GET');
      expect(body.discovery).toBe('/');
      // Task 0061: `endpoints[]` array is intentionally absent on
      // malformed-uri responses — the actionable diagnostic is the
      // `expected.percentEncoding` block, not a catalog dump.
      expect('endpoints' in body).toBe(false);
      // Body-size cap: with `endpoints[]` removed, the slim envelope
      // fits comfortably under 400 B (was ~745 B in the regressed shape).
      expect(Buffer.byteLength(res.body, 'utf8')).toBeLessThan(400);
      expect(typeof body.timestamp).toBe('number');
      expect(typeof body.timestampIso).toBe('string');
      const keys = Object.keys(body);
      expect(keys.at(-2)).toBe('timestamp');
      expect(keys.at(-1)).toBe('timestampIso');
      if (didYouMean === undefined) {
        expect('didYouMean' in body).toBe(false);
      } else {
        expect(body.didYouMean).toBe(didYouMean);
      }
    });
  }

  it('valid percent encoding decoding to non-ASCII still routes to invalid-symbol (regression)', async () => {
    const res = await rawGet('/quotes/%C3%9F', port);
    expect(res.status).toBe(400);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
  });

  it('valid percent encoding for NUL byte still routes to invalid-symbol (regression)', async () => {
    const res = await rawGet('/quotes/%00', port);
    expect(res.status).toBe(400);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body.error).toBe('invalid-symbol');
  });

  it('full diagnostic block survives the trim — error/message/expected/path/method/discovery all present', async () => {
    const res = await rawGet('/quotes/AAPL%', port);
    expect(res.status).toBe(400);
    const body = JSON.parse(res.body) as Record<string, unknown>;
    expect(body.error).toBe('malformed-uri');
    expect(typeof body.message).toBe('string');
    expect(body.expected).toBeDefined();
    expect(typeof body.path).toBe('string');
    expect(typeof body.method).toBe('string');
    expect(body.discovery).toBe('/');
  });

  it('GET / still ships the full endpoints[] catalog (single legitimate emit site)', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { endpoints: unknown[] };
    expect(Array.isArray(body.endpoints)).toBe(true);
    expect(body.endpoints.length).toBeGreaterThan(0);
  });
});
