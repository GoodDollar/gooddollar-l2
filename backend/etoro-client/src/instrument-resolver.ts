import { AxiosInstance } from 'axios';
import { AuditLogger } from './audit-logger';
import { InstrumentNotFoundError } from './errors';
import { HttpDispatcher, identityDispatcher } from './rate-limiter';
import { readListOrAudit, MalformedListSink } from './util/list-envelope';
import { pickStr, pickStrId } from './util/picker';
import { LaneInstrument, INSTRUMENT_MAP, isLaneSymbol } from './instruments';
import { EtoroAssetClass } from './types';

/**
 * One resolved instrument descriptor — exactly what the lane needs to
 * call `/market-data/instruments/rates` and to seed
 * `MarketDataModule.getInstruments`.
 */
export interface ResolvedInstrument {
  symbol: string;
  instrumentId: string;
  internalSymbolFull: string;
  displayName: string;
  instrumentType: string;
  isCurrentlyTradable: boolean;
}

export interface InstrumentResolverDeps {
  http: AxiosInstance;
  audit?: AuditLogger;
  dispatch?: HttpDispatcher;
  /** Cache TTL in ms. Default 24 h. eToro instrument IDs are stable. */
  ttlMs?: number;
  /**
   * Optional clock for deterministic cache-expiry tests. Defaults to
   * `Date.now`.
   */
  clock?: () => number;
  /**
   * Per-action malformed-list sink reused from the SDK's shared
   * counter. When present, malformed `/market-data/search` envelopes
   * are audit-logged and counted under
   * `'instrument-resolver-search'`.
   */
  malformedListSink?: MalformedListSink;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Documented fields projection for `/market-data/search`. Pinned per
 * `OFFICIAL_ETORO_API_PRICE_SOURCE.md` and the initiative
 * `constraints.md` so a future field change is a one-line edit.
 */
const SEARCH_FIELDS =
  'instrumentId,internalSymbolFull,displayname,symbol,instrumentType,' +
  'isCurrentlyTradable,isExchangeOpen,isBuyEnabled,currentRate';

const SEARCH_PATH = '/market-data/search';

/**
 * Resolves lane symbols to eToro instrument IDs via the official
 * `/market-data/search` endpoint.
 *
 * Lane safety invariants:
 *   - Exact match by `internalSymbolFull` OR `symbol` (uppercase). The
 *     first fuzzy result is NEVER accepted; an unresolvable symbol
 *     throws `InstrumentNotFoundError`.
 *   - Results are cached for `ttlMs` (default 24 h). Cache is
 *     per-instance so tests can construct fresh resolvers freely.
 *   - `INSTRUMENT_MAP[symbol].etoroInstrumentId` overrides take
 *     precedence over the network lookup when they don't carry the
 *     placeholder `'ETORO-<SYM>'` prefix. This lets operators pin IDs
 *     deterministically via `ETORO_INSTRUMENT_OVERRIDES` without ever
 *     hitting the network.
 */
export class InstrumentResolver {
  private readonly http: AxiosInstance;
  private readonly audit: AuditLogger | undefined;
  private readonly dispatch: HttpDispatcher;
  private readonly ttlMs: number;
  private readonly clock: () => number;
  private readonly malformedListSink: MalformedListSink;
  private readonly cache = new Map<string, { value: ResolvedInstrument; expiresAt: number }>();

  constructor(deps: InstrumentResolverDeps) {
    this.http = deps.http;
    this.audit = deps.audit;
    this.dispatch = deps.dispatch ?? identityDispatcher;
    this.ttlMs = deps.ttlMs ?? DEFAULT_TTL_MS;
    this.clock = deps.clock ?? Date.now;
    this.malformedListSink = deps.malformedListSink ?? {
      audit: this.audit,
      counter: new Map<string, number>(),
      throwOnMalformed: false,
    };
  }

  async resolve(symbol: string): Promise<ResolvedInstrument> {
    const key = symbol.toUpperCase();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > this.clock()) return cached.value;

    const override = laneOverrideFor(key);
    if (override) {
      this.cacheSet(key, override);
      return override;
    }

    const resolved = await this.fetchAndMatch(key);
    this.cacheSet(key, resolved);
    return resolved;
  }

