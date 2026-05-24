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

  describe('send-failure isolation', () => {
    // Build a fake server-side WebSocket whose `send` we control. Used in
    // place of a live peer so the test can drive the for-loop through a
    // synthetic CLOSING-race / backpressure scenario.
    function makeFakeOpenClient(send: jest.Mock): WebSocket {
      return {
        readyState: WebSocket.OPEN,
        send,
        on: jest.fn(),
        once: jest.fn(),
      } as unknown as WebSocket;
    }

    it('continues broadcasting to remaining clients when one client.send throws', () => {
      const goodSend = jest.fn();
      const badSend = jest.fn(() => { throw new Error('WebSocket is not open: readyState 2'); });
      const goodClient = makeFakeOpenClient(goodSend);
      const badClient = makeFakeOpenClient(badSend);

      const wss = (broadcaster as unknown as { wss: { clients: Set<WebSocket> } }).wss;
      wss.clients.add(badClient);
      wss.clients.add(goodClient);

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // cache.update fires the broadcaster's listener which invokes
      // the broadcast loop synchronously; the second client must
      // still receive the frame even though the first threw.
      expect(() => cache.update(makeQuote({ symbol: 'AAPL', last: 195 }))).not.toThrow();

      expect(badSend).toHaveBeenCalledTimes(1);
      expect(goodSend).toHaveBeenCalledTimes(1);
      expect(JSON.parse(goodSend.mock.calls[0][0] as string).type).toBe('quote');
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/ws send failed/));
      warn.mockRestore();
    });

    it('snapshot-on-connect throw is logged and does not crash the WSS', () => {
      const fakeClient = makeFakeOpenClient(
        jest.fn(() => { throw new Error('Cannot call send() while not in OPEN state'); }),
      );
      const wss = (broadcaster as unknown as {
        wss: { emit: (event: string, ...args: unknown[]) => boolean };
      }).wss;

      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // The broadcaster's connection handler runs synchronously with
      // emit; if the throw escapes, this expression throws.
      expect(() => wss.emit('connection', fakeClient, {})).not.toThrow();
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/snapshot-on-connect failed/));
      warn.mockRestore();
    });

    it('attaches a per-client error sink on connect so stale subscribers do not bubble up', () => {
      const onSpy = jest.fn();
      const fakeClient = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        on: onSpy,
        once: jest.fn(),
      } as unknown as WebSocket;

      const wss = (broadcaster as unknown as {
        wss: { emit: (event: string, ...args: unknown[]) => boolean };
      }).wss;
      wss.emit('connection', fakeClient, {});

      expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });
});
