import WebSocket from 'ws';
import { WsBroadcaster } from '../ws-broadcaster';
import { QuoteCache } from '../quote-cache';
import { DEGRADED_NO_CACHE_MESSAGE } from '../degraded';
import { NormalizedQuote, SourceStatus, computeSpread } from '../types';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  const base = {
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.5,
    ask: 189.6,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open' as const,
    confidence: 1,
    stale: false,
    ...overrides,
  };
  return computeSpread(base);
}

async function readSnapshot(port: number): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error('snapshot not received within 5s'));
    }, 5000);
    ws.on('message', (data) => {
      const frame = JSON.parse(data.toString()) as Record<string, unknown>;
      if (frame.type === 'snapshot') {
        clearTimeout(timer);
        ws.close();
        resolve(frame);
      }
    });
    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function bootBroadcaster(
  sourceStatusGetter?: () => SourceStatus,
  cacheSeed?: (cache: QuoteCache) => void,
): Promise<{ broadcaster: WsBroadcaster; port: number; cache: QuoteCache }> {
  const cache = new QuoteCache({ cacheTtlMs: 30_000 });
  if (cacheSeed) cacheSeed(cache);
  const broadcaster = new WsBroadcaster();
  const wss = broadcaster.start(0, cache, sourceStatusGetter);
  await new Promise<void>((resolve) => wss.on('listening', () => resolve()));
  const addr = wss.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return { broadcaster, port, cache };
}

/**
 * Task 0076 — the WS on-connect `snapshot` frame ships the same
 * `degraded` boolean and human-readable `message` field that
 * `GET /quotes` ships for the exact same upstream state, sourcing
 * the verdict from the shared `computeDegraded` helper and the
 * message from the shared `DEGRADED_NO_CACHE_MESSAGE` constant.
 */
describe('WS snapshot frame — degraded + message (task 0076)', () => {
  describe('source dead + cache empty', () => {
    let broadcaster: WsBroadcaster;
    let port: number;

    beforeAll(async () => {
      ({ broadcaster, port } = await bootBroadcaster(() => ({
        connected: false,
        reason: 'etoro-client-not-installed',
        lastAttachAt: null,
      })));
    });

    afterAll(() => {
      broadcaster.stop();
    });

    it('snapshot ships degraded:true and the canonical message', async () => {
      const frame = await readSnapshot(port);
      expect(frame.type).toBe('snapshot');
      expect(frame.degraded).toBe(true);
      expect(frame.message).toBe(DEGRADED_NO_CACHE_MESSAGE);
    });

    it('snapshot preserves data, count, source, and timestamp tail', async () => {
      const frame = await readSnapshot(port);
      expect(Array.isArray(frame.data)).toBe(true);
      expect((frame.data as unknown[]).length).toBe(0);
      expect(frame.count).toBe(0);
      expect(frame.source).toBeDefined();
      expect(typeof frame.timestamp).toBe('number');
      expect(typeof frame.timestampIso).toBe('string');
    });
  });

  describe('source healthy + cache has fresh quote', () => {
    let broadcaster: WsBroadcaster;
    let port: number;

    beforeAll(async () => {
      ({ broadcaster, port } = await bootBroadcaster(
        () => ({
          connected: true,
          symbols: ['AAPL'],
          lastAttachAt: Date.now(),
        }),
        (cache) => cache.update(makeQuote()),
      ));
    });

    afterAll(() => {
      broadcaster.stop();
    });

    it('snapshot ships degraded:false and omits message', async () => {
      const frame = await readSnapshot(port);
      expect(frame.degraded).toBe(false);
      expect('message' in frame).toBe(false);
    });

    it('snapshot ships the cached quote', async () => {
      const frame = await readSnapshot(port);
      expect((frame.data as unknown[]).length).toBe(1);
      expect(frame.count).toBe(1);
    });
  });

  describe('source healthy + cache empty (warmup)', () => {
    let broadcaster: WsBroadcaster;
    let port: number;

    beforeAll(async () => {
      ({ broadcaster, port } = await bootBroadcaster(() => ({
        connected: true,
        symbols: ['AAPL'],
        lastAttachAt: Date.now(),
      })));
    });

    afterAll(() => {
      broadcaster.stop();
    });

    it('snapshot ships degraded:false (warmup is not degraded) and omits message', async () => {
      const frame = await readSnapshot(port);
      expect(frame.degraded).toBe(false);
      expect('message' in frame).toBe(false);
    });
  });

  describe('no sourceStatusGetter (back-compat)', () => {
    let broadcaster: WsBroadcaster;
    let port: number;

    beforeAll(async () => {
      ({ broadcaster, port } = await bootBroadcaster());
    });

    afterAll(() => {
      broadcaster.stop();
    });

    it('snapshot omits degraded and message when status getter not wired', async () => {
      const frame = await readSnapshot(port);
      expect('degraded' in frame).toBe(false);
      expect('message' in frame).toBe(false);
      expect('source' in frame).toBe(false);
    });
  });
});
