import WebSocket from 'ws';
import { NormalizedQuote } from './types';

export type QuoteCallback = (quote: NormalizedQuote) => void;

/**
 * The three malformed-frame failure modes the signer's WS consumer
 * counts. Mirrors the pattern from etoro-client/src/market-data.ts so
 * a silent schema drift between price-service and oracle-signer is
 * visible via `getStreamFailureCount` instead of "buffer empty, signer
 * silent" with no diagnostic.
 */
export type StreamFailureKind = 'ws-parse' | 'ws-unknown-shape' | 'ws-error-event';

export interface StreamErrorSnapshot {
  kind: StreamFailureKind;
  message: string;
  atMs: number;
}

export function emptyStreamFailureCounts(): Record<StreamFailureKind, number> {
  return { 'ws-parse': 0, 'ws-unknown-shape': 0, 'ws-error-event': 0 };
}

export interface PriceWsClientDeps {
  /** Injectable clock for deterministic throttle tests. */
  clock?: () => number;
  /** Throttle window for per-kind console.warn lines. */
  throttleMs?: number;
}

const DEFAULT_THROTTLE_MS = 60_000;

/**
 * Connects to the price-service WebSocket and forwards incoming quotes.
 * Auto-reconnects with exponential backoff on disconnect.
 *
 * Malformed frames, unknown-shape envelopes, and socket-error events
 * are silently *no longer* silent — each increments a per-kind counter
 * (see `getStreamFailureCount`) and emits a single throttled
 * `console.warn`. The counters are read by
 * `OracleSignerService.runWatchdog` to flip the canonical
 * `SERVICE_HEALTH_STATUS=degraded` env-var contract once the cumulative
 * count crosses a threshold.
 */
export class PriceWsClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;
  private closing = false;
  private onQuote: QuoteCallback;
  private readonly url: string;
  private readonly streamFailureCounts = emptyStreamFailureCounts();
  private readonly streamWarnAt = new Map<StreamFailureKind, number>();
  private lastStreamError: StreamErrorSnapshot | undefined;
  private readonly clock: () => number;
  private readonly throttleMs: number;

  constructor(url: string, onQuote: QuoteCallback, deps: PriceWsClientDeps = {}) {
    this.url = url;
    this.onQuote = onQuote;
    this.clock = deps.clock ?? Date.now;
    this.throttleMs = deps.throttleMs ?? DEFAULT_THROTTLE_MS;
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

    this.ws.on('message', (data: WebSocket.Data) => this.handleMessage(data));

    this.ws.on('close', () => {
      this.ws = null;
      if (!this.closing) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (err: Error) => {
      this.recordStreamFailure('ws-error-event', err);
      try { this.ws?.close(); } catch { /* ignore */ }
    });
  }

  /**
   * Public for testability: each failure path is unaddressable from
   * outside the closure-bound 'message' handler, so tests drive frames
   * through this entry point directly. In production it's invoked
   * exactly once per WS message frame.
   */
  handleMessage(data: WebSocket.Data | Buffer | string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof data === 'string' ? data : data.toString());
    } catch (err) {
      this.recordStreamFailure('ws-parse', err);
      return;
    }

    const quotes = this.extractQuotes(parsed);
    if (quotes.length === 0 && parsed !== null && typeof parsed === 'object') {
      // Recognised null/non-object inputs would already yield [] from
      // extractQuotes; we only flag truly unknown envelopes (an object
      // we couldn't decode) so a future protocol upgrade surfaces as
      // schema drift on `/health` instead of silent dead-air.
      const keys = Object.keys(parsed as Record<string, unknown>).join(',');
      this.recordStreamFailure(
        'ws-unknown-shape',
        new Error(`unknown envelope: keys=${keys}`),
      );
      return;
    }

    for (const quote of quotes) {
      if (quote.symbol && Number.isFinite(quote.mid) && quote.mid > 0) {
        this.onQuote(quote);
      }
    }
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
   * Unknown shapes yield zero quotes; the caller flags those as
   * `ws-unknown-shape` for operator visibility.
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

  private recordStreamFailure(kind: StreamFailureKind, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    const atMs = this.clock();
    this.streamFailureCounts[kind] += 1;
    this.lastStreamError = { kind, message, atMs };

    const last = this.streamWarnAt.get(kind) ?? Number.NEGATIVE_INFINITY;
    if (atMs - last > this.throttleMs) {
      this.streamWarnAt.set(kind, atMs);
      console.warn(
        `[oracle-signer] ${kind} (n=${this.streamFailureCounts[kind]}): ${message}`,
      );
    }
  }

  getStreamFailureCount(kind: StreamFailureKind): number {
    return this.streamFailureCounts[kind];
  }

  getStreamFailureCounts(): Record<StreamFailureKind, number> {
    return { ...this.streamFailureCounts };
  }

  getLastStreamError(): StreamErrorSnapshot | undefined {
    return this.lastStreamError;
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
