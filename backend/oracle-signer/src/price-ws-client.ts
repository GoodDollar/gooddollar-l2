import WebSocket from 'ws';
import { NormalizedQuote } from './types';

export type QuoteCallback = (quote: NormalizedQuote) => void;

/**
 * Connects to the price-service WebSocket and forwards incoming quotes.
 * Auto-reconnects with exponential backoff on disconnect.
 */
export class PriceWsClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;
  private closing = false;
  private onQuote: QuoteCallback;
  private readonly url: string;

  constructor(url: string, onQuote: QuoteCallback) {
    this.url = url;
    this.onQuote = onQuote;
  }

  connect(): void {
    this.closing = false;
    this.doConnect();
  }

  private doConnect(): void {
    if (this.closing) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.on('open', () => {
      this.reconnectDelay = 1000;
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(data.toString());
        for (const quote of this.extractQuotes(parsed)) {
          if (quote.symbol && Number.isFinite(quote.mid) && quote.mid > 0) {
            this.onQuote(quote);
          }
        }
      } catch {
        // malformed message — skip
      }
    });

    this.ws.on('close', () => {
      this.ws = null;
      if (!this.closing) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', () => {
      try { this.ws?.close(); } catch { /* ignore */ }
    });
  }

  private scheduleReconnect(): void {
    setTimeout(() => this.doConnect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  /**
   * Normalises every supported WS message shape into a flat list of quotes
   * for the caller to validate and fan out. Recognised shapes:
   *   - `{ type: 'quote', data: NormalizedQuote }` — live tick.
   *   - `{ type: 'snapshot', data: NormalizedQuote[] }` — initial replay
   *     sent by the broadcaster on connect so the buffer is usable before
   *     the next upstream tick.
   *   - Raw `NormalizedQuote` (no envelope) — legacy/backward compat.
   * Unknown shapes yield zero quotes (dropped silently).
   */
  private extractQuotes(parsed: unknown): NormalizedQuote[] {
    if (!parsed || typeof parsed !== 'object') return [];
    const msg = parsed as Record<string, unknown>;

    if (msg.type === 'quote' && msg.data && typeof msg.data === 'object') {
      return [msg.data as NormalizedQuote];
    }

    if (msg.type === 'snapshot' && Array.isArray(msg.data)) {
      return msg.data as NormalizedQuote[];
    }

    if ('symbol' in msg && 'mid' in msg) {
      return [msg as unknown as NormalizedQuote];
    }

    return [];
  }

  close(): void {
    this.closing = true;
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