  async resolveMany(symbols: readonly string[]): Promise<Map<string, ResolvedInstrument>> {
    const out = new Map<string, ResolvedInstrument>();
    for (const sym of symbols) {
      out.set(sym.toUpperCase(), await this.resolve(sym));
    }
    return out;
  }

  /** Test-only: clear cache so the next `resolve` re-fetches. */
  clearCache(): void {
    this.cache.clear();
  }

  private cacheSet(key: string, value: ResolvedInstrument): void {
    this.cache.set(key, { value, expiresAt: this.clock() + this.ttlMs });
  }

  private async fetchAndMatch(symbol: string): Promise<ResolvedInstrument> {
    const start = Date.now();
    const { value: resp } = await this.dispatch(() =>
      this.http.get(SEARCH_PATH, {
        params: {
          internalSymbolFull: symbol,
          fields: SEARCH_FIELDS,
          pageSize: 10,
          pageNumber: 1,
        },
      }),
    );

    const raw = readListOrAudit({
      data: resp.data,
      action: 'instrument-resolver-search',
      path: SEARCH_PATH,
      sink: this.malformedListSink,
    });

    const candidates = raw.map(normalizeSearchHit);
    const exact = candidates.find(
      (c) => c.instrumentId !== ''
        && (c.symbol.toUpperCase() === symbol
          || c.internalSymbolFull.toUpperCase() === symbol),
    );

    if (!exact) {
      this.audit?.log({
        action: 'instrument-resolver-no-match',
        method: 'PRE-CHECK',
        path: SEARCH_PATH,
        durationMs: Date.now() - start,
        error: `InstrumentNotFoundError: symbol=${symbol} candidates=[${candidates.map((c) => c.symbol).join(',')}]`,
      });
      throw new InstrumentNotFoundError({
        symbol,
        candidates: candidates.map((c) => c.symbol),
      });
    }

    this.audit?.log({
      action: 'instrument-resolver-search',
      method: 'GET',
      path: SEARCH_PATH,
      statusCode: resp.status,
      durationMs: Date.now() - start,
    });
    return exact;
  }
}

/**
 * Maps a `LaneSymbol` whose `etoroInstrumentId` has been overridden away
 * from the placeholder `ETORO-<SYM>` to a `ResolvedInstrument`, so
 * operator-pinned IDs short-circuit the network lookup.
 */
function laneOverrideFor(symbol: string): ResolvedInstrument | null {
  if (!isLaneSymbol(symbol)) return null;
  const meta: LaneInstrument = INSTRUMENT_MAP[symbol];
  if (meta.etoroInstrumentId.startsWith('ETORO-')) return null;
  return {
    symbol,
    instrumentId: meta.etoroInstrumentId,
    internalSymbolFull: symbol,
    displayName: meta.displayName,
    instrumentType: mapAssetClass(meta.assetClass),
    isCurrentlyTradable: true,
  };
}

function mapAssetClass(c: EtoroAssetClass): string {
  switch (c) {
    case 'crypto': return 'CryptoCurrency';
    case 'equity': return 'Stock';
    case 'etf': return 'ETF';
    case 'forex': return 'Currency';
    case 'index': return 'Index';
    case 'commodity': return 'Commodity';
    case 'unknown': return 'Unknown';
    default: {
      const exhaustive: never = c;
      return String(exhaustive);
    }
  }
}

function normalizeSearchHit(raw: unknown): ResolvedInstrument {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const idRes = pickStrId(r, ['instrumentId', 'instrumentID', 'id']);
  return {
    symbol: (pickStr(r, ['symbol', 'ticker']) ?? '').toUpperCase(),
    instrumentId: idRes.ok ? idRes.value : '',
    internalSymbolFull: pickStr(r, ['internalSymbolFull', 'symbol']) ?? '',
    displayName: pickStr(r, ['displayname', 'displayName', 'description']) ?? '',
    instrumentType: pickStr(r, ['instrumentType', 'type']) ?? '',
    isCurrentlyTradable: pickBool(r, ['isCurrentlyTradable', 'isBuyEnabled']) ?? false,
  };
}

function pickBool(src: Record<string, unknown>, keys: readonly string[]): boolean | undefined {
  for (const k of keys) {
    const v = src[k];
    if (typeof v === 'boolean') return v;
  }
  return undefined;
}
