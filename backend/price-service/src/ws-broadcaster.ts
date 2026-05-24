import WebSocket, { WebSocketServer } from 'ws';
import { QuoteCache } from './quote-cache';
import { RiskFilterResult } from './types';

export class WsBroadcaster {
  private wss: WebSocketServer | null = null;
  private unsubscribe?: () => void;

  start(port: number, cache: QuoteCache): WebSocketServer {
    this.wss = new WebSocketServer({ port });

    // Prime new clients with a single `snapshot` frame so an oracle-signer
    // restart (or any other reconnecting consumer) does not have to wait
    // for the next upstream tick before its local buffer is usable.
    // Includes only fresh accepted quotes — see QuoteCache.getFresh.
    this.wss.on('connection', (client) => {
      const fresh = cache.getFresh();
      const msg = JSON.stringify({
        type: 'snapshot',
        data: fresh,
        count: fresh.length,
        timestamp: Date.now(),
      });
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });

    this.unsubscribe = cache.onUpdate((_symbol: string, result: RiskFilterResult) => {
      if (!result.accepted) return;
      const msg = JSON.stringify({
        type: 'quote',
        data: result.quote,
        timestamp: Date.now(),
      });
      this.broadcast(msg);
    });

    return this.wss;
  }

  private broadcast(message: string): void {
    if (!this.wss) return;
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  get clientCount(): number {
    if (!this.wss) return 0;
    let count = 0;
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) count++;
    }
    return count;
  }
}
