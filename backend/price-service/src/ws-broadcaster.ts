import WebSocket, { WebSocketServer } from 'ws';
import { QuoteCache } from './quote-cache';
import { NormalizedQuote, RiskFilterResult, SourceStatus } from './types';
import { sanitizeSourceStatus, SanitizedSourceStatus } from './source-status';

export type SourceStatusGetter = () => SourceStatus;

interface SnapshotFrame {
  type: 'snapshot';
  data: NormalizedQuote[];
  count: number;
  timestamp: number;
  source?: SanitizedSourceStatus;
}

export class WsBroadcaster {
  private wss: WebSocketServer | null = null;
  private unsubscribe?: () => void;

  start(
    port: number,
    cache: QuoteCache,
    sourceStatusGetter?: SourceStatusGetter,
  ): WebSocketServer {
    this.wss = new WebSocketServer({ port });

    // Attach an `'error'` listener so a server-level fault doesn't bubble
    // up as an unhandled emitter error (which would crash the process).
    this.wss.on('error', (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[price-service] WS server error: ${msg}`);
    });

    this.wss.on('connection', (client) => {
      // Per-client `'error'` listener for the same reason as above.
      client.on('error', (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[price-service] WS client error: ${msg}`);
      });

      // Send the current fresh-quote snapshot immediately so a fresh
      // (or reconnecting) consumer is never starved between live ticks.
      const fresh = cache.getFresh();
      const snapshot: SnapshotFrame = {
        type: 'snapshot',
        data: fresh,
        count: fresh.length,
        timestamp: Date.now(),
      };
      if (sourceStatusGetter) {
        snapshot.source = sanitizeSourceStatus(sourceStatusGetter());
      }
      this.safeSend(client, JSON.stringify(snapshot));
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

  /**
   * Send to one client, swallowing synchronous errors so a single bad
   * socket cannot drop the rest of the broadcast loop. Best-effort
   * terminates the broken connection so the server can free its slot.
   */
  private safeSend(client: WebSocket, message: string): void {
    if (client.readyState !== WebSocket.OPEN) return;
    try {
      client.send(message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[price-service] WS send failed: ${msg}`);
      try {
        client.terminate();
      } catch {
        // best-effort cleanup
      }
    }
  }

  private broadcast(message: string): void {
    if (!this.wss) return;
    for (const client of this.wss.clients) {
      this.safeSend(client, message);
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
