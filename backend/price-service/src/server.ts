import express, { Request, Response } from 'express';
import { QuoteCache } from './quote-cache';
import { PriceServiceConfig, DEFAULT_CONFIG } from './types';

export function createServer(
  cache: QuoteCache,
  config?: Partial<PriceServiceConfig>,
): express.Express {
  const app = express();
  const cfg = { ...DEFAULT_CONFIG, ...config };

  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    const fresh = cache.getFresh();
    const total = cache.size;
    const healthy = fresh.length > 0 || total === 0;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      freshQuotes: fresh.length,
      totalCached: total,
      configuredSymbols: cfg.symbols.length,
      timestamp: Date.now(),
    });
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

  return app;
}
