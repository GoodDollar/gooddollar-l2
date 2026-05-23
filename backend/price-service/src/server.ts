import express, { NextFunction, Request, Response } from 'express';
import { QuoteCache } from './quote-cache';
import { PriceServiceConfig, DEFAULT_CONFIG, IngestStats, SourceStatus } from './types';
import { sanitizeSourceStatus } from './source-status';

export type IngestStatsGetter = () => IngestStats;
export type SourceStatusGetter = () => SourceStatus;

/**
 * Map of exact known paths to the methods they accept. Keep grep-friendly:
 * downstreams (oracle-signer, frontend) match on path → 405 Allow header.
 * The parametric `/quotes/:symbol` route is matched by `QUOTES_SYMBOL_RE`.
 */
const KNOWN_ROUTES: ReadonlyMap<string, readonly string[]> = new Map([
  ['/health', ['GET', 'OPTIONS']],
  ['/quotes', ['GET', 'OPTIONS']],
  ['/quotes/fresh/all', ['GET', 'OPTIONS']],
  ['/audit/stats', ['GET', 'OPTIONS']],
  ['/status/quotes', ['GET', 'OPTIONS']],
]);
const QUOTES_SYMBOL_RE = /^\/quotes\/[^/]+$/;

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
): { degraded: boolean; src?: SourceStatus } {
  const fresh = cache.getFresh();
  const cacheHealthy = fresh.length > 0 || cache.size === 0;
  let degraded = !cacheHealthy;
  let src: SourceStatus | undefined;
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
): express.Express {
  const app = express();
  app.disable('x-powered-by');
  const cfg = { ...DEFAULT_CONFIG, ...config };

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
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_req: Request, res: Response) => {
    const fresh = cache.getFresh();
    const body: Record<string, unknown> = {
      freshQuotes: fresh.length,
      totalCached: cache.size,
      configuredSymbols: cfg.symbols.length,
      timestamp: Date.now(),
    };
    if (statsGetter) {
      const stats = statsGetter();
      body.ingested = stats.ingested;
      body.rejected = stats.rejected;
      body.acceptanceRatio = computeAcceptanceRatio(stats);
    }
    const { degraded, src } = computeDegraded(cache, sourceStatusGetter);
    if (src) body.source = src;
    body.status = degraded ? 'degraded' : 'ok';
    res.status(degraded ? 503 : 200).json(body);
  });

  app.get('/quotes', (_req: Request, res: Response) => {
    const all = cache.getAll();
    const quotes: Record<string, unknown> = {};
    for (const [symbol, entry] of all) {
      quotes[symbol] = {
        ...entry.quote,
        cacheAge: Date.now() - entry.cachedAt,
        filterAccepted: entry.filterResult.accepted,
        filterReason: entry.filterResult.reason,
      };
    }
    res.json({ quotes, timestamp: Date.now() });
  });

  app.get('/quotes/:symbol', (req: Request, res: Response) => {
    const result = normalizeSymbol(req.params.symbol);
    if (!result.ok) {
      // Bound the reflected path so a 5KB symbol can't yield a 5KB body.
      // Truncate at 32 chars (the same limit `normalizeSymbol` enforces
      // on the raw input) plus the `/quotes/` prefix.
      const path = req.path.length > 48 ? `${req.path.slice(0, 48)}…` : req.path;
      res.status(400).json({
        error: 'invalid-symbol',
        message: 'symbol must match /^[A-Z0-9._-]{1,16}$/',
        path,
        method: req.method,
        timestamp: Date.now(),
      });
      return;
    }
    const entry = cache.get(result.symbol);
    if (!entry) {
      res.status(404).json({
        error: 'no-quote',
        symbol: result.symbol,
        timestamp: Date.now(),
      });
      return;
    }
    res.json({
      ...entry.quote,
      cacheAge: Date.now() - entry.cachedAt,
      filterAccepted: entry.filterResult.accepted,
      filterReason: entry.filterResult.reason,
    });
  });

  app.get('/quotes/fresh/all', (_req: Request, res: Response) => {
    const fresh = cache.getFresh();
    res.json({ quotes: fresh, count: fresh.length, timestamp: Date.now() });
  });

  app.get('/audit/stats', (_req: Request, res: Response) => {
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
    res.json({
      ingested: stats.ingested,
      rejected: stats.rejected,
      byReason: stats.byReason,
      acceptanceRatio: computeAcceptanceRatio(stats),
      firstAt: stats.firstAt,
      lastAt: stats.lastAt,
      writeErrors: stats.writeErrors,
      timestamp: Date.now(),
    });
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
    };
    if (src) responseBody.source = src;
    res.status(degraded ? 503 : 200).json(responseBody);
  });

  app.all('*', (req: Request, res: Response) => {
    const allowed =
      KNOWN_ROUTES.get(req.path) ??
      (QUOTES_SYMBOL_RE.test(req.path) ? ['GET', 'OPTIONS'] : undefined);
    if (allowed && !allowed.includes(req.method)) {
      res.setHeader('Allow', allowed.join(', '));
      res.status(405).json({
        error: 'method-not-allowed',
        allowed,
        path: req.path,
        method: req.method,
        timestamp: Date.now(),
      });
      return;
    }
    res.status(404).json({
      error: 'not-found',
      path: req.path,
      method: req.method,
      timestamp: Date.now(),
    });
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const e = (err && typeof err === 'object' ? err : {}) as {
      status?: unknown;
      type?: unknown;
      expose?: unknown;
      message?: unknown;
    };
    const status = typeof e.status === 'number' ? e.status : 500;
    const code =
      e.type === 'entity.parse.failed'
        ? 'malformed-json'
        : e.type === 'entity.too.large'
          ? 'payload-too-large'
          : status >= 500
            ? 'internal-error'
            : 'bad-request';
    // Static, redacted messages: never reflect parser internals
    // (which embed "at position N" / file paths in some Node versions).
    const message =
      status >= 500
        ? 'internal error'
        : code === 'malformed-json'
          ? 'Invalid JSON body'
          : code === 'payload-too-large'
            ? 'Request body too large'
            : code === 'bad-request' && e.expose === true && typeof e.message === 'string'
              ? e.message
              : code;
    res.status(status).json({
      error: code,
      message,
      path: req.path,
      method: req.method,
      timestamp: Date.now(),
    });
  });

  return app;
}
