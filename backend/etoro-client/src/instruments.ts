import { InvalidInstrumentOverridesError } from './errors';
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
 * Reads `ETORO_INSTRUMENT_OVERRIDES` (JSON string) from env. Returns `{}`
 * when the env var is unset. Throws `InvalidInstrumentOverridesError` for
 * any malformed input — JSON parse errors, wrong shape (non-object root,
 * array, bare string), unknown symbols, or per-symbol slices with empty
 * string IDs / display names or non-positive reference prices. Operators
 * notice the misconfig at deploy time instead of after the first hedge
 * silently uses the placeholder IDs.
 */
export function loadInstrumentOverrides(
  env: Record<string, string | undefined> = process.env,
): InstrumentOverrides {
  const raw = env.ETORO_INSTRUMENT_OVERRIDES;
  if (raw === undefined || raw === '') return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new InvalidInstrumentOverridesError({
      field: 'json',
      reason: `JSON.parse failed (${e instanceof Error ? e.message : String(e)})`,
    });
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new InvalidInstrumentOverridesError({
      field: 'shape',
      reason: 'top-level value must be a JSON object',
    });
  }

  const out: InstrumentOverrides = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isLaneSymbol(key)) {
      throw new InvalidInstrumentOverridesError({
        field: 'symbol',
        offendingKey: key,
        reason: `unknown symbol "${key}"; valid symbols are ${INSTRUMENT_SYMBOLS.join(', ')}`,
      });
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new InvalidInstrumentOverridesError({
        field: 'shape',
        offendingKey: key,
        reason: `entry for "${key}" must be an object`,
      });
    }
    const v = value as Record<string, unknown>;
    const slice: InstrumentOverrides[LaneSymbol] = {};
    if (v.etoroInstrumentId !== undefined) {
      if (typeof v.etoroInstrumentId !== 'string' || v.etoroInstrumentId.trim() === '') {
        throw new InvalidInstrumentOverridesError({
          field: 'shape',
          offendingKey: key,
          reason: `etoroInstrumentId for "${key}" must be a non-empty string`,
        });
      }
      slice.etoroInstrumentId = v.etoroInstrumentId.trim();
    }
    if (v.displayName !== undefined) {
      if (typeof v.displayName !== 'string' || v.displayName.trim() === '') {
        throw new InvalidInstrumentOverridesError({
          field: 'shape',
          offendingKey: key,
          reason: `displayName for "${key}" must be a non-empty string`,
        });
      }
      slice.displayName = v.displayName.trim();
    }
    if (v.referencePriceUsd !== undefined) {
      if (typeof v.referencePriceUsd !== 'number'
        || !Number.isFinite(v.referencePriceUsd)
        || v.referencePriceUsd <= 0) {
        throw new InvalidInstrumentOverridesError({
          field: 'shape',
          offendingKey: key,
          reason: `referencePriceUsd for "${key}" must be a finite number > 0`,
        });
      }
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
