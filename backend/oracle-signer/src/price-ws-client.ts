import WebSocket from 'ws';
import { NormalizedQuote } from './types';

export type QuoteCallback = (quote: NormalizedQuote) => void;

/**
 * Per-reason bookkeeping for WS messages reaching the signer's ingest path.
 * Counters are cumulative since process start; `lastDropped*` fields capture
 * the most recent rejection so an operator hitting `/api/oracle/status` sees
 * the latest failing payload class without grepping logs.
 */
export interface IngestStats {
  accepted: number;
  droppedJsonParse: number;
  droppedShape: number;
  droppedInvalidMid: number;
  droppedMissingSymbol: number;
  lastDroppedAtMs?: number;
  lastDroppedReason?: string;
  lastDroppedSnippet?: string;
}

type DropReason = 'droppedJsonParse' | 'droppedShape' | 'droppedInvalidMid' | 'droppedMissingSymbol';

const SNIPPET_MAX_LEN = 80;
const WARN_THROTTLE_MS = 60_000;

/** Public zero-counter constant. Useful as a safe default in callers that may
 *  receive a stats-less proof snapshot from an older signer build. */
export function emptyIngestStats(): IngestStats {
  return {
    accepted: 0,
    droppedJsonParse: 0,
    droppedShape: 0,
    droppedInvalidMid: 0,
    droppedMissingSymbol: 0,
  };
}

/**
 * Reduce a malformed WS payload to a redacted, ≤80-char snippet safe to
 * include in HTTP responses or logs. Strips backticks, quotes, and any
 * CR/LF; clamps after coercion to UTF-8 string.
 */
export function redactSnippet(raw: string): string {
  const stripped = raw.replace(/[`'"\r\n]/g, ' ');
  return stripped.length > SNIPPET_MAX_LEN ? stripped.slice(0, SNIPPET_MAX_LEN) : stripped;
}

/**
 * Connects to the price-service WebSocket and forwards incoming quotes.
 * Auto-reconnects with exponential backoff on disconnect. Tracks per-reason
 * drop counters for any payload that fails JSON parse, shape validation, or
 * the finite/positive `mid` check; counters are exposed via `getStats()` and
 * surfaced to operators through the signer's `/proof` endpoint.
 */
export class PriceWsClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;
  private closing = false;
  private onQuote: QuoteCallback;
  private readonly url: string;

  private readonly stats: IngestStats = emptyIngestStats();
  private readonly lastWarnAtMsByReason = new Map<DropReason, number>();

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
      this.handleMessage(data.toString());
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

  /**
   * Exposed separately from the WS handler so unit tests can drive the
   * ingest path without standing up a real WS server. Pure: same input
   * always lands in the same counter bucket.
   */
  handleMessage(raw: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.recordDrop('droppedJsonParse', raw, err);
      return;
    }

    const quote = this.extractQuote(parsed);
    if (!quote) {
      this.recordDrop('droppedShape', raw, new Error('not a quote envelope'));
      return;
    }
    if (!quote.symbol || typeof quote.symbol !== 'string') {
      this.recordDrop('droppedMissingSymbol', raw, new Error('missing symbol'));
      return;
    }
    if (!Number.isFinite(quote.mid) || quote.mid <= 0) {
      this.recordDrop('droppedInvalidMid', raw, new Error(`invalid mid: ${String(quote.mid)}`));
      return;
    }

    this.stats.accepted += 1;
    this.onQuote(quote);
  }

  private recordDrop(reason: DropReason, raw: string, err: unknown): void {
    this.stats[reason] += 1;
    const snippet = redactSnippet(raw);
    const reasonText = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    this.stats.lastDroppedAtMs = Date.now();
    this.stats.lastDroppedReason = reasonText.length > SNIPPET_MAX_LEN
      ? reasonText.slice(0, SNIPPET_MAX_LEN)
      : reasonText;
    this.stats.lastDroppedSnippet = snippet;
    this.maybeWarn(reason, snippet, reasonText);
  }

  private maybeWarn(reason: DropReason, snippet: string, reasonText: string): void {
    const now = Date.now();
    const last = this.lastWarnAtMsByReason.get(reason) ?? 0;
    if (now - last < WARN_THROTTLE_MS) return;
    this.lastWarnAtMsByReason.set(reason, now);
    console.warn(
      `[oracle-signer:ingest] ${reason} (${reasonText}) — snippet: ${snippet}`,
    );
  }

  private scheduleReconnect(): void {
    setTimeout(() => this.doConnect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  /**
   * Handles both the WsBroadcaster envelope format ({ type: 'quote', data: NormalizedQuote })
   * and raw NormalizedQuote messages for backward compatibility.
   */
  private extractQuote(parsed: unknown): NormalizedQuote | null {
    if (!parsed || typeof parsed !== 'object') return null;
    const msg = parsed as Record<string, unknown>;

    if (msg.type === 'quote' && msg.data && typeof msg.data === 'object') {
      return msg.data as NormalizedQuote;
    }

    if ('symbol' in msg && 'mid' in msg) {
      return msg as unknown as NormalizedQuote;
    }

    return null;
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

  /** Snapshot of ingest counters. Returns a shallow clone so callers cannot
   *  mutate internal state. */
  getStats(): IngestStats {
    return { ...this.stats };
  }
}
