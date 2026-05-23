import type { Server } from 'http';
import { QuoteCache } from './quote-cache';
import { WsBroadcaster } from './ws-broadcaster';
import { createServer } from './server';
import { bootstrapEtoroSource } from './bootstrap';
import type { EtoroSourceHandle } from './etoro-source';
import { PriceServiceConfig, DEFAULT_CONFIG, NormalizedQuote, RiskFilterResult } from './types';

export { QuoteCache } from './quote-cache';
export { RiskFilter } from './risk-filter';
export { WsBroadcaster } from './ws-broadcaster';
export { createServer } from './server';
export { connectEtoroSource } from './etoro-source';
export type { EtoroSourceConfig, EtoroSourceHandle, MarketDataSource } from './etoro-source';
export {
  bootstrapEtoroSource,
  defaultBootstrapDeps,
} from './bootstrap';
export type { BootstrapDeps, BootstrapResult } from './bootstrap';
export type * from './types';

export class PriceService {
  readonly cache: QuoteCache;
  readonly broadcaster: WsBroadcaster;
  readonly config: PriceServiceConfig;
  private httpServer?: Server;

  constructor(config?: Partial<PriceServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new QuoteCache(config);
    this.broadcaster = new WsBroadcaster();
  }

  ingestQuote(quote: NormalizedQuote): RiskFilterResult {
    return this.cache.update(quote);
  }

  start(): void {
    const app = createServer(this.cache, this.config);
    this.httpServer = app.listen(this.config.port, () => {
      console.log(`[price-service] REST server listening on port ${this.config.port}`);
    });
    this.broadcaster.start(this.config.wsPort, this.cache);
    console.log(`[price-service] WS broadcaster listening on port ${this.config.wsPort}`);
  }

  stop(): void {
    this.broadcaster.stop();
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = undefined;
    }
  }
}

if (require.main === module) {
  const service = new PriceService();
  service.start();

  let sourceHandle: EtoroSourceHandle | undefined;

  try {
    const result = bootstrapEtoroSource(service);
    sourceHandle = result.handle;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[price-service] fatal: ${msg}`);
    process.exit(1);
  }

  const shutdown = () => {
    console.log('[price-service] shutting down...');
    sourceHandle?.stop();
    service.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
