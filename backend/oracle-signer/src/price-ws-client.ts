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
        const quote = JSON.parse(data.toString()) as NormalizedQuote;
        if (quote.symbol && typeof quote.mid === 'number') {
          this.onQuote(quote);
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
