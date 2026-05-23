import express, { Request, Response } from 'express';
import { QuoteCache } from './quote-cache';
import { PriceServiceConfig, DEFAULT_CONFIG, IngestStats } from './types';

export type IngestStatsGetter = () => IngestStats;

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
  const cfg = { ...DEFAULT_CONFIG, ...config };

  app.use((_req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  app.use(express.json());

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

  return app;
}
