import WebSocket, { WebSocketServer } from 'ws';
import { QuoteCache } from './quote-cache';
import { RiskFilterResult } from './types';

export class WsBroadcaster {
  private wss: WebSocketServer | null = null;
  private unsubscribe?: () => void;

  start(port: number, cache: QuoteCache): WebSocketServer {
    this.wss = new WebSocketServer({ port });

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
