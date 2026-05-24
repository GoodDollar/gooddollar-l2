import WebSocket, { WebSocketServer } from 'ws';
import { PriceWsClient } from '../price-ws-client';
import { NormalizedQuote } from '../types';

function makeQuote(symbol: string, mid: number): NormalizedQuote {
  return {
    source: 'etoro',
    symbol,
    instrumentId: '1',
    bid: mid - 0.01,
    ask: mid + 0.01,
    mid,
    last: mid,
    timestamp: Date.now(),
    sessionState: 'open',
    confidence: 95,
    stale: false,
  };
}

function wrapEnvelope(quote: NormalizedQuote) {
  return JSON.stringify({ type: 'quote', data: quote, timestamp: Date.now() });
}

describe('PriceWsClient', () => {
  let server: WebSocketServer;
  let port: number;

  beforeEach((done) => {
    server = new WebSocketServer({ port: 0 }, () => {
      const addr = server.address();
      port = typeof addr === 'object' && addr ? addr.port : 0;
      done();
    });
  });

  afterEach((done) => {
    server.close(done);
  });

  it('receives quotes wrapped in WsBroadcaster envelope format', (done) => {
    const received: NormalizedQuote[] = [];

    server.on('connection', (ws) => {
      ws.send(wrapEnvelope(makeQuote('AAPL', 191.50)));
      ws.send(wrapEnvelope(makeQuote('TSLA', 178.30)));
    });

    const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
      received.push(quote);
      if (received.length === 2) {
        client.close();
        expect(received[0].symbol).toBe('AAPL');
        expect(received[0].mid).toBe(191.50);
        expect(received[1].symbol).toBe('TSLA');
        expect(received[1].mid).toBe(178.30);
        done();
      }
    });

    client.connect();
  });

  it('receives raw NormalizedQuote messages for backward compatibility', (done) => {
    const received: NormalizedQuote[] = [];

    server.on('connection', (ws) => {
      ws.send(JSON.stringify(makeQuote('NVDA', 130.95)));
      ws.send(JSON.stringify(makeQuote('META', 520.10)));
    });

    const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
      received.push(quote);
      if (received.length === 2) {
        client.close();
        expect(received[0].symbol).toBe('NVDA');
        expect(received[1].symbol).toBe('META');
        done();
      }
    });

    client.connect();
  });

  it('ignores malformed messages', (done) => {
    const received: NormalizedQuote[] = [];

    server.on('connection', (ws) => {
      ws.send('not-json');
      ws.send('{}');
      ws.send(JSON.stringify({ type: 'quote', data: null }));
      ws.send(JSON.stringify({ type: 'unknown', data: makeQuote('X', 1) }));
      ws.send(wrapEnvelope(makeQuote('NVDA', 130.95)));
    });

    const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
      received.push(quote);
      if (received.length === 1) {
        client.close();
        expect(received[0].symbol).toBe('NVDA');
        done();
      }
    });

    client.connect();
  });

  it('reports connected state', (done) => {
    const client = new PriceWsClient(`ws://localhost:${port}`, () => {});

    expect(client.connected).toBe(false);

    server.on('connection', () => {
      setTimeout(() => {
        expect(client.connected).toBe(true);
        client.close();
        setTimeout(() => {
          expect(client.connected).toBe(false);
          done();
        }, 50);
      }, 50);
    });

    client.connect();
  });

  describe('snapshot frames', () => {
    function wrapSnapshot(quotes: NormalizedQuote[]) {
      return JSON.stringify({
        type: 'snapshot',
        data: quotes,
        count: quotes.length,
        timestamp: Date.now(),
      });
    }

    it('primes onQuote with every snapshot entry on connect', (done) => {
      const received: NormalizedQuote[] = [];
      server.on('connection', (ws) => {
        ws.send(wrapSnapshot([
          makeQuote('BTC', 60000),
          makeQuote('ETH', 3000),
        ]));
      });
      const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
        received.push(quote);
        if (received.length === 2) {
          client.close();
          expect(received.map((q) => q.symbol).sort()).toEqual(['BTC', 'ETH']);
          done();
        }
      });
      client.connect();
    });

    it('still receives subsequent type=quote frames after a snapshot', (done) => {
      const received: NormalizedQuote[] = [];
      server.on('connection', (ws) => {
        ws.send(wrapSnapshot([makeQuote('BTC', 60000)]));
        ws.send(wrapEnvelope(makeQuote('ETH', 3000)));
      });
      const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
        received.push(quote);
        if (received.length === 2) {
          client.close();
          expect(received[0].symbol).toBe('BTC');
          expect(received[1].symbol).toBe('ETH');
          done();
        }
      });
      client.connect();
    });

    it('skips snapshot entries that fail the finite-mid guard', (done) => {
      const received: NormalizedQuote[] = [];
      server.on('connection', (ws) => {
        ws.send(wrapSnapshot([
          makeQuote('BAD', 0),
          makeQuote('GOOD', 100),
        ]));
      });
      const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
        received.push(quote);
        // wait a small moment to be sure no extra entries arrive
        setTimeout(() => {
          if (received.length === 1) {
            client.close();
            expect(received[0].symbol).toBe('GOOD');
            done();
          }
        }, 50);
      });
      client.connect();
    });

    it('ignores an empty snapshot without calling onQuote', (done) => {
      const received: NormalizedQuote[] = [];
      server.on('connection', (ws) => {
        ws.send(wrapSnapshot([]));
        setTimeout(() => ws.send(wrapEnvelope(makeQuote('BTC', 60000))), 30);
      });
      const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
        received.push(quote);
        if (received.length === 1) {
          client.close();
          expect(received[0].symbol).toBe('BTC');
          done();
        }
      });
      client.connect();
    });
  });

  it('rejects quotes with NaN or Infinity mid', (done) => {
    const received: NormalizedQuote[] = [];

    server.on('connection', (ws) => {
      ws.send(wrapEnvelope(makeQuote('BAD1', NaN)));
      ws.send(wrapEnvelope(makeQuote('BAD2', Infinity)));
      ws.send(wrapEnvelope(makeQuote('BAD3', -Infinity)));
      ws.send(wrapEnvelope(makeQuote('BAD4', 0)));
      ws.send(wrapEnvelope(makeQuote('GOOD', 191.50)));
    });

    const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
      received.push(quote);
      if (received.length === 1) {
        client.close();
        expect(received[0].symbol).toBe('GOOD');
        expect(received[0].mid).toBe(191.50);
        done();
      }
    });

    client.connect();
  });

  describe('stream-failure observability', () => {
    // The closure-bound `ws.on('message', …)` was unaddressable from
    // a test, so the public `handleMessage(data)` boundary is the
    // testable seam. These tests drive frames through it directly
    // without spinning up a live WebSocketServer.
    it('parse failure increments ws-parse and skips onQuote', () => {
      const seen: NormalizedQuote[] = [];
      const client = new PriceWsClient('ws://stub', (q) => seen.push(q));
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      client.handleMessage(Buffer.from('{not-json'));

      expect(client.getStreamFailureCount('ws-parse')).toBe(1);
      expect(client.getStreamFailureCount('ws-unknown-shape')).toBe(0);
      expect(client.getStreamFailureCount('ws-error-event')).toBe(0);
      expect(seen).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/ws-parse/));
      warn.mockRestore();
    });

    it('unknown envelope shape increments ws-unknown-shape', () => {
      const seen: NormalizedQuote[] = [];
      const client = new PriceWsClient('ws://stub', (q) => seen.push(q));
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      client.handleMessage(
        Buffer.from(JSON.stringify({ type: 'unknown', payload: { foo: 'bar' } })),
      );

      expect(client.getStreamFailureCount('ws-unknown-shape')).toBe(1);
      expect(client.getStreamFailureCount('ws-parse')).toBe(0);
      expect(seen).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/ws-unknown-shape/));
      warn.mockRestore();
    });

    it('a recognised envelope with finite-mid drop does NOT count as unknown-shape', () => {
      // {type:'quote', data:{mid:0}} is recognised by extractQuotes
      // but rejected by the finite-mid validator. We deliberately do
      // not count this as schema drift — those drops already have
      // dedicated NaN/zero-guard tests above.
      const seen: NormalizedQuote[] = [];
      const client = new PriceWsClient('ws://stub', (q) => seen.push(q));

      client.handleMessage(
        Buffer.from(JSON.stringify({ type: 'quote', data: makeQuote('BAD', 0) })),
      );

      expect(client.getStreamFailureCount('ws-unknown-shape')).toBe(0);
      expect(seen).toEqual([]);
    });

    it('valid quote still flows through and increments no counters', () => {
      const seen: NormalizedQuote[] = [];
      const client = new PriceWsClient('ws://stub', (q) => seen.push(q));

      client.handleMessage(
        Buffer.from(JSON.stringify({ type: 'quote', data: makeQuote('AAPL', 191.5) })),
      );

      expect(seen).toHaveLength(1);
      expect(seen[0].symbol).toBe('AAPL');
      expect(client.getStreamFailureCounts()).toEqual({
        'ws-parse': 0,
        'ws-unknown-shape': 0,
        'ws-error-event': 0,
      });
    });

    it('throttled warn fires at most once per kind per window', () => {
      const seen: NormalizedQuote[] = [];
      // Pin the clock so the throttle window is deterministic.
      let now = 1_000_000;
      const client = new PriceWsClient('ws://stub', (q) => seen.push(q), {
        clock: () => now,
        throttleMs: 60_000,
      });
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // Five malformed frames inside one window.
      for (let i = 0; i < 5; i++) {
        client.handleMessage(Buffer.from('{still-bad'));
      }
      expect(client.getStreamFailureCount('ws-parse')).toBe(5);
      expect(warn).toHaveBeenCalledTimes(1);

      // Advance past the window — the next failure should warn again.
      now += 60_001;
      client.handleMessage(Buffer.from('{still-bad'));
      expect(client.getStreamFailureCount('ws-parse')).toBe(6);
      expect(warn).toHaveBeenCalledTimes(2);

      warn.mockRestore();
    });

    it('exposes lastStreamError with kind, message, atMs', () => {
      let now = 5_000;
      const client = new PriceWsClient('ws://stub', () => {}, { clock: () => now });
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      client.handleMessage(Buffer.from('{nope'));
      const last = client.getLastStreamError();
      expect(last).toBeDefined();
      expect(last?.kind).toBe('ws-parse');
      expect(last?.atMs).toBe(5_000);
      expect(typeof last?.message).toBe('string');
    });
  });
});
