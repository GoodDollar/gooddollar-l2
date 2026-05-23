import express, { NextFunction, Request, Response } from 'express';
import { QuoteCache } from './quote-cache';
import { PriceServiceConfig, DEFAULT_CONFIG, IngestStats } from './types';

export type IngestStatsGetter = () => IngestStats;

/**
 * Map of exact known paths to the methods they accept. Keep grep-friendly:
 * downstreams (oracle-signer, frontend) match on path → 405 Allow header.
 * The parametric `/quotes/:symbol` route is matched by `QUOTES_SYMBOL_RE`.
 */
const KNOWN_ROUTES: ReadonlyMap<string, readonly string[]> = new Map([
  ['/health', ['GET']],
  ['/quotes', ['GET']],
  ['/quotes/fresh/all', ['GET']],
  ['/audit/stats', ['GET']],
  ['/status/quotes', ['GET']],
]);
const QUOTES_SYMBOL_RE = /^\/quotes\/[^/]+$/;

/**
 * `ingested / (ingested + rejected)`. Returns 1 when nothing has been
 * ingested yet (no data => no rejections => effectively healthy).
 */
function computeAcceptanceRatio(stats: IngestStats): number {
  const total = stats.ingested + stats.rejected;
  if (total === 0) return 1;
  return stats.ingested / total;
}

export function createServer(
  cache: QuoteCache,
  config?: Partial<PriceServiceConfig>,
  statsGetter?: IngestStatsGetter,
): express.Express {
  const app = express();
  app.disable('x-powered-by');
  const cfg = { ...DEFAULT_CONFIG, ...config };

  app.use((_req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_req: Request, res: Response) => {
    const fresh = cache.getFresh();
    const total = cache.size;
    const healthy = fresh.length > 0 || total === 0;
    const body: Record<string, unknown> = {
      status: healthy ? 'ok' : 'degraded',
      freshQuotes: fresh.length,
      totalCached: total,
      configuredSymbols: cfg.symbols.length,
      timestamp: Date.now(),
    };
    if (statsGetter) {
      const stats = statsGetter();
      body.ingested = stats.ingested;
      body.rejected = stats.rejected;
      body.acceptanceRatio = computeAcceptanceRatio(stats);
    }
    res.status(healthy ? 200 : 503).json(body);
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
    const symbol = req.params.symbol.toUpperCase();
    const entry = cache.get(symbol);
    if (!entry) {
      res.status(404).json({ error: `No quote for ${symbol}` });
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
      const age = now - entry.cachedAt;
      quotes.push({
        symbol,
        lastUpdateMs: age,
        sessionState: entry.quote.sessionState,
        confidence: entry.quote.confidence,
      });
      if (!entry.quote.stale && entry.filterResult.accepted) {
        freshCount++;
      }
    }

    res.json({
      healthy: freshCount > 0 || all.size === 0,
      freshCount,
      totalCount: all.size,
      quotes,
      timestamp: now,
    });
  });

  app.all('*', (req: Request, res: Response) => {
    const allowed =
      KNOWN_ROUTES.get(req.path) ??
      (QUOTES_SYMBOL_RE.test(req.path) ? ['GET'] : undefined);
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
