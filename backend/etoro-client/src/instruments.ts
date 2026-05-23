import { EtoroAssetClass } from './types';

/**
 * Lane-1 instrument map. The eight symbols shipped here are the v0
 * coverage for the price-service → oracle-signer → on-chain → apps lane:
 * three liquid crypto names + five US equity/ETF names that are easy to
 * cross-check against open free data sources.
 *
 * `etoroInstrumentId` is a placeholder ("ETORO-<symbol>") until the lane
 * wiring confirms the partner-API IDs. To swap in real IDs without a code
 * change, set `ETORO_INSTRUMENT_OVERRIDES` to a JSON object mapping
 * symbol → instrumentId; `loadInstrumentOverrides` parses it safely and
 * `applyInstrumentOverrides` produces the merged map.
 */

export const INSTRUMENT_SYMBOLS = [
  'BTC',
  'ETH',
  'SOL',
  'AAPL',
  'TSLA',
  'NVDA',
  'META',
  'SPY',
] as const;

export type LaneSymbol = typeof INSTRUMENT_SYMBOLS[number];

export interface LaneInstrument {
  symbol: LaneSymbol;
  etoroInstrumentId: string;
  assetClass: EtoroAssetClass;
  displayName: string;
  /** Reference price in USD used by mock-source seeding and notional sanity checks. */
  referencePriceUsd: number;
}

export const INSTRUMENT_MAP: Readonly<Record<LaneSymbol, LaneInstrument>> = Object.freeze({
  BTC: {
    symbol: 'BTC',
    etoroInstrumentId: 'ETORO-BTC',
    assetClass: 'crypto',
    displayName: 'Bitcoin',
    referencePriceUsd: 60_000,
  },
  ETH: {
    symbol: 'ETH',
    etoroInstrumentId: 'ETORO-ETH',
    assetClass: 'crypto',
    displayName: 'Ethereum',
    referencePriceUsd: 3_000,
  },
  SOL: {
    symbol: 'SOL',
    etoroInstrumentId: 'ETORO-SOL',
    assetClass: 'crypto',
    displayName: 'Solana',
    referencePriceUsd: 150,
  },
  AAPL: {
    symbol: 'AAPL',
    etoroInstrumentId: 'ETORO-AAPL',
    assetClass: 'equity',
    displayName: 'Apple Inc.',
    referencePriceUsd: 190,
  },
  TSLA: {
    symbol: 'TSLA',
    etoroInstrumentId: 'ETORO-TSLA',
    assetClass: 'equity',
    displayName: 'Tesla, Inc.',
    referencePriceUsd: 250,
  },
  NVDA: {
    symbol: 'NVDA',
    etoroInstrumentId: 'ETORO-NVDA',
    assetClass: 'equity',
    displayName: 'NVIDIA Corporation',
    referencePriceUsd: 900,
  },
  META: {
    symbol: 'META',
    etoroInstrumentId: 'ETORO-META',
    assetClass: 'equity',
    displayName: 'Meta Platforms, Inc.',
    referencePriceUsd: 480,
  },
  SPY: {
    symbol: 'SPY',
    etoroInstrumentId: 'ETORO-SPY',
    assetClass: 'etf',
    displayName: 'SPDR S&P 500 ETF',
    referencePriceUsd: 540,
  },
});

export type InstrumentOverrides = Partial<
  Record<LaneSymbol, Partial<Pick<LaneInstrument, 'etoroInstrumentId' | 'displayName' | 'referencePriceUsd'>>>
>;

export function isLaneSymbol(value: string): value is LaneSymbol {
  return (INSTRUMENT_SYMBOLS as readonly string[]).includes(value);
}

export function getInstrument(symbol: string): LaneInstrument | null {
  if (!isLaneSymbol(symbol)) return null;
  return INSTRUMENT_MAP[symbol];
}

/**
 * Reads `ETORO_INSTRUMENT_OVERRIDES` (JSON string) from env, returning
 * `{}` when unset or unparseable. Unknown symbols are dropped silently;
 * known symbols may override `etoroInstrumentId`, `displayName`, or
 * `referencePriceUsd` only.
 */
export function loadInstrumentOverrides(
  env: Record<string, string | undefined> = process.env,
): InstrumentOverrides {
  const raw = env.ETORO_INSTRUMENT_OVERRIDES;
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

  const out: InstrumentOverrides = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isLaneSymbol(key)) continue;
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const v = value as Record<string, unknown>;
    const slice: InstrumentOverrides[LaneSymbol] = {};
    if (typeof v.etoroInstrumentId === 'string' && v.etoroInstrumentId.trim()) {
      slice.etoroInstrumentId = v.etoroInstrumentId.trim();
    }
    if (typeof v.displayName === 'string' && v.displayName.trim()) {
      slice.displayName = v.displayName.trim();
    }
    if (typeof v.referencePriceUsd === 'number' && Number.isFinite(v.referencePriceUsd)
      && v.referencePriceUsd > 0) {
      slice.referencePriceUsd = v.referencePriceUsd;
    }
    if (Object.keys(slice).length > 0) {
      out[key] = slice;
    }
  }
  return out;
}

export function applyInstrumentOverrides(
  base: Readonly<Record<LaneSymbol, LaneInstrument>>,
  overrides: InstrumentOverrides,
): Record<LaneSymbol, LaneInstrument> {
  const merged = {} as Record<LaneSymbol, LaneInstrument>;
  for (const sym of INSTRUMENT_SYMBOLS) {
    merged[sym] = { ...base[sym], ...(overrides[sym] ?? {}) };
  }
  return merged;
}
