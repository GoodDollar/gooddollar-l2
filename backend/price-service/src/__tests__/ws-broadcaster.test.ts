import { WsBroadcaster } from '../ws-broadcaster';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote } from '../types';
import WebSocket from 'ws';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  return {
    source: 'etoro',
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
    mid: 189.55,
    last: 189.55,
    timestamp: Date.now(),
    sessionState: 'open',
    confidence: 1,
    stale: false,
    ...overrides,
  };
}

describe('WsBroadcaster', () => {
  let broadcaster: WsBroadcaster;
  let cache: QuoteCache;
  let port: number;

  beforeEach((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    broadcaster = new WsBroadcaster();
    const wss = broadcaster.start(0, cache);
    wss.on('listening', () => {
      const addr = wss.address();
      if (typeof addr === 'object' && addr) {
        port = addr.port;
      }
      done();
    });
  });

  afterEach(() => {
    broadcaster.stop();
  });

  it('reports zero clients when none connected', () => {
    expect(broadcaster.clientCount).toBe(0);
  });

  it('broadcasts accepted quotes to connected clients', (done) => {
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    client.on('open', () => {
      cache.update(makeQuote({ symbol: 'AAPL', last: 195 }));
    });
    client.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      // The initial frame is the snapshot (empty here); subsequent frames
      // are live quote pushes.
      if (parsed.type === 'snapshot') return;
      expect(parsed.type).toBe('quote');
      expect(parsed.data.symbol).toBe('AAPL');
      expect(parsed.data.last).toBe(195);
      client.close();
      done();
    });
  });

  it('does not broadcast rejected quotes', (done) => {
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    let quoteMessageReceived = false;
    client.on('open', () => {
      cache.update(makeQuote({ symbol: 'AAPL', sessionState: 'halted' }));
      setTimeout(() => {
        expect(quoteMessageReceived).toBe(false);
        client.close();
        done();
      }, 100);
    });
    client.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'quote') quoteMessageReceived = true;
    });
  });

  it('counts connected clients', (done) => {
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    client.on('open', () => {
      setTimeout(() => {
        expect(broadcaster.clientCount).toBe(1);
        client.close();
        done();
      }, 50);
    });
  });

  describe('snapshot on connect', () => {
    function waitForFirstMessage(client: WebSocket): Promise<{ type?: unknown; data?: unknown; count?: unknown }> {
      return new Promise((resolve, reject) => {
        client.once('message', (data) => {
          try {
            resolve(JSON.parse(data.toString()));
          } catch (err) {
            reject(err);
          }
        });
        client.once('error', reject);
      });
    }

    it('sends a snapshot frame as the first message to a newly connected client', async () => {
      cache.update(makeQuote({ symbol: 'BTC', mid: 60000, bid: 59995, ask: 60005 }));
      cache.update(makeQuote({ symbol: 'ETH', mid: 3000, bid: 2999, ask: 3001 }));

      const client = new WebSocket(`ws://127.0.0.1:${port}`);
      const first = await waitForFirstMessage(client);
      expect(first.type).toBe('snapshot');
      expect(first.count).toBe(2);
      const symbols = (first.data as Array<{ symbol: string }>).map((q) => q.symbol).sort();
      expect(symbols).toEqual(['BTC', 'ETH']);
      client.close();
    });

    it('snapshot excludes rejected quotes', async () => {
      cache.update(makeQuote({ symbol: 'BTC', mid: 60000, bid: 59995, ask: 60005 }));
      // Halted quotes are rejected by the risk filter and never enter the cache.
      cache.update(makeQuote({ symbol: 'AAPL', sessionState: 'halted' }));

      const client = new WebSocket(`ws://127.0.0.1:${port}`);
      const first = await waitForFirstMessage(client);
      expect(first.type).toBe('snapshot');
      const symbols = (first.data as Array<{ symbol: string }>).map((q) => q.symbol);
      expect(symbols).toEqual(['BTC']);
      client.close();
    });

    it('snapshot is an empty array for an empty cache', async () => {
      const client = new WebSocket(`ws://127.0.0.1:${port}`);
      const first = await waitForFirstMessage(client);
      expect(first.type).toBe('snapshot');
      expect(first.data).toEqual([]);
      expect(first.count).toBe(0);
      client.close();
    });

    it('subsequent quote updates after connect are still pushed as type=quote', (done) => {
      cache.update(makeQuote({ symbol: 'BTC', mid: 60000, bid: 59995, ask: 60005 }));
      const client = new WebSocket(`ws://127.0.0.1:${port}`);
      let snapshotSeen = false;
      client.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'snapshot') {
          snapshotSeen = true;
          cache.update(makeQuote({ symbol: 'ETH', mid: 3000, bid: 2999, ask: 3001 }));
          return;
        }
        expect(snapshotSeen).toBe(true);
        expect(parsed.type).toBe('quote');
        expect(parsed.data.symbol).toBe('ETH');
        client.close();
        done();
      });
    });
  });
});
