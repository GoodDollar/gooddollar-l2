import { AxiosInstance } from 'axios';
import { InstrumentResolver, ResolvedInstrument } from '../instrument-resolver';

export interface MockAxiosResponses {
  /** Map of uppercase symbol → search hit array. */
  search?: Record<string, unknown[]>;
  /** Single rates array (returned for every /rates call). */
  rates?: unknown[];
  /** Custom per-call rates handler so per-test branching is possible. */
  ratesHandler?: (instrumentIds: string[]) => unknown;
  /** Candles array. */
  candles?: unknown[];
  /** Fallback for any other path. */
  fallback?: unknown;
  /** Override the entire response for an exact path match (no envelope wrapping). */
  rawByPath?: Record<string, unknown>;
}

/**
 * Test double for `AxiosInstance` that returns SDK-shaped envelopes for
 * the official eToro endpoints (`/market-data/search`,
 * `/market-data/instruments/rates`, `/market-data/candles`). Other GETs
 * fall through to `responses.fallback` (default `[]`).
 *
 * Each request is recorded on `instance.get.mock.calls` so tests can
 * assert path / params verbatim.
 */
export function createMockAxios(responses: MockAxiosResponses = {}): AxiosInstance {
  const get = jest.fn(async (url: string, opts?: { params?: Record<string, unknown> }) => {
    if (responses.rawByPath && url in responses.rawByPath) {
      return { data: responses.rawByPath[url], status: 200 };
    }
    if (url.includes('/market-data/search')) {
      const sym = String(opts?.params?.internalSymbolFull ?? '').toUpperCase();
      return { data: { results: responses.search?.[sym] ?? [] }, status: 200 };
    }
    if (url.includes('/market-data/instruments/rates')) {
      const idsParam = String(opts?.params?.instrumentIds ?? '');
      const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (responses.ratesHandler) {
        return { data: responses.ratesHandler(ids), status: 200 };
      }
      return { data: { rates: responses.rates ?? [] }, status: 200 };
    }
    if (url.includes('/market-data/candles')) {
      return { data: { candles: responses.candles ?? [] }, status: 200 };
    }
    return { data: responses.fallback ?? [], status: 200 };
  });
  return { get } as unknown as AxiosInstance;
}

/**
 * Build an `InstrumentResolver` test double pre-loaded with the given
 * symbol → instrumentId mappings. No HTTP is ever issued; missing
 * symbols throw a clear `Error` so a forgotten mapping is immediately
 * visible in test output.
 */
export function stubResolver(map: Record<string, string>): InstrumentResolver {
  const cache = new Map<string, ResolvedInstrument>();
  for (const [sym, id] of Object.entries(map)) {
    cache.set(sym.toUpperCase(), {
      symbol: sym.toUpperCase(),
      instrumentId: id,
      internalSymbolFull: sym.toUpperCase(),
      displayName: sym,
      instrumentType: 'Stock',
      isCurrentlyTradable: true,
    });
  }
  const stub = {
    resolve: jest.fn(async (sym: string) => {
      const v = cache.get(sym.toUpperCase());
      if (!v) throw new Error(`stubResolver: no mapping for "${sym}"`);
      return v;
    }),
    resolveMany: jest.fn(async (syms: readonly string[]) => {
      const out = new Map<string, ResolvedInstrument>();
      for (const sym of syms) {
        const v = cache.get(sym.toUpperCase());
        if (v) out.set(sym.toUpperCase(), v);
      }
      return out;
    }),
    clearCache: jest.fn(),
  };
  return stub as unknown as InstrumentResolver;
}

/**
 * Convert a legacy `{ symbol, bid, ask, last, timestamp, instrumentId }`
 * shape into the new `/market-data/instruments/rates` envelope entry
 * shape (`{ instrumentID, bid, ask, lastExecution, date }`). Lets old
 * fixture data flow through the new pipeline with one transform.
 */
export function toRateRecord(input: {
  symbol?: string;
  instrumentId?: string;
  instrumentID?: string;
  bid?: number;
  ask?: number;
  last?: number;
  lastExecution?: number;
  timestamp?: number;
  date?: number | string;
  bidPrice?: number;
  askPrice?: number;
  currentRate?: number;
  updatedAt?: number;
  ticker?: string;
}): Record<string, unknown> {
  const instrumentID = input.instrumentID ?? input.instrumentId ?? input.symbol ?? input.ticker ?? '';
  const bid = input.bid ?? input.bidPrice;
  const ask = input.ask ?? input.askPrice;
  const lastExecution = input.lastExecution ?? input.last ?? input.currentRate;
  const date = input.date ?? input.timestamp ?? input.updatedAt ?? Date.now();
  return { instrumentID, bid, ask, lastExecution, date };
}
