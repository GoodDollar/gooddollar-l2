import { WsBroadcaster } from '../ws-broadcaster';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread } from '../types';
import WebSocket from 'ws';

function makeQuote(overrides?: Partial<NormalizedQuote>): NormalizedQuote {
  const base = {
    source: 'etoro' as const,
    symbol: 'AAPL',
    instrumentId: 'AAPL-1',
    bid: 189.50,
    ask: 189.60,
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
      expect(parsed.type).toBe('quote');
      expect(parsed.data.symbol).toBe('AAPL');
      expect(parsed.data.last).toBe(195);
      client.close();
      done();
    });
  });

  it('does not broadcast rejected quotes', (done) => {
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    let messageReceived = false;
    client.on('open', () => {
      cache.update(makeQuote({ symbol: 'AAPL', sessionState: 'halted' }));
      setTimeout(() => {
        expect(messageReceived).toBe(false);
        client.close();
        done();
      }, 100);
    });
    client.on('message', () => {
      messageReceived = true;
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
});
