export { QuoteCache } from './quote-cache';
export { RiskFilter } from './risk-filter';
export { WsBroadcaster } from './ws-broadcaster';
export { createServer } from './server';
export type * from './types';

import { QuoteCache } from './quote-cache';
import { WsBroadcaster } from './ws-broadcaster';
import { createServer } from './server';
import { PriceServiceConfig, DEFAULT_CONFIG, NormalizedQuote } from './types';

export class PriceService {
  readonly cache: QuoteCache;
  readonly broadcaster: WsBroadcaster;
  private readonly config: PriceServiceConfig;
  private httpServer?: ReturnType<typeof import('http').createServer>;

  constructor(config?: Partial<PriceServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new QuoteCache(config);
    this.broadcaster = new WsBroadcaster();
  }

  ingestQuote(quote: NormalizedQuote): void {
    this.cache.update(quote);
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

  process.on('SIGINT', () => {
    console.log('[price-service] shutting down...');
    service.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    service.stop();
    process.exit(0);
  });
}
