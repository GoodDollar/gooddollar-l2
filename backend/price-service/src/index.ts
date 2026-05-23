export { QuoteCache } from './quote-cache';
export { RiskFilter } from './risk-filter';
export { WsBroadcaster } from './ws-broadcaster';
export { createServer } from './server';
export { connectEtoroSource } from './etoro-source';
export { AuditLogger } from './audit-logger';
export type { AuditLoggerOptions, AuditRecordInput } from './audit-logger';
export type { EtoroSourceConfig, EtoroSourceHandle, MarketDataSource } from './etoro-source';
export type * from './types';

import { QuoteCache } from './quote-cache';
import { WsBroadcaster } from './ws-broadcaster';
import { createServer } from './server';
import { connectEtoroSource } from './etoro-source';
import { AuditLogger } from './audit-logger';
import { PriceServiceConfig, DEFAULT_CONFIG, NormalizedQuote, RiskFilterResult, IngestStats } from './types';

export interface PriceServiceOptions {
  /** Optional pre-built audit logger; defaults to one using env defaults. */
  auditLogger?: AuditLogger;
}

export class PriceService {
  readonly cache: QuoteCache;
  readonly broadcaster: WsBroadcaster;
  readonly auditLogger: AuditLogger;
  private readonly config: PriceServiceConfig;
  private httpServer?: ReturnType<typeof import('http').createServer>;

  constructor(config?: Partial<PriceServiceConfig>, options?: PriceServiceOptions) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new QuoteCache(config);
    this.broadcaster = new WsBroadcaster();
    this.auditLogger = options?.auditLogger ?? new AuditLogger();
  }

  ingestQuote(quote: NormalizedQuote): RiskFilterResult {
    const result = this.cache.update(quote);
    this.auditLogger.record({
      accepted: result.accepted,
      reason: result.reason,
      quote: result.quote,
    });
    return result;
  }

  getIngestStats(): IngestStats {
    return this.auditLogger.stats();
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

  let sourceHandle: import('./etoro-source').EtoroSourceHandle | undefined;

  try {
    const { EtoroClient } = require('../../etoro-client/src/index') as {
      EtoroClient: new (config?: unknown) => { marketData: import('./etoro-source').MarketDataSource };
    };

    const mode = process.env.ETORO_MODE ?? 'sandbox';
    console.log(`[price-service] Connecting to eToro in ${mode} mode...`);

    const client = new EtoroClient();
    const symbols = (process.env.ORACLE_SYMBOLS ?? service['config'].symbols.join(',')).split(',').map(s => s.trim()).filter(Boolean);

    sourceHandle = connectEtoroSource(service, {
      symbols,
      marketData: client.marketData,
    });

    console.log(`[price-service] Subscribed to ${symbols.length} symbols via eToro: ${symbols.join(', ')}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[price-service] eToro source unavailable: ${msg}`);
    console.warn('[price-service] Running without live quotes — use REST API to ingest manually');
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
