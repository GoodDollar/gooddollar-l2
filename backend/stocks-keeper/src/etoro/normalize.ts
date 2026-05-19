import { EtoroAssetClass, EtoroInstrument, GoodChainMarketQuote, OraclePriceUpdate } from './types';

const ONE_E8 = 100_000_000;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.replace(/,/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function pickTimestamp(source: Record<string, unknown>): number {
  const raw = source.timestamp ?? source.updatedAt ?? source.updated_at ?? source.time ?? source.lastUpdate;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 10_000_000_000 ? raw : raw * 1000;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) return numeric > 10_000_000_000 ? numeric : numeric * 1000;
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

export function normalizeAssetClass(raw?: string): EtoroAssetClass {
  const value = (raw ?? '').trim().toLowerCase();
  if (['stock', 'stocks', 'equity', 'equities', 'share', 'shares'].includes(value)) return 'equity';
  if (['etf', 'fund'].includes(value)) return 'etf';
  if (['crypto', 'cryptocurrency', 'coin'].includes(value)) return 'crypto';
  if (['fx', 'forex', 'currency', 'currencies'].includes(value)) return 'forex';
  if (['index', 'indices'].includes(value)) return 'index';
  if (['commodity', 'commodities'].includes(value)) return 'commodity';
  return 'unknown';
}

export function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase().replace(/^\$+/, '').replace(/\s+/g, '');
}

export function normalizeInstrument(raw: unknown, defaults: Partial<EtoroInstrument> = {}): EtoroInstrument {
  const source = asRecord(raw);
  const symbol = normalizeSymbol(
    pickString(source, ['symbol', 'ticker', 'instrumentSymbol', 'displaySymbol', 'name']) ?? defaults.symbol ?? defaults.ticker ?? 'UNKNOWN',
  );
  const instrumentId =
    pickString(source, ['instrumentId', 'instrumentID', 'instrument_id', 'id', 'securityId']) ??
    defaults.instrumentId ??
    symbol;

  const exchange = pickString(source, ['exchange', 'exchangeName', 'market', 'venue']) ?? defaults.exchange;
  const currency =
    pickString(source, ['currency', 'quoteCurrency', 'quote_currency', 'baseCurrency']) ?? defaults.currency ?? 'USD';
  const assetClass = normalizeAssetClass(
    pickString(source, ['assetClass', 'instrumentType', 'type', 'securityType']) ?? defaults.assetClass,
  );

  return {
    instrumentId,
    symbol,
    ticker: normalizeSymbol(defaults.ticker ?? symbol),
    displayName: pickString(source, ['displayName', 'display_name', 'description', 'fullName']) ?? defaults.displayName,
    exchange,
    currency: currency.toUpperCase(),
    assetClass,
    source: 'etoro',
    raw,
  };
}

export function toPriceE8(price: number): bigint {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid market price: ${price}`);
  }
  return BigInt(Math.round(price * ONE_E8));
}

export function normalizeQuote(
  raw: unknown,
  instrumentDefaults: Partial<EtoroInstrument> = {},
  opts: { maxAgeMs?: number; now?: number } = {},
): GoodChainMarketQuote {
  const source = asRecord(raw);
  const instrument = normalizeInstrument(raw, instrumentDefaults);
  const bid = pickNumber(source, ['bid', 'bidPrice', 'buy', 'buyPrice']);
  const ask = pickNumber(source, ['ask', 'askPrice', 'sell', 'sellPrice']);
  const last = pickNumber(source, ['last', 'lastPrice', 'price', 'regularMarketPrice', 'currentRate', 'rate']);
  const mid = bid && ask ? (bid + ask) / 2 : undefined;
  const price = mid ?? last ?? bid ?? ask;

  if (!price || !Number.isFinite(price) || price <= 0) {
    throw new Error(`Missing valid eToro price for ${instrument.symbol}`);
  }

  const timestamp = pickTimestamp(source);
  const now = opts.now ?? Date.now();
  const maxAgeMs = opts.maxAgeMs ?? 5 * 60 * 1000;
  const exchangePart = instrument.exchange ? `${instrument.exchange}:` : '';

  return {
    source: 'etoro',
    instrumentId: instrument.instrumentId,
    symbol: instrument.symbol,
    ticker: instrument.ticker,
    goodChainKey: `ETORO:${exchangePart}${instrument.symbol}`,
    assetClass: instrument.assetClass,
    exchange: instrument.exchange,
    currency: instrument.currency,
    bid,
    ask,
    last,
    price,
    priceE8: toPriceE8(price),
    timestamp,
    stale: now - timestamp > maxAgeMs,
    raw,
  };
}

export function normalizeQuotes(rawQuotes: unknown[], instrumentsByIdOrSymbol = new Map<string, Partial<EtoroInstrument>>()): GoodChainMarketQuote[] {
  return rawQuotes.map((raw) => {
    const record = asRecord(raw);
    const key =
      pickString(record, ['instrumentId', 'instrumentID', 'instrument_id', 'id']) ??
      pickString(record, ['symbol', 'ticker', 'instrumentSymbol']);
    const defaults = key ? instrumentsByIdOrSymbol.get(key) ?? instrumentsByIdOrSymbol.get(normalizeSymbol(key)) : undefined;
    return normalizeQuote(raw, defaults);
  });
}

export function toOraclePriceUpdate(quote: GoodChainMarketQuote): OraclePriceUpdate {
  return {
    ticker: quote.ticker,
    price: quote.price,
    priceChainlink: quote.priceE8,
    timestamp: quote.timestamp,
    source: 'etoro',
    instrumentId: quote.instrumentId,
  };
}
