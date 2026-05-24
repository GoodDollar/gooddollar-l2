import express, { Request, Response } from 'express';
import { QuoteCache } from './quote-cache';
import { PriceServiceConfig, DEFAULT_CONFIG } from './types';

export function createServer(
  cache: QuoteCache,
  config?: Partial<PriceServiceConfig>,
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
    const everReceived = cache.cumulativeUpdates;
    const base = {
      freshQuotes: fresh.length,
      totalCached: total,
      cumulativeUpdates: everReceived,
      configuredSymbols: cfg.symbols.length,
      timestamp: Date.now(),
    };

    if (everReceived === 0) {
      res.status(503).json({
        status: 'starting',
        reason: 'no quote ingested yet',
        ...base,
      });
      return;
    }

    if (fresh.length === 0) {
      res.status(503).json({
        status: 'degraded',
        reason: 'no fresh quotes (cache stale or all rejected)',
        ...base,
      });
      return;
    }

    res.status(200).json({ status: 'ok', ...base });
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

  app.get('/status/quotes', (_req: Request, res: Response) => {
    const now = Date.now();
    const all = cache.getAll();
    const everReceived = cache.cumulativeUpdates;
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

    if (everReceived === 0) {
      res.status(503).json({
        status: 'starting',
        reason: 'no quote ingested yet',
        healthy: false,
        freshCount: 0,
        totalCount: all.size,
        cumulativeUpdates: 0,
        quotes,
        timestamp: now,
      });
      return;
    }

    const healthy = freshCount > 0;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      reason: healthy ? undefined : 'no fresh quotes (cache stale or all rejected)',
      healthy,
      freshCount,
      totalCount: all.size,
      cumulativeUpdates: everReceived,
      quotes,
      timestamp: now,
    });
  });

  return app;
}
