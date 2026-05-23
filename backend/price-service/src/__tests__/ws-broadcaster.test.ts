import { WsBroadcaster } from '../ws-broadcaster';
import { QuoteCache } from '../quote-cache';
import { NormalizedQuote, computeSpread } from '../types';
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
          // Find the server-side WebSocket for clientA via the wss
          // clients set. The order of `wss.clients` depends on connect
          // timing, so we patch BOTH server-side sends and only the
          // first invocation throws — that is enough to prove the loop
          // continues to subsequent clients.
          const sockets = Array.from(wss.clients);
          // Patch the first server-side socket to throw on send.
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
          // Sibling received the tick despite a thrown send on the other
          // client — proving per-client isolation.
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
        // Synthesizing an `'error'` event on the server-side socket
        // exercises the per-client error listener installed by start().
        sockets[0].emit('error', new Error('synthetic-client-error'));

        setTimeout(() => {
          // Process is still alive; warn was called with the expected tag.
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
