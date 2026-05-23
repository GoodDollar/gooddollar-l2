import express, { NextFunction, Request, Response } from 'express';
import { QuoteCache } from './quote-cache';
import { PriceServiceConfig, DEFAULT_CONFIG, IngestStats, SourceStatus } from './types';
import {
  sanitizeSourceStatus,
  SanitizedSourceStatus,
  SOURCE_REASONS_PUBLIC,
} from './source-status';

export type IngestStatsGetter = () => IngestStats;
export type SourceStatusGetter = () => SourceStatus;
export type BootAtGetter = () => number;
export type WsAddressGetter = () => { port: number; host?: string };

/**
 * Frame schema docs for the WS broadcaster, surfaced on both `GET /` and
 * `GET /health` so an integrator who finds only the REST URL can still
 * discover the live-tick feed without cloning the repo. The strings are
 * coupled to the broadcaster contract in `ws-broadcaster.ts`; any future
 * frame-shape change there must also update this constant.
 */
const WS_FRAME_DOCS = {
  snapshot:
    "sent on connect; { type:'snapshot', data: NormalizedQuote[], " +
    'count, timestamp, source? }',
  quote:
    "broadcast per accepted tick; " +
    "{ type:'quote', data: NormalizedQuote, timestamp }",
} as const;

/**
 * Pull the bare hostname out of an HTTP `Host:` header so we can rewrite
 * the port for the WS advertisement. Strips the trailing `:port`,
 * preserves bracketed IPv6 literals (`[::1]:3122` → `[::1]`), and falls
 * back to `localhost` when the header is missing (some raw `http.request`
 * paths don't send one).
 */
export function hostnameFromHostHeader(h: string | undefined): string {
  if (!h) return 'localhost';
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    return end > 0 ? h.slice(0, end + 1) : h;
  }
  const idx = h.indexOf(':');
  return idx > 0 ? h.slice(0, idx) : h;
}

export interface WsAdvertisement {
  url: string;
  port: number;
  frames: readonly ['snapshot', 'quote'];
  snapshot: string;
  quote: string;
}

/**
 * Top-level discovery copy for `GET /`. Static so the body assembly stays a
 * single object literal and the docs can't drift between handler + README.
 */
const SERVICE_DESCRIPTION =
  'Normalizes eToro market data, applies risk filters, caches the latest ' +
  'quote per symbol, and exposes REST + WebSocket feeds for downstream ' +
  'consumers (oracle-signer, frontend).';

const DOCS_URL =
  'https://github.com/goodchain/goodchain-live-prices-lanes/blob/' +
  'ab/0007-lane2-price-service/backend/price-service/README.md';

/**
 * Sequenced fresh-user walk-through emitted on `GET /`. Replaces the old
 * unordered `examples` map: a fresh integrator gets a step-by-step
 * runbook (verify alive → see all quotes → fetch one symbol → subscribe
 * to live ticks) instead of four parallel options with no "start here".
 * Each step records the user *goal*, the *request* line, and what to
 * *expect* back so the consumer code can be written from this payload
 * alone.
 */
export interface QuickstartStep {
  readonly step: number;
  readonly goal: string;
  readonly request: string;
  readonly expect: string;
}

export const QUICKSTART: readonly QuickstartStep[] = Object.freeze([
  Object.freeze({
    step: 1,
    goal: "Verify the service is alive and see what's configured",
    request: 'GET /health',
    expect:
      '200 ok / 503 degraded; body carries status, configured symbols, ' +
      'source.reason',
  }),
  Object.freeze({
    step: 2,
    goal: 'See every cached quote at once',
    request: 'GET /quotes',
    expect: '200; body { count, totalCached, quotes, source, degraded }',
  }),
  Object.freeze({
    step: 3,
    goal: 'Fetch a single symbol (substitute any from /health.symbols)',
    request: 'GET /quotes/AAPL',
    expect:
      "200 with quote envelope, or 404 { error: 'no-quote' } before " +
      'first tick',
  }),
  Object.freeze({
    step: 4,
    goal: 'Subscribe to live ticks',
    request: 'CONNECT ws://<host>:9301',
    expect:
      'snapshot frame on connect, then quote frames per accepted tick',
  }),
]) as readonly QuickstartStep[];

