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
 * `didYouMean`, no `discovery` pointer. Every other 400 on the same
 * endpoint family ships rich diagnostics. After this task the
 * malformed-uri 400 mirrors the 404 catch-all shape:
 * `{error, message, expected, didYouMean?, path, method, discovery,
 * endpoints, timestamp, timestampIso}`.
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
      expect(Array.isArray(body.endpoints)).toBe(true);
      expect((body.endpoints as unknown[]).length).toBeGreaterThan(0);
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
});
