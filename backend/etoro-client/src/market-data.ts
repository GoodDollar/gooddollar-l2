import { AxiosInstance } from 'axios';
import WebSocket from 'ws';
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

export class MarketDataModule {
  private readonly http: AxiosInstance;
  private readonly config: Required<MarketDataConfig>;
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

  constructor(http: AxiosInstance, config?: MarketDataConfig) {
    this.http = http;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.wsReconnectDelay = this.config.wsReconnectDelayMs;
  }

  // --- Instrument metadata ---

  async getInstruments(symbols?: string[]): Promise<InstrumentMetadata[]> {
    if (this.instrumentCacheExpiry > Date.now() && this.instrumentCache.size > 0) {
      if (!symbols) return [...this.instrumentCache.values()];
      return symbols
        .map((s) => this.instrumentCache.get(s.toUpperCase()))
        .filter((v): v is InstrumentMetadata => v !== undefined);
    }

    const params: Record<string, string> = {};
    if (symbols?.length) params.symbols = symbols.join(',');

    const resp = await this.http.get('/api/v1/market-data/instruments', { params });
    const raw = extractArray(resp.data);
    const results: InstrumentMetadata[] = raw.map((item) => this.normalizeInstrument(item));

    for (const inst of results) {
      this.instrumentCache.set(inst.symbol, inst);
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

  async getQuotes(symbols: string[]): Promise<NormalizedQuote[]> {
    const resp = await this.http.get('/api/v1/market-data/quotes', {
      params: { symbols: symbols.join(',') },
    });
    const raw = extractArray(resp.data);
    const quotes = raw.map((item) => this.normalizeQuote(item));

    for (const q of quotes) {
      this.quoteCache.set(q.symbol, q);
    }

    return quotes;
  }

  getCachedQuote(symbol: string): NormalizedQuote | undefined {
    return this.quoteCache.get(symbol.toUpperCase());
  }

  // --- Candles ---

  async getCandles(
    symbol: string,
    interval: string,
    from: number,
    to: number,
  ): Promise<CandleData[]> {
    const resp = await this.http.get('/api/v1/market-data/candles', {
      params: { symbol, interval, from: String(from), to: String(to) },
    });
    const raw = extractArray(resp.data);
    return raw.map((item) => this.normalizeCandle(item, symbol));
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
    } catch {
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

    this.ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const quotes = Array.isArray(parsed) ? parsed : [parsed];
        for (const raw of quotes) {
          const quote = this.normalizeQuote(raw);
          this.quoteCache.set(quote.symbol, quote);
          for (const listener of this.listeners) {
            try { listener(quote); } catch { /* listener errors don't crash stream */ }
          }
        }
      } catch { /* malformed WS messages ignored */ }
    });

    this.ws.on('close', () => {
      this.wsConnected = false;
      this.startRestFallback();
      this.scheduleReconnect();
    });

    this.ws.on('error', () => {
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
        await this.getQuotes([...this.subscribedSymbols]);
        for (const [, quote] of this.quoteCache) {
          for (const listener of this.listeners) {
            try { listener(quote); } catch { /* ignore */ }
          }
        }
      } catch { /* REST fallback best-effort */ }
    }, this.config.restFallbackIntervalMs);
  }

  private stopRestFallback(): void {
    if (this.restFallbackTimer) {
      clearInterval(this.restFallbackTimer);
      this.restFallbackTimer = null;
    }
  }

  // --- Normalization ---

  private normalizeQuote(raw: unknown): NormalizedQuote {
    const src = asRecord(raw);
    const symbol = pickStr(src, ['symbol', 'ticker', 'instrumentSymbol']) ?? 'UNKNOWN';
    const instrumentId = pickStr(src, ['instrumentId', 'instrumentID', 'instrument_id', 'id']) ?? symbol;
    const bid = pickNum(src, ['bid', 'bidPrice', 'buy']);
    const ask = pickNum(src, ['ask', 'askPrice', 'sell']);
    const last = pickNum(src, ['last', 'lastPrice', 'price', 'currentRate', 'rate']);
    const mid = bid !== undefined && ask !== undefined ? (bid + ask) / 2 : undefined;
    const price = mid ?? last ?? bid ?? ask ?? 0;

    const timestamp = pickTimestamp(src);
    const stale = Date.now() - timestamp > this.config.maxQuoteAgeMs;
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

  private normalizeInstrument(raw: unknown): InstrumentMetadata {
    const src = asRecord(raw);
    return {
      instrumentId: pickStr(src, ['instrumentId', 'instrumentID', 'id']) ?? '',
      symbol: (pickStr(src, ['symbol', 'ticker']) ?? '').toUpperCase(),
      displayName: pickStr(src, ['displayName', 'display_name', 'description', 'fullName']) ?? '',
      exchange: pickStr(src, ['exchange', 'exchangeName', 'market']) ?? '',
      currency: (pickStr(src, ['currency', 'quoteCurrency']) ?? 'USD').toUpperCase(),
      assetClass: normalizeAssetClass(pickStr(src, ['assetClass', 'instrumentType', 'type'])),
      minTradeSize: pickNum(src, ['minTradeSize', 'minPositionAmount']) ?? 1,
      maxLeverage: pickNum(src, ['maxLeverage']) ?? 1,
    };
  }

  private normalizeCandle(raw: unknown, symbol: string): CandleData {
    const src = asRecord(raw);
    return {
      symbol: symbol.toUpperCase(),
      open: pickNum(src, ['open', 'o']) ?? 0,
      high: pickNum(src, ['high', 'h']) ?? 0,
      low: pickNum(src, ['low', 'l']) ?? 0,
      close: pickNum(src, ['close', 'c']) ?? 0,
      volume: pickNum(src, ['volume', 'v']) ?? 0,
      timestamp: pickTimestamp(src),
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

function pickTimestamp(src: Record<string, unknown>): number {
  const raw = src.timestamp ?? src.updatedAt ?? src.time ?? src.lastUpdate;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 10_000_000_000 ? raw : raw * 1000;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
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

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  for (const key of ['instruments', 'quotes', 'candles', 'items', 'data', 'results']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}