/**
 * Pull the version string off a `package.json`-shaped object. Defaults to
 * a real `require('../package.json')` so the server can be wired with
 * zero arguments; the injection point exists so tests can exercise the
 * fallback branch without monkey-patching the module loader.
 *
 * Returns the literal `'unknown'` on any throw or shape mismatch so the
 * discovery payload always carries a string and never crashes boot.
 */
export function readPackageVersion(
  pkgRequire: () => unknown = () => require('../package.json'),
): string {
  try {
    const pkg = pkgRequire();
    if (
      pkg !== null &&
      typeof pkg === 'object' &&
      'version' in pkg &&
      typeof (pkg as { version: unknown }).version === 'string'
    ) {
      return (pkg as { version: string }).version;
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

const PACKAGE_VERSION = readPackageVersion();

/**
 * Pair every absolute unix-ms timestamp with its ISO 8601 companion so
 * a fresh user reading `1779547903356` doesn't have to reach for
 * `date -d @<secs>` (and remember to divide by 1000) to know when
 * something happened. Null-safe so handlers can pass nullable
 * timestamps (`firstAt`/`lastAt`) directly without conditionals.
 */
export function isoFromMs(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}

/**
 * Single source of truth for every endpoint the service exposes. The
 * discovery payload (`GET /`), the 404 hint list, and the 405 method
 * dispatch all read off this one array — there's no second place to
 * forget when a new endpoint lands.
 *
 * Summaries are one-line operator hints; the wire contract caps them at
 * 140 chars (asserted in the test suite) so a grep through the live
 * discovery payload stays readable.
 *
 * `parametric: true` marks routes whose path shape carries a placeholder
 * (`/quotes/:symbol`). They are matched by a single regex below rather
 * than by exact-string lookup.
 */
interface EndpointDoc {
  path: string;
  methods: readonly string[];
  summary: string;
  parametric?: boolean;
}

const ENDPOINT_CATALOG: readonly EndpointDoc[] = [
  {
    path: '/',
    methods: ['GET'],
    summary: 'Service discovery: lists endpoints, version, docs.',
  },
  {
    path: '/health',
    methods: ['GET'],
    summary: 'Liveness + readiness for load balancers; 503 when degraded.',
  },
  {
    path: '/quotes',
    methods: ['GET'],
    summary: 'Every cached quote with cache age and per-quote filter verdict.',
  },
  {
    path: '/quotes/fresh/all',
    methods: ['GET'],
    summary: 'Only quotes that are non-stale AND accepted by the risk filter.',
  },
  {
    path: '/quotes/:symbol',
    methods: ['GET'],
    summary:
      'Single symbol; 400 invalid-symbol, 404 symbol-not-configured or ' +
      'no-quote, 200 quote envelope.',
    parametric: true,
  },
  {
    path: '/status/quotes',
    methods: ['GET'],
    summary:
      'Per-symbol freshness (last-update age, session state, confidence) ' +
      'for dashboards.',
  },
  {
    path: '/audit/stats',
    methods: ['GET'],
    summary:
      'Ingested vs rejected counts, rejection breakdown, acceptance ratio, ' +
      'uptime.',
  },
  {
    path: '/docs/source-reasons',
    methods: ['GET'],
    summary:
      'Reference catalog: enum values that may appear as `source.reason` ' +
      'on data endpoints (NOT live state).',
  },
];

/**
 * Pointer object replacing the inline `sourceReasons` block on `GET /`.
 * Naming the field `sourceReasonCatalog` (singular, with the `Catalog`
 * suffix) and adding the `description` line stops a fresh user from
 * mistaking a 3-entry reference table for three concurrent live errors.
 * The full payload lives at `/docs/source-reasons`; here we ship only
 * the pointer to keep the discovery body small.
 */
const SOURCE_REASON_CATALOG_COUNT = Object.keys(SOURCE_REASONS_PUBLIC).length;

const SOURCE_REASON_CATALOG_POINTER = Object.freeze({
  description:
    'Reference catalog: enum values that may appear as `source.reason` ' +
    'on data endpoints. NOT a live error feed; check `source` on /health ' +
    'for the current verdict.',
  url: '/docs/source-reasons',
  count: SOURCE_REASON_CATALOG_COUNT,
});

/**
 * Pinned regex for the one parametric route this service exposes today.
 * Future parametric routes would carry their own matcher inside the
 * catalog entry; with a single entry, a const keeps the matcher
 * declared next to the data structure it serves.
 */
const QUOTES_SYMBOL_RE = /^\/quotes\/[^/]+$/;

const CATALOG_EXACT: ReadonlyMap<string, EndpointDoc> = new Map(
  ENDPOINT_CATALOG.filter((e) => !e.parametric).map((e) => [e.path, e]),
);

function findCatalogEntry(reqPath: string): EndpointDoc | undefined {
  const exact = CATALOG_EXACT.get(reqPath);
  if (exact) return exact;
  // Only one parametric shape today; if we add more, generalise to a
  // (path, regex) tuple inside `EndpointDoc` rather than reaching for
  // a dispatch table.
  if (QUOTES_SYMBOL_RE.test(reqPath)) {
    return ENDPOINT_CATALOG.find((e) => e.path === '/quotes/:symbol');
  }
  return undefined;
}

function buildEndpointIndex(): Array<{ path: string; methods: readonly string[]; summary: string }> {
  return ENDPOINT_CATALOG.map((e) => ({
    path: e.path,
    methods: e.methods,
    summary: e.summary,
  }));
}

/**
 * eToro / standard ticker shape: 1..16 chars of upper-case letters,
 * digits, dot, dash, underscore. Matches every symbol in
 * DEFAULT_CONFIG.symbols (`AAPL`, `TSLA`, ...) and the standard eToro
 * instrument surface (`BRK.B`, `BTC-USD`, `BTC_USD`).
 */
const VALID_SYMBOL = /^[A-Z0-9._-]{1,16}$/;

function normalizeSymbol(
  raw: string,
): { ok: true; symbol: string } | { ok: false } {
  if (typeof raw !== 'string') return { ok: false };
  // Pre-uppercase length cap: certain Unicode chars (`ß` → `SS`) grow
  // when uppercased, so cap the raw input at 32 to bound worst-case
  // post-uppercase length well below the regex limit.
  if (raw.length === 0 || raw.length > 32) return { ok: false };
  const upper = raw.toUpperCase();
  if (!VALID_SYMBOL.test(upper)) return { ok: false };
  return { ok: true, symbol: upper };
}

/**
 * `ingested / (ingested + rejected)`. Returns 1 when nothing has been
 * ingested yet (no data => no rejections => effectively healthy).
 */
function computeAcceptanceRatio(stats: IngestStats): number {
  const total = stats.ingested + stats.rejected;
  if (total === 0) return 1;
  return stats.ingested / total;
}

/**
 * Single source of truth for the healthy/degraded verdict on
 * `/health` and `/status/quotes`. Two endpoints reading the same
 * inputs must always agree, otherwise downstream consumers
 * (oracle-signer) get conflicting signals.
 *
 * The cache alone is not enough: an empty cache during warmup is
 * fine when the source is connected, but the same empty cache with
 * a dead source is "we will never tick" — degraded.
 */
function computeDegraded(
  cache: QuoteCache,
  sourceStatusGetter?: SourceStatusGetter,
): { degraded: boolean; src?: SanitizedSourceStatus } {
  const fresh = cache.getFresh();
  const cacheHealthy = fresh.length > 0 || cache.size === 0;
  let degraded = !cacheHealthy;
  let src: SanitizedSourceStatus | undefined;
  if (sourceStatusGetter) {
    src = sanitizeSourceStatus(sourceStatusGetter());
    if (!src.connected) degraded = true;
  }
  return { degraded, src };
}

export function createServer(
  cache: QuoteCache,
  config?: Partial<PriceServiceConfig>,
  statsGetter?: IngestStatsGetter,
  sourceStatusGetter?: SourceStatusGetter,
  bootAtGetter?: BootAtGetter,
  wsAddressGetter?: WsAddressGetter,
): express.Express {
  const app = express();
  app.disable('x-powered-by');
  const cfg = { ...DEFAULT_CONFIG, ...config };
  // Built once: per-request membership check is O(1). Uppercase every
  // entry so deploys with mixed-case `ORACLE_SYMBOLS` still match the
  // upper-cased request path produced by `normalizeSymbol`.
  const configuredSet = new Set(cfg.symbols.map((s) => s.toUpperCase()));

  // Single helper so the `/`, `/health`, and 404 surfaces emit identical
  // advertisements off the same input. Returns `undefined` when wiring
  // is absent so call sites can omit the field cleanly (preserves the
  // backward-compat contract for fixtures constructed with the old
  // 5-arg `createServer`).
  function buildWsAdvertisement(req: Request): WsAdvertisement | undefined {
    if (!wsAddressGetter) return undefined;
    const { port, host } = wsAddressGetter();
    const hostname = host ?? hostnameFromHostHeader(req.get('host'));
    return {
      url: `ws://${hostname}:${port}`,
      port,
      frames: ['snapshot', 'quote'] as const,
      snapshot: WS_FRAME_DOCS.snapshot,
      quote: WS_FRAME_DOCS.quote,
    };
  }

  app.use((req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/', (req: Request, res: Response) => {
    const now = Date.now();
    const body: Record<string, unknown> = {
      service: 'price-service',
      description: SERVICE_DESCRIPTION,
      version: PACKAGE_VERSION,
      docs: DOCS_URL,
      endpoints: buildEndpointIndex(),
      quickstart: QUICKSTART,
      sourceReasonCatalog: SOURCE_REASON_CATALOG_POINTER,
    };
    const ws = buildWsAdvertisement(req);
    if (ws) body.websocket = ws;
    const { degraded } = computeDegraded(cache, sourceStatusGetter);
    body.status = degraded ? 'degraded' : 'ok';
    body.timestamp = now;
    body.timestampIso = isoFromMs(now)!;
    res.json(body);
  });

  app.get('/docs/source-reasons', (_req: Request, res: Response) => {
    const now = Date.now();
    res.json({
      reasons: SOURCE_REASONS_PUBLIC,
      count: SOURCE_REASON_CATALOG_COUNT,
      timestamp: now,
      timestampIso: isoFromMs(now)!,
    });
  });

  app.get('/health', (req: Request, res: Response) => {
    const now = Date.now();
    const fresh = cache.getFresh();
    const body: Record<string, unknown> = {
      freshQuotes: fresh.length,
      totalCached: cache.size,
      configuredSymbols: cfg.symbols.length,
      symbols: cfg.symbols,
      timestamp: now,
      timestampIso: isoFromMs(now)!,
    };
    if (statsGetter) {
      const stats = statsGetter();
      body.ingested = stats.ingested;
      body.rejected = stats.rejected;
      body.acceptanceRatio = computeAcceptanceRatio(stats);
    }
    const { degraded, src } = computeDegraded(cache, sourceStatusGetter);
    if (src) body.source = src;
    const ws = buildWsAdvertisement(req);
    if (ws) body.websocket = ws;
    body.status = degraded ? 'degraded' : 'ok';
    if (bootAtGetter) {
      const bootAt = bootAtGetter();
      body.bootAtMs = bootAt;
      body.bootAtIso = isoFromMs(bootAt)!;
      body.uptimeMs = Math.max(0, now - bootAt);
    }
    res.status(degraded ? 503 : 200).json(body);
  });

  app.get('/quotes', (_req: Request, res: Response) => {
    const now = Date.now();
    const all = cache.getAll();
    const quotes: Record<string, unknown> = {};
    for (const [symbol, entry] of all) {
      quotes[symbol] = {
        ...entry.quote,
        cacheAge: now - entry.cachedAt,
        filterAccepted: entry.filterResult.accepted,
        filterReason: entry.filterResult.reason,
      };
    }
    const count = Object.keys(quotes).length;
    const body: Record<string, unknown> = {
      count,
      totalCached: cache.size,
    };
    if (sourceStatusGetter) {
      const { degraded, src } = computeDegraded(cache, sourceStatusGetter);
      body.degraded = degraded;
      if (count === 0) {
        body.message = degraded
          ? 'no cached quotes — upstream source is degraded ' +
            '(see source.reason / source.nextStep)'
          : 'no cached quotes — source is healthy, awaiting first tick';
      }
      body.quotes = quotes;
      if (src) body.source = src;
    } else {
      body.quotes = quotes;
    }
    body.timestamp = now;
    body.timestampIso = isoFromMs(now)!;
    res.json(body);
  });

  app.get('/quotes/:symbol', (req: Request, res: Response) => {
    const now = Date.now();
    const result = normalizeSymbol(req.params.symbol);
    if (!result.ok) {
      // Bound the reflected path so a 5KB symbol can't yield a 5KB body.
      // Truncate at 32 chars (the same limit `normalizeSymbol` enforces
      // on the raw input) plus the `/quotes/` prefix.
      const path = req.path.length > 48 ? `${req.path.slice(0, 48)}…` : req.path;
      // 400 is input validation — intentionally does NOT carry source state.
      res.status(400).json({
        error: 'invalid-symbol',
        message: 'symbol must match /^[A-Z0-9._-]{1,16}$/',
        path,
        method: req.method,
        timestamp: now,
        timestampIso: isoFromMs(now)!,
      });
      return;
    }
    if (!configuredSet.has(result.symbol)) {
      // Permanent 404: this symbol will never tick on this deploy
      // because it isn't in the subscription set. Distinct from the
      // transient `no-quote` case so polling consumers can give up
      // and surface a config error instead of retrying forever.
      const body: Record<string, unknown> = {
        error: 'symbol-not-configured',
        message:
          'symbol is not in the deployed subscription set; ' +
          'retrying will not help — update ORACLE_SYMBOLS and restart',
        symbol: result.symbol,
        configured: false,
      };
      if (sourceStatusGetter) body.source = sanitizeSourceStatus(sourceStatusGetter());
      body.timestamp = now;
      body.timestampIso = isoFromMs(now)!;
      res.status(404).json(body);
      return;
    }
    const entry = cache.get(result.symbol);
    if (!entry) {
      const body: Record<string, unknown> = {
        error: 'no-quote',
        message:
          'symbol is configured but the cache holds no fresh tick — ' +
          'retry once source delivers',
        symbol: result.symbol,
        configured: true,
      };
      if (sourceStatusGetter) body.source = sanitizeSourceStatus(sourceStatusGetter());
      body.timestamp = now;
      body.timestampIso = isoFromMs(now)!;
      res.status(404).json(body);
      return;
    }
    const body: Record<string, unknown> = {
      ...entry.quote,
      cacheAge: now - entry.cachedAt,
      filterAccepted: entry.filterResult.accepted,
      filterReason: entry.filterResult.reason,
    };
    if (sourceStatusGetter) body.source = sanitizeSourceStatus(sourceStatusGetter());
    res.json(body);
  });

  app.get('/quotes/fresh/all', (_req: Request, res: Response) => {
    const now = Date.now();
    const fresh = cache.getFresh();
    const body: Record<string, unknown> = { quotes: fresh, count: fresh.length };
    if (sourceStatusGetter) body.source = sanitizeSourceStatus(sourceStatusGetter());
    body.timestamp = now;
    body.timestampIso = isoFromMs(now)!;
    res.json(body);
  });

  app.get('/audit/stats', (_req: Request, res: Response) => {
    const now = Date.now();
    const stats: IngestStats = statsGetter
      ? statsGetter()
      : {
          ingested: 0,
          rejected: 0,
          byReason: {},
          firstAt: null,
          lastAt: null,
          writeErrors: 0,
        };
    const body: Record<string, unknown> = {
      ingested: stats.ingested,
      rejected: stats.rejected,
      byReason: stats.byReason,
      acceptanceRatio: computeAcceptanceRatio(stats),
      firstAt: stats.firstAt,
      firstAtIso: isoFromMs(stats.firstAt),
      lastAt: stats.lastAt,
      lastAtIso: isoFromMs(stats.lastAt),
      writeErrors: stats.writeErrors,
    };
    if (bootAtGetter) {
      const bootAt = bootAtGetter();
      body.bootAtMs = bootAt;
      body.bootAtIso = isoFromMs(bootAt)!;
      body.uptimeMs = Math.max(0, now - bootAt);
    }
    body.timestamp = now;
    body.timestampIso = isoFromMs(now)!;
    res.json(body);
  });

  app.get('/status/quotes', (_req: Request, res: Response) => {
    const now = Date.now();
    const all = cache.getAll();
    const quotes: Array<{
      symbol: string;
      lastUpdateMs: number;
      sessionState: string;
      confidence: number;
    }> = [];

    let freshCount = 0;
    for (const [symbol, entry] of all) {
      quotes.push({
        symbol,
        lastUpdateMs: now - entry.cachedAt,
        sessionState: entry.quote.sessionState,
        confidence: entry.quote.confidence,
      });
      if (!entry.quote.stale && entry.filterResult.accepted) {
        freshCount++;
      }
    }

    const { degraded, src } = computeDegraded(cache, sourceStatusGetter);
    const responseBody: Record<string, unknown> = {
      healthy: !degraded,
      freshCount,
      totalCount: all.size,
      quotes,
      timestamp: now,
      timestampIso: isoFromMs(now)!,
    };
    if (src) responseBody.source = src;
    res.status(degraded ? 503 : 200).json(responseBody);
  });

  app.all('*', (req: Request, res: Response) => {
    const now = Date.now();
    const entry = findCatalogEntry(req.path);
    if (entry && !entry.methods.includes(req.method)) {
      // OPTIONS is appended at the call site (rather than stored in the
      // catalog) so the discovery payload stays clean of the CORS
      // transport verb while the 405 still advertises it.
      const allowed = [...entry.methods, 'OPTIONS'];
      res.setHeader('Allow', allowed.join(', '));
      res.status(405).json({
        error: 'method-not-allowed',
        allowed,
        path: req.path,
        method: req.method,
        timestamp: now,
        timestampIso: isoFromMs(now)!,
      });
      return;
    }
    const endpoints: Array<{ path: string; methods: readonly string[]; summary: string }> =
      buildEndpointIndex();
    const ws = buildWsAdvertisement(req);
    if (ws) {
      endpoints.push({
        path: ws.url,
        methods: ['CONNECT'],
        summary: 'WebSocket broadcaster: snapshot on connect, then live quote frames.',
      });
    }
    res.status(404).json({
      error: 'not-found',
      path: req.path,
      method: req.method,
      endpoints,
      timestamp: now,
      timestampIso: isoFromMs(now)!,
    });
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const now = Date.now();
    const e = (err && typeof err === 'object' ? err : {}) as {
      status?: unknown;
      expose?: unknown;
      message?: unknown;
    };
    const status = typeof e.status === 'number' ? e.status : 500;
    const code = status >= 500 ? 'internal-error' : 'bad-request';
    // Static, redacted message for 5xx — never reflect handler internals.
    const message =
      status >= 500
        ? 'internal error'
        : e.expose === true && typeof e.message === 'string'
          ? e.message
          : code;
    res.status(status).json({
      error: code,
      message,
      path: req.path,
      method: req.method,
      timestamp: now,
      timestampIso: isoFromMs(now)!,
    });
  });

  return app;
}
