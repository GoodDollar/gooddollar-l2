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

  it('receives quotes from the WebSocket server', (done) => {
    const received: NormalizedQuote[] = [];

    server.on('connection', (ws) => {
      ws.send(JSON.stringify(makeQuote('AAPL', 191.50)));
      ws.send(JSON.stringify(makeQuote('TSLA', 178.30)));
    });

    const client = new PriceWsClient(`ws://localhost:${port}`, (quote) => {
      received.push(quote);
      if (received.length === 2) {
        client.close();
        expect(received[0].symbol).toBe('AAPL');
        expect(received[1].symbol).toBe('TSLA');
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
      ws.send(JSON.stringify(makeQuote('NVDA', 130.95)));
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
});
