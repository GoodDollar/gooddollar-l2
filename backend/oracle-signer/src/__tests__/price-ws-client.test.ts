import WebSocket, { WebSocketServer } from 'ws';
import { PriceWsClient, redactSnippet, emptyIngestStats } from '../price-ws-client';
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
});

describe('PriceWsClient ingest counters', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(new Date('2026-05-23T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    warnSpy.mockRestore();
  });

  function makeClient(received: NormalizedQuote[] = []): PriceWsClient {
    return new PriceWsClient('ws://unused', (q) => { received.push(q); });
  }

  it('exposes a zero-counter snapshot before any messages', () => {
    const client = makeClient();
    expect(client.getStats()).toEqual(emptyIngestStats());
  });

  it('increments accepted for valid envelopes and routes the quote', () => {
    const received: NormalizedQuote[] = [];
    const client = makeClient(received);
    const quote = makeQuote('AAPL', 191.50);
    client.handleMessage(JSON.stringify({ type: 'quote', data: quote }));
    expect(client.getStats().accepted).toBe(1);
    expect(received).toHaveLength(1);
  });

  it('increments droppedJsonParse on non-JSON payload, accepted unchanged', () => {
    const received: NormalizedQuote[] = [];
    const client = makeClient(received);
    client.handleMessage('not-json');
    const stats = client.getStats();
    expect(stats.droppedJsonParse).toBe(1);
    expect(stats.accepted).toBe(0);
    expect(received).toHaveLength(0);
  });

  it('increments droppedShape when payload parses but is not a quote envelope', () => {
    const client = makeClient();
    client.handleMessage(JSON.stringify({ type: 'unknown', data: { foo: 1 } }));
    expect(client.getStats().droppedShape).toBe(1);
  });

  it('increments droppedMissingSymbol when envelope has no symbol', () => {
    const client = makeClient();
    client.handleMessage(JSON.stringify({ symbol: '', mid: 100 }));
    expect(client.getStats().droppedMissingSymbol).toBe(1);
  });

  it('increments droppedInvalidMid for NaN / Infinity / 0 / negative mids', () => {
    const client = makeClient();
    client.handleMessage(JSON.stringify(makeQuote('A', NaN)));
    client.handleMessage(JSON.stringify(makeQuote('B', Infinity)));
    client.handleMessage(JSON.stringify(makeQuote('C', 0)));
    client.handleMessage(JSON.stringify(makeQuote('D', -1)));
    expect(client.getStats().droppedInvalidMid).toBe(4);
    expect(client.getStats().accepted).toBe(0);
  });

  it('lastDroppedSnippet is redacted to <=80 chars with no quotes / newlines', () => {
    const client = makeClient();
    const oversized = 'x'.repeat(500) + "\n'\"`";
    client.handleMessage(oversized);
    const stats = client.getStats();
    expect(stats.lastDroppedSnippet).toBeDefined();
    expect(stats.lastDroppedSnippet!.length).toBeLessThanOrEqual(80);
    expect(stats.lastDroppedSnippet!).not.toMatch(/[\r\n'"`]/);
  });

  it('emits at most one warn per reason class per 60s; warn re-arms after window', () => {
    const client = makeClient();
    client.handleMessage('not-json-1');
    client.handleMessage('not-json-2');
    client.handleMessage('not-json-3');
    const firstBatchWarns = warnSpy.mock.calls.filter(c => String(c[0]).includes('droppedJsonParse'));
    expect(firstBatchWarns.length).toBe(1);

    jest.advanceTimersByTime(61_000);
    client.handleMessage('not-json-4');
    const totalWarns = warnSpy.mock.calls.filter(c => String(c[0]).includes('droppedJsonParse'));
    expect(totalWarns.length).toBe(2);
  });

  it('warn throttle is per-reason — different drop classes do not share the window', () => {
    const client = makeClient();
    client.handleMessage('not-json');
    client.handleMessage(JSON.stringify({ type: 'unknown' }));
    expect(warnSpy.mock.calls.filter(c => String(c[0]).includes('droppedJsonParse')).length).toBe(1);
    expect(warnSpy.mock.calls.filter(c => String(c[0]).includes('droppedShape')).length).toBe(1);
  });
});

describe('redactSnippet', () => {
  it('strips backticks, quotes, and CR/LF', () => {
    const out = redactSnippet("a`b'c\"d\re\nf");
    expect(out).not.toMatch(/[`'"\r\n]/);
    expect(out).toContain('a b c d e f');
  });

  it('clamps to 80 chars', () => {
    const out = redactSnippet('x'.repeat(500));
    expect(out.length).toBe(80);
  });

  it('passes through short clean strings unchanged', () => {
    expect(redactSnippet('hello world')).toBe('hello world');
  });
});
