import { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { AUDIT_CONSOLE_THROTTLE_MS, AuditLogger, maskTokens } from './audit-logger';
import { HttpDispatcher, identityDispatcher } from './rate-limiter';
import { MalformedListSink, readListOrAudit } from './util/list-envelope';
import { InstrumentResolver, ResolvedInstrument } from './instrument-resolver';
import {
  NormalizedQuote,
  InstrumentMetadata,
  CandleData,
  SessionState,
  EtoroAssetClass,
  MarketDataConfig,
  QuoteCallback,
} from './types';

const US_MARKET_TZ = 'America/New_York';

const DEFAULT_CONFIG: Required<MarketDataConfig> = {
  wsUrl: '',
  restFallbackIntervalMs: 5_000,
  maxQuoteAgeMs: 5 * 60_000,
  wsReconnectDelayMs: 1_000,
  wsReconnectMaxDelayMs: 30_000,
};

/**
 * The four streaming-path failure categories the SDK distinguishes for
 * operator-visible counters and audit-log lines. Each has its own
 * throttle clock so a parse-failure storm never silences an
 * unrelated socket error.
 */
export type StreamFailureKind =
  | 'ws-construct'
  | 'ws-parse'
  | 'ws-error-event'
  | 'rest-fallback';

const STREAM_FAILURE_ACTION: Record<StreamFailureKind, string> = {
  'ws-construct': 'ws-construct-failed',
  'ws-parse': 'ws-parse-failed',
  'ws-error-event': 'ws-error-event',
  'rest-fallback': 'rest-fallback-failed',
};

export interface StreamErrorSnapshot {
  kind: StreamFailureKind;
  message: string;
  atMs: number;
}

export function emptyStreamFailureCounts(): Record<StreamFailureKind, number> {
  return { 'ws-construct': 0, 'ws-parse': 0, 'ws-error-event': 0, 'rest-fallback': 0 };
}

/**
 * Compact one-line representation of the four streaming-path failure
 * counters, used by `EtoroClient.getSummary()`. Accepts `undefined` so a
 * source that doesn't implement the optional counter getter still
 * renders as all-zeros without the caller having to assemble the
 * defaults itself.
 */
export function formatStreamFailures(
  counts: Record<StreamFailureKind, number> | undefined,
): string {
  const c = counts ?? emptyStreamFailureCounts();
  return (
    `ws-construct=${c['ws-construct']} ` +
    `ws-parse=${c['ws-parse']} ` +
    `ws-error=${c['ws-error-event']} ` +
    `rest-fallback=${c['rest-fallback']}`
  );
}

/**
 * Injectable dependencies for `MarketDataModule`. All optional; defaults
 * preserve production behavior (no audit logger, wall-clock time, real
 * `console.error`).
 */
export interface MarketDataDeps {
  /**
   * Optional audit logger. When wired, malformed-payload drops emit one
   * audit line per dropped record (`action: 'normalizeQuote-malformed'`).
   * Defaults to a no-op sink so existing direct-construction callers are
   * unaffected.
   */
  audit?: AuditLogger;
  /** Injectable clock so throttle tests are deterministic. */
  clock?: () => number;
  /** Injectable `console.error` for throttle tests without spying on globals. */
  consoleErrorImpl?: (message: string) => void;
  /**
   * HTTP dispatcher (typically `EtoroClient.withRateLimit`) so REST
   * methods share the SDK's single rate-limit bucket. Defaults to a
   * no-retry pass-through.
   */
  dispatch?: HttpDispatcher;
  /**
   * If `true`, list-returning endpoints throw
   * `MalformedListResponseError` when the upstream payload does not
   * match `LIST_ENVELOPE_KEYS`. Defaults to `false` (return `[]` and
   * audit-log) to preserve back-compat.
   */
  throwOnMalformedListResponse?: boolean;
  /**
   * Resolver used to translate lane symbols into eToro instrument IDs
   * for the `/market-data/instruments/rates` endpoint. Required when the
   * module is constructed in a mode that talks to the real API; for
   * test contexts a stub or null-object resolver can be supplied.
   * Defaults to a resolver wrapping the provided `http` if absent.
   */
  resolver?: InstrumentResolver;
}

/** Max instrumentIds per `/market-data/instruments/rates` request. */
const RATES_BATCH_SIZE = 100;
const RATES_PATH = '/market-data/instruments/rates';

/**
 * Grace window for quote timestamps that arrive slightly ahead of the
 * local wall clock (NTP drift, upstream skew). A timestamp beyond
 * `now + FUTURE_TIMESTAMP_GRACE_MS` is treated as malformed.
 */
const FUTURE_TIMESTAMP_GRACE_MS = 30_000;

/**
 * Result of parsing a timestamp field off a raw payload. The discriminated
 * shape lets the caller route the three malformed cases through the same
 * `recordMalformedQuote` channel with operator-readable reason keys.
 */
type TimestampResult =
  | { ok: true; ms: number }
  | { ok: false; reason: 'absent' | 'negative' | 'future' };

export class MarketDataModule {
  private readonly http: AxiosInstance;
  private readonly config: Required<MarketDataConfig>;
  private readonly audit: AuditLogger | undefined;
  private readonly clock: () => number;
  private readonly consoleErrorImpl: (message: string) => void;
  private readonly dispatch: HttpDispatcher;
  private instrumentCache = new Map<string, InstrumentMetadata>();
  private instrumentCacheExpiry = 0;
  private readonly quoteCache = new Map<string, NormalizedQuote>();
  private ws: WebSocket | null = null;
  private wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsReconnectDelay: number;
  private restFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private wsConnected = false;
  private subscribedSymbols = new Set<string>();
  private readonly listeners: QuoteCallback[] = [];
  private stopped = false;
  private malformedQuoteCount = 0;
  private lastMalformedKeys: string[] | undefined;
  private lastMalformedConsoleErrorAt = Number.NEGATIVE_INFINITY;
  private readonly streamFailureCounts = emptyStreamFailureCounts();
  private readonly streamConsoleErrorAt = new Map<StreamFailureKind, number>();
  private lastStreamError: StreamErrorSnapshot | undefined;
  private readonly malformedListSink: MalformedListSink;
  private readonly resolver: InstrumentResolver;

  constructor(http: AxiosInstance, config?: MarketDataConfig, deps?: MarketDataDeps) {
    this.http = http;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.wsReconnectDelay = this.config.wsReconnectDelayMs;
    this.audit = deps?.audit;
    this.clock = deps?.clock ?? Date.now;
    this.consoleErrorImpl = deps?.consoleErrorImpl ?? ((message) => console.error(message));
    this.dispatch = deps?.dispatch ?? identityDispatcher;
    this.malformedListSink = {
      audit: this.audit,
      counter: new Map<string, number>(),
      throwOnMalformed: deps?.throwOnMalformedListResponse ?? false,
    };
    this.resolver = deps?.resolver ?? new InstrumentResolver({
      http,
      audit: this.audit,
      dispatch: this.dispatch,
      malformedListSink: this.malformedListSink,
    });
  }

  // --- Instrument metadata ---

  /**
   * Resolves the given symbols via `/market-data/search` (one call per
   * symbol, cached for 24 h by `InstrumentResolver`) and produces
   * lane-shaped `InstrumentMetadata` records. When `symbols` is
   * omitted, returns the in-memory cache contents — the official API
   * has no "list all" endpoint, so a cold start with no symbols hint
   * returns `[]`.
   */
  async getInstruments(symbols?: string[]): Promise<InstrumentMetadata[]> {
    if (!symbols?.length) {
      if (this.instrumentCacheExpiry > Date.now() && this.instrumentCache.size > 0) {
        return [...this.instrumentCache.values()];
      }
      return [];
    }

    const cached = symbols
      .map((s) => this.instrumentCache.get(s.toUpperCase()))
      .filter((v): v is InstrumentMetadata => v !== undefined);
    if (cached.length === symbols.length
        && this.instrumentCacheExpiry > Date.now()) {
      return cached;
    }

    const results: InstrumentMetadata[] = [];
    for (const sym of symbols) {
      const resolved = await this.resolver.resolve(sym);
      const meta = toInstrumentMetadata(resolved);
      this.instrumentCache.set(meta.symbol, meta);
      results.push(meta);
    }
    this.instrumentCacheExpiry = Date.now() + 5 * 60_000;
    return results;
  }

  async getInstrument(symbol: string): Promise<InstrumentMetadata | null> {
    const results = await this.getInstruments([symbol]);
    return results[0] ?? null;
  }

  // --- Quotes ---

  async getQuote(symbol: string): Promise<NormalizedQuote | null> {
    const quotes = await this.getQuotes([symbol]);
    return quotes[0] ?? null;
  }

  /**
   * Resolves symbols → instrumentIds via `InstrumentResolver`, batches up
   * to `RATES_BATCH_SIZE` IDs per `/market-data/instruments/rates`
   * request, and normalizes the `rates` envelope per the lane's
   * `OFFICIAL_ETORO_API_PRICE_SOURCE.md` contract.
   */
  async getQuotes(symbols: string[]): Promise<NormalizedQuote[]> {
    if (symbols.length === 0) return [];

    const resolved = await this.resolver.resolveMany(symbols);
    const idToSymbol = new Map<string, string>();
    for (const [sym, info] of resolved) idToSymbol.set(info.instrumentId, sym);

    const ids = [...idToSymbol.keys()];
    const quotes: NormalizedQuote[] = [];

    for (let i = 0; i < ids.length; i += RATES_BATCH_SIZE) {
      const batch = ids.slice(i, i + RATES_BATCH_SIZE);
      const { value: resp } = await this.dispatch(() =>
        this.http.get(RATES_PATH, {
          params: { instrumentIds: batch.join(',') },
        }),
      );
      const raw = readListOrAudit({
        data: resp.data,
        action: 'getQuotes',
        path: RATES_PATH,
        sink: this.malformedListSink,
      });
      for (const item of raw) {
        const quote = this.normalizeRate(item, idToSymbol);
        if (quote === null) continue;
        this.quoteCache.set(quote.symbol, quote);
        quotes.push(quote);
      }
    }
    return quotes;
  }

  getCachedQuote(symbol: string): NormalizedQuote | undefined {
    return this.quoteCache.get(symbol.toUpperCase());
  }

  /**
   * Count of inbound quote records that were rejected because their
   * payload omitted every recognized symbol field. Surfaced via
   * `EtoroClient.getSummary().malformedQuotes` so an operator can spot a
   * schema drift / partial outage from a single field.
   */
  getMalformedQuoteCount(): number {
    return this.malformedQuoteCount;
  }

  /**
   * Keys (sorted) of the most recently dropped malformed payload, or
   * `undefined` if none have been seen. Keys only — never values — to
   * keep secrets out of the diagnostic surface.
   */
  getLastMalformedKeys(): string[] | undefined {
    return this.lastMalformedKeys;
  }

  /** Count of failures observed for one streaming-path failure kind. */
  getStreamFailureCount(kind: StreamFailureKind): number {
    return this.streamFailureCounts[kind];
  }

  /** Snapshot of all four streaming-path failure counters. */
  getStreamFailureCounts(): Record<StreamFailureKind, number> {
    return { ...this.streamFailureCounts };
  }

  /** Most recent streaming-path failure across all kinds (undefined if none). */
  getLastStreamError(): StreamErrorSnapshot | undefined {
    return this.lastStreamError;
  }

  /**
   * Count of 200-OK responses that returned an unrecognized envelope
   * shape for the named SDK method. Drives operator-facing schema-drift
   * alerts via `EtoroClient.getSummary().malformedListResponses`.
   */
  getMalformedListResponseCount(action: string): number {
    return this.malformedListSink.counter.get(action) ?? 0;
  }

  /** Snapshot of all malformed-list response counters keyed by action. */
  getMalformedListResponseCounts(): Record<string, number> {
    return Object.fromEntries(this.malformedListSink.counter);
  }

  // --- Candles ---

  async getCandles(
    symbol: string,
    interval: string,
    from: number,
    to: number,
  ): Promise<CandleData[]> {
    const path = '/market-data/candles';
    const { value: resp } = await this.dispatch(() =>
      this.http.get(path, {
        params: { symbol, interval, from: String(from), to: String(to) },
      }),
    );
    const raw = readListOrAudit({
      data: resp.data,
      action: 'getCandles',
      path,
      sink: this.malformedListSink,
    });
    return raw
      .map((item) => this.normalizeCandle(item, symbol))
      .filter((c): c is CandleData => c !== null);
  }

  // --- Session state ---

  detectSessionState(symbol?: string, now?: Date): SessionState {
    const date = now ?? new Date();
    return detectUSMarketSession(date, symbol);
  }

  async getSessionState(symbol: string): Promise<SessionState> {
    return this.detectSessionState(symbol);
  }

  // --- WebSocket streaming ---

  onQuote(callback: QuoteCallback): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  subscribe(symbols: string[]): void {
    for (const s of symbols) this.subscribedSymbols.add(s.toUpperCase());
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(symbols);
    }
  }

  startStreaming(): void {
    this.stopped = false;
    if (!this.config.wsUrl) {
      this.startRestFallback();
      return;
    }
    this.connectWebSocket();
  }

  stopStreaming(): void {
    this.stopped = true;
    this.cleanupWs();
    this.stopRestFallback();
  }

  isStreaming(): boolean {
    return this.wsConnected || this.restFallbackTimer !== null;
  }

  // --- Internal: WebSocket ---

  private connectWebSocket(): void {
    if (this.stopped) return;
    this.cleanupWs();

    try {
      this.ws = new WebSocket(this.config.wsUrl);
    } catch (err: unknown) {
      this.recordStreamFailure('ws-construct', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.on('open', () => {
      this.wsConnected = true;
      this.wsReconnectDelay = this.config.wsReconnectDelayMs;
      this.stopRestFallback();
      if (this.subscribedSymbols.size > 0) {
        this.sendSubscription([...this.subscribedSymbols]);
      }
    });

    this.ws.on('message', (data) => this.handleWsMessage(data));

    this.ws.on('close', () => {
      this.wsConnected = false;
      this.startRestFallback();
      this.scheduleReconnect();
    });

    this.ws.on('error', (err: Error) => {
      this.recordStreamFailure('ws-error-event', err);
      this.wsConnected = false;
      this.ws?.close();
    });
  }

  private sendSubscription(symbols: string[]): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', symbols }));
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.wsReconnectTimer) return;
    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      this.wsReconnectDelay = Math.min(
        this.wsReconnectDelay * 2,
        this.config.wsReconnectMaxDelayMs,
      );
      this.connectWebSocket();
    }, this.wsReconnectDelay);
  }

  private cleanupWs(): void {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      try { this.ws.close(); } catch { /* safe close */ }
      this.ws = null;
    }
    this.wsConnected = false;
  }

  // --- Internal: REST fallback ---

  private startRestFallback(): void {
    if (this.stopped || this.restFallbackTimer) return;
    this.restFallbackTimer = setInterval(async () => {
      if (this.subscribedSymbols.size === 0) return;
      try {
        const fresh = await this.getQuotes([...this.subscribedSymbols]);
        for (const quote of fresh) {
          if (!this.subscribedSymbols.has(quote.symbol)) continue;
          if (quote.stale) continue;
          for (const listener of this.listeners) {
            try { listener(quote); } catch { /* listener errors don't crash stream */ }
          }
        }
      } catch (err: unknown) {
        this.recordStreamFailure('rest-fallback', err);
      }
    }, this.config.restFallbackIntervalMs);
  }

  private stopRestFallback(): void {
    if (this.restFallbackTimer) {
      clearInterval(this.restFallbackTimer);
      this.restFallbackTimer = null;
    }
  }

  // --- Normalization ---

  /**
   * Parse a WS frame and route each contained quote through the same
   * null-dropping pipeline as the REST path. Exposed as a method (not an
   * inline lambda) so tests can drive the path without booting a real
   * WebSocket. Malformed JSON frames are recorded via the audit logger,
   * not silently swallowed.
   */
  handleWsMessage(data: WebSocket.RawData | string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof data === 'string' ? data : data.toString());
    } catch (err: unknown) {
      this.recordStreamFailure('ws-parse', err);
      return;
    }
    const quotes = Array.isArray(parsed) ? parsed : [parsed];
    for (const raw of quotes) {
      const quote = this.normalizeQuote(raw);
      if (quote === null) continue;
      this.quoteCache.set(quote.symbol, quote);
      for (const listener of this.listeners) {
        try { listener(quote); } catch { /* listener errors don't crash stream */ }
      }
    }
  }

  private normalizeQuote(raw: unknown): NormalizedQuote | null {
    const src = asRecord(raw);
    const symbol = pickStr(src, ['symbol', 'ticker', 'instrumentSymbol']);
    if (symbol === undefined) {
      this.recordMalformedQuote(src);
      return null;
    }
    const now = this.clock();
    const ts = pickTimestamp(src, now);
    if (!ts.ok) {
      this.recordMalformedQuote(src, `ts=${ts.reason}`);
      return null;
    }
    const instrumentId = pickStr(src, ['instrumentId', 'instrumentID', 'instrument_id', 'id']) ?? symbol;
    const bid = pickNum(src, ['bid', 'bidPrice', 'buy']);
    const ask = pickNum(src, ['ask', 'askPrice', 'sell']);
    const last = pickNum(src, ['last', 'lastPrice', 'price', 'currentRate', 'rate']);
    const mid = bid !== undefined && ask !== undefined ? (bid + ask) / 2 : undefined;
    const price = mid ?? last ?? bid ?? ask ?? 0;

    const timestamp = ts.ms;
    const stale = now - timestamp > this.config.maxQuoteAgeMs;
    const assetClass = normalizeAssetClass(pickStr(src, ['assetClass', 'instrumentType', 'type']));
    const sessionState = this.detectSessionState(symbol.toUpperCase());

    return {
      source: 'etoro',
      symbol: symbol.toUpperCase(),
      instrumentId,
      bid: bid ?? 0,
      ask: ask ?? 0,
      mid: mid ?? price,
      last: last ?? price,
      timestamp,
      sessionState,
      confidence: computeConfidence({ bid, ask, mid, price, stale }),
      assetClass,
      currency: pickStr(src, ['currency', 'quoteCurrency']) ?? 'USD',
      stale,
    };
  }

  /**
   * Canonical pipeline for every silent-swallow site on the streaming
   * path. Increments the per-kind counter, captures the masked error
   * message + timestamp for `getLastStreamError`, audit-logs one
   * `PRE-CHECK` line per occurrence, and emits a `console.error`
   * heartbeat throttled to one per `AUDIT_CONSOLE_THROTTLE_MS` per
   * kind. Reconnect / close / interval behavior at the call site is
   * unchanged — only operator visibility is added.
   */
  private recordStreamFailure(kind: StreamFailureKind, err: unknown): void {
    const raw = err instanceof Error ? err.message : String(err);
    const message = maskTokens(raw);
    const atMs = this.clock();

    this.streamFailureCounts[kind] += 1;
    this.lastStreamError = { kind, message, atMs };

    this.audit?.log({
      action: STREAM_FAILURE_ACTION[kind],
      method: 'PRE-CHECK',
      path: '/market-data/stream',
      error: message,
    });

    const last = this.streamConsoleErrorAt.get(kind) ?? Number.NEGATIVE_INFINITY;
    if (atMs - last > AUDIT_CONSOLE_THROTTLE_MS) {
      this.streamConsoleErrorAt.set(kind, atMs);
      this.consoleErrorImpl(
        `[etoro-stream] ${kind} failed (n=${this.streamFailureCounts[kind]}): ${message}`,
      );
    }
  }

  private recordMalformedQuote(src: Record<string, unknown>, reason?: string): void {
    const keys = Object.keys(src).sort();
    this.malformedQuoteCount += 1;
    this.lastMalformedKeys = keys;

    const reasonStr = reason ? ` ${reason}` : '';
    const errorMsg = `malformed-quote${reasonStr} keys=[${keys.join(',')}]`;
    this.audit?.log({
      action: 'normalizeQuote-malformed',
      method: 'PARSE',
      path: '/market-data/normalize',
      error: errorMsg,
    });

    const now = this.clock();
    if (now - this.lastMalformedConsoleErrorAt > AUDIT_CONSOLE_THROTTLE_MS) {
      this.lastMalformedConsoleErrorAt = now;
      this.consoleErrorImpl(
        `[etoro-market-data] dropped malformed quote (n=${this.malformedQuoteCount}): ${errorMsg}`,
      );
    }
  }

  /**
   * Normalize one `/market-data/instruments/rates` envelope entry per
   * the rules in `OFFICIAL_ETORO_API_PRICE_SOURCE.md`:
   *   - Defensive `instrumentID` ↔ `instrumentId` casing.
   *   - `bid` / `ask` / `lastExecution` parsed as decimals.
   *   - Preferred mid: `(bid + ask) / 2` only when BOTH are positive
   *     finite; otherwise fall back to `lastExecution` with lower
   *     confidence.
   *   - Timestamp from rate `date`; rate is marked `stale` if older
   *     than `maxQuoteAgeMs`.
   * Records with no recognizable instrument ID are dropped via the
   * shared malformed-quote channel so an upstream rename surfaces.
   */
  private normalizeRate(
    raw: unknown,
    idToSymbol: Map<string, string>,
  ): NormalizedQuote | null {
    const src = asRecord(raw);
    const instrumentId = pickStr(src, ['instrumentID', 'instrumentId', 'instrument_id']);
    if (instrumentId === undefined) {
      this.recordMalformedQuote(src);
      return null;
    }
    const symbol = idToSymbol.get(instrumentId) ?? instrumentId;
    const now = this.clock();
    const ts = pickTimestamp(src, now);
    if (!ts.ok) {
      this.recordMalformedQuote(src, `ts=${ts.reason}`);
      return null;
    }
    const bid = pickNum(src, ['bid']);
    const ask = pickNum(src, ['ask']);
    const last = pickNum(src, ['lastExecution', 'last']);
    const bothBidAsk = bid !== undefined && bid > 0 && ask !== undefined && ask > 0;
    const mid = bothBidAsk ? (bid + ask) / 2 : undefined;
    const price = mid ?? last ?? 0;

    const timestamp = ts.ms;
    const stale = now - timestamp > this.config.maxQuoteAgeMs;
    const sessionState = this.detectSessionState(symbol.toUpperCase());

    return {
      source: 'etoro',
      symbol: symbol.toUpperCase(),
      instrumentId,
      bid: bid ?? 0,
      ask: ask ?? 0,
      mid: mid ?? price,
      last: last ?? price,
      timestamp,
      sessionState,
      confidence: computeConfidence({ bid, ask, mid, price, stale }),
      currency: pickStr(src, ['currency', 'quoteCurrency']) ?? 'USD',
      stale,
    };
  }

  private normalizeCandle(raw: unknown, symbol: string): CandleData | null {
    const src = asRecord(raw);
    const ts = pickTimestamp(src, this.clock());
    if (!ts.ok) {
      this.recordMalformedQuote(src, `candle-ts=${ts.reason}`);
      return null;
    }
    return {
      symbol: symbol.toUpperCase(),
      open: pickNum(src, ['open', 'o']) ?? 0,
      high: pickNum(src, ['high', 'h']) ?? 0,
      low: pickNum(src, ['low', 'l']) ?? 0,
      close: pickNum(src, ['close', 'c']) ?? 0,
      volume: pickNum(src, ['volume', 'v']) ?? 0,
      timestamp: ts.ms,
    };
  }
}

