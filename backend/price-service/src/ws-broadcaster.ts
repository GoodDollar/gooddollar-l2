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
      // Per-client error sink: the WebSocketServer escalates uncaught
      // 'error' events on a connection to its own 'error' listener,
      // which we don't register; without this swallow a stale peer's
      // error can crash the whole price-service process.
      client.on('error', () => { /* logged by the broadcast loop instead */ });

      try {
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
      } catch (err) {
        console.warn(
          `[price-service] snapshot-on-connect failed: ` +
          `${err instanceof Error ? err.message : String(err)}`,
        );
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
      if (client.readyState !== WebSocket.OPEN) continue;
      // Isolate per-client send failures (CLOSING-race, backpressure
      // throw) so one slow/dying subscriber cannot mute the broadcast
      // for the rest. The ws lib emits 'close'/'error' separately and
      // its lifecycle removes dead clients on its own.
      try {
        client.send(message);
      } catch (err) {
        console.warn(
          `[price-service] ws send failed; isolating client. ` +
          `clients=${this.wss.clients.size} ` +
          `err=${err instanceof Error ? err.message : String(err)}`,
        );
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
