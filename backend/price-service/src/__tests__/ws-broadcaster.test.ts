import { WsBroadcaster } from '../ws-broadcaster';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, SourceStatus, computeSpread } from '../types';
import WebSocket, { WebSocketServer } from 'ws';

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
  let wss: WebSocketServer;

  beforeEach((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    broadcaster = new WsBroadcaster();
    wss = broadcaster.start(0, cache);
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
      // Skip the on-connect snapshot — only the live tick is asserted here.
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
    let messageReceived = false;
    client.on('open', () => {
      cache.update(makeQuote({ symbol: 'AAPL', sessionState: 'halted' }));
      setTimeout(() => {
        expect(messageReceived).toBe(false);
        client.close();
        done();
      }, 100);
    });
    client.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'snapshot') return;
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

  describe('on-connect snapshot', () => {
    it('sends snapshot with empty data when cache is empty', (done) => {
      const client = new WebSocket(`ws://127.0.0.1:${port}`);
      client.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        expect(parsed.type).toBe('snapshot');
        expect(parsed.data).toEqual([]);
        expect(parsed.count).toBe(0);
        expect(typeof parsed.timestamp).toBe('number');
        expect(parsed.timestamp).toBeGreaterThan(0);
        client.close();
        done();
      });
    });

    it('sends snapshot with current fresh quotes', (done) => {
      cache.update(makeQuote({ symbol: 'AAPL', last: 200 }));
      const client = new WebSocket(`ws://127.0.0.1:${port}`);
      client.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        expect(parsed.type).toBe('snapshot');
        expect(parsed.count).toBe(1);
        expect(parsed.data).toHaveLength(1);
        expect(parsed.data[0].symbol).toBe('AAPL');
        expect(parsed.data[0].last).toBe(200);
        client.close();
        done();
      });
    });

    it('omits source field when no getter is supplied (legacy two-arg start)', (done) => {
      const client = new WebSocket(`ws://127.0.0.1:${port}`);
      client.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        expect(parsed.type).toBe('snapshot');
        expect(parsed.source).toBeUndefined();
        client.close();
        done();
      });
    });
  });

  describe('per-client send isolation', () => {
    it('a thrown send for one client does not block siblings', (done) => {
      const clientA = new WebSocket(`ws://127.0.0.1:${port}`);
      const clientB = new WebSocket(`ws://127.0.0.1:${port}`);

      let openA = false;
      let openB = false;
      let snapshotA = false;
      let snapshotB = false;
      let bGotQuote = false;

      const maybeProceed = () => {
        if (openA && openB && snapshotA && snapshotB) {
          const sockets = Array.from(wss.clients);
          const target = sockets[0];
          const origSend = target.send.bind(target);
          let thrown = false;
          target.send = ((..._args: unknown[]) => {
            if (!thrown) {
              thrown = true;
              throw new Error('synthetic-send-failure');
            }
            return origSend(..._args as [string]);
          }) as typeof target.send;

          cache.update(makeQuote({ symbol: 'AAPL', last: 250 }));
        }
      };

      clientA.on('open', () => {
        openA = true;
        maybeProceed();
      });
      clientB.on('open', () => {
        openB = true;
        maybeProceed();
      });
      clientA.on('message', (data) => {
        const m = JSON.parse(data.toString());
        if (m.type === 'snapshot') {
          snapshotA = true;
          maybeProceed();
        }
      });
      clientB.on('message', (data) => {
        const m = JSON.parse(data.toString());
        if (m.type === 'snapshot') {
          snapshotB = true;
          maybeProceed();
          return;
        }
        if (m.type === 'quote') {
          expect(m.data.last).toBe(250);
          bGotQuote = true;
          clientA.terminate();
          clientB.close();
          expect(bGotQuote).toBe(true);
          done();
        }
      });
    });
  });

  describe('error-listener crash safety', () => {
    it('client error event does not crash the process', (done) => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const client = new WebSocket(`ws://127.0.0.1:${port}`);

      const onSnapshot = (data: WebSocket.RawData) => {
        const m = JSON.parse(data.toString());
        if (m.type !== 'snapshot') return;
        client.removeListener('message', onSnapshot);

        const sockets = Array.from(wss.clients);
        expect(sockets.length).toBeGreaterThan(0);
        sockets[0].emit('error', new Error('synthetic-client-error'));

        setTimeout(() => {
          expect(warnSpy).toHaveBeenCalled();
          const calls = warnSpy.mock.calls.map((c) => c.join(' '));
          expect(calls.some((s) => s.includes('WS client error'))).toBe(true);
          warnSpy.mockRestore();
          client.close();
          done();
        }, 50);
      };
      client.on('message', onSnapshot);
    });
  });
});

describe('WsBroadcaster — snapshot with source-status getter', () => {
  let broadcaster: WsBroadcaster;
  let cache: QuoteCache;
  let port: number;
  let wss: WebSocketServer;
  let srcState: SourceStatus;

  beforeEach((done) => {
    cache = new QuoteCache({ cacheTtlMs: 30_000 });
    broadcaster = new WsBroadcaster();
    srcState = { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null };
    wss = broadcaster.start(0, cache, () => srcState);
    wss.on('listening', () => {
      const addr = wss.address();
      if (typeof addr === 'object' && addr) port = addr.port;
      done();
    });
  });

  afterEach(() => {
    broadcaster.stop();
  });

  it('snapshot includes source.connected=false when source-status getter reports disconnect', (done) => {
    srcState = { connected: false, reason: 'etoro-client-not-installed', lastAttachAt: null };
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    client.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      expect(parsed.type).toBe('snapshot');
      expect(parsed.source.connected).toBe(false);
      expect(parsed.source.reason).toBe('etoro-client-not-installed');
      client.close();
      done();
    });
  });

  it('snapshot includes source.connected=true and symbols when source is attached', (done) => {
    srcState = { connected: true, symbols: ['AAPL', 'TSLA'], lastAttachAt: 1700000000000 };
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    client.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      expect(parsed.type).toBe('snapshot');
      expect(parsed.source.connected).toBe(true);
      expect(parsed.source.symbols).toEqual(['AAPL', 'TSLA']);
      expect(parsed.source.lastAttachAt).toBe(1700000000000);
      client.close();
      done();
    });
  });

  it('live quote frames do not carry source field', (done) => {
    srcState = { connected: true, symbols: ['AAPL'], lastAttachAt: 1700000000000 };
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    client.on('open', () => {
      cache.update(makeQuote({ symbol: 'AAPL', last: 195 }));
    });
    client.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'snapshot') return;
      expect(parsed.type).toBe('quote');
      expect(parsed.source).toBeUndefined();
      client.close();
      done();
    });
  });

  it('getter is called per-connect, not memoised — second client gets the then-current status', (done) => {
    srcState = { connected: false, reason: 'a', lastAttachAt: null };
    const clientA = new WebSocket(`ws://127.0.0.1:${port}`);
    clientA.on('message', (dataA) => {
      const a = JSON.parse(dataA.toString());
      expect(a.source.reason).toBe('a');
      srcState = { connected: false, reason: 'b', lastAttachAt: null };
      const clientB = new WebSocket(`ws://127.0.0.1:${port}`);
      clientB.on('message', (dataB) => {
        const b = JSON.parse(dataB.toString());
        expect(b.source.reason).toBe('b');
        clientA.close();
        clientB.close();
        done();
      });
    });
  });
});