// --- Market hours detection ---

export function detectUSMarketSession(date: Date, _symbol?: string): SessionState {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: US_MARKET_TZ,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const timeMinutes = hour * 60 + minute;

  if (['Sat', 'Sun'].includes(weekday)) return 'closed';

  // Pre-market: 4:00 - 9:30 ET
  if (timeMinutes >= 240 && timeMinutes < 570) return 'pre-market';
  // Regular: 9:30 - 16:00 ET
  if (timeMinutes >= 570 && timeMinutes < 960) return 'open';
  // After-hours: 16:00 - 20:00 ET
  if (timeMinutes >= 960 && timeMinutes < 1200) return 'after-hours';

  return 'closed';
}

// --- Confidence scoring (0-100 scale, matching StockOracleV2 uint8) ---

/**
 * Computes a 0-100 integer confidence score for a normalized quote.
 * Scoring factors:
 *   - Base 50 for any valid price
 *   - +30 if both bid and ask are present (two-sided market)
 *   - +20 scaled by spread tightness (spread < 0.1% → full bonus, > 3% → 0)
 *   - Stale → 0
 */
export function computeConfidence(input: {
  bid?: number;
  ask?: number;
  mid?: number;
  price: number;
  stale: boolean;
}): number {
  if (input.stale || input.price <= 0) return 0;

  let score = 50;

  const hasBidAsk = input.bid !== undefined && input.bid > 0
    && input.ask !== undefined && input.ask > 0;

  if (hasBidAsk) {
    score += 30;

    const mid = input.mid ?? (input.bid! + input.ask!) / 2;
    if (mid > 0) {
      const spreadPct = ((input.ask! - input.bid!) / mid) * 100;
      const spreadBonus = Math.max(0, 20 * (1 - spreadPct / 3));
      score += spreadBonus;
    }
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

// --- Helpers ---

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function pickStr(src: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = src[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function pickNum(src: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = src[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const parsed = Number(v.replace(/,/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

/**
 * Parse a timestamp field off a raw payload, returning a discriminated
 * result so the caller can route malformed cases through
 * `recordMalformedQuote` with a precise reason key.
 *
 * Rejected as malformed:
 *   - field absent or unparseable                  → reason 'absent'
 *   - negative timestamp                           → reason 'negative'
 *   - timestamp > now + FUTURE_TIMESTAMP_GRACE_MS  → reason 'future'
 */
function pickTimestamp(src: Record<string, unknown>, now: number): TimestampResult {
  const raw = src.date ?? src.timestamp ?? src.updatedAt ?? src.time ?? src.lastUpdate;
  let ms: number | null = null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    ms = raw > 10_000_000_000 ? raw : raw * 1000;
  } else if (typeof raw === 'string' && raw.trim()) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) ms = parsed;
  }
  if (ms === null) return { ok: false, reason: 'absent' };
  if (ms < 0) return { ok: false, reason: 'negative' };
  if (ms > now + FUTURE_TIMESTAMP_GRACE_MS) return { ok: false, reason: 'future' };
  return { ok: true, ms };
}

/**
 * Map a `ResolvedInstrument` from `InstrumentResolver` into the
 * lane-shaped `InstrumentMetadata` consumed by downstream services.
 * Fields the search endpoint does not return (`exchange`,
 * `minTradeSize`, `maxLeverage`) default to safe lane values.
 */
function toInstrumentMetadata(r: ResolvedInstrument): InstrumentMetadata {
  return {
    instrumentId: r.instrumentId,
    symbol: r.symbol.toUpperCase(),
    displayName: r.displayName,
    exchange: '',
    currency: 'USD',
    assetClass: normalizeAssetClass(r.instrumentType),
    minTradeSize: 1,
    maxLeverage: 1,
  };
}

function normalizeAssetClass(raw?: string): EtoroAssetClass {
  const v = (raw ?? '').trim().toLowerCase();
  if (['stock', 'stocks', 'equity', 'equities'].includes(v)) return 'equity';
  if (['etf', 'fund'].includes(v)) return 'etf';
  if (['crypto', 'cryptocurrency'].includes(v)) return 'crypto';
  if (['fx', 'forex', 'currency'].includes(v)) return 'forex';
  if (['index', 'indices'].includes(v)) return 'index';
  if (['commodity', 'commodities'].includes(v)) return 'commodity';
  return 'unknown';
}

export { toInstrumentMetadata };

