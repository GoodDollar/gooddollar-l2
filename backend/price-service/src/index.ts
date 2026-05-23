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

/**
 * Parse a TCP port from an env var with loud-fail semantics.
 *
 * - Unset / empty → `defaultPort` (operator opted out, use the
 *   service default unchanged).
 * - Anything else MUST be a base-10 integer in `1..65535`. Trailing
 *   whitespace is tolerated (`'9410 '`); embedded non-digits
 *   (`'9410abc'`) and out-of-range values (`'0'`, `'99999'`,
 *   `'-1'`) throw with the var name and the valid range, so a
 *   typo fails loud at boot rather than silently binding the
 *   default.
 *
 * Exported so the unit suite (`__tests__/parse-env-port.test.ts`)
 * can pin the contract without having to spawn the service.
 */
export function parseEnvPort(
  value: string | undefined,
  defaultPort: number,
  name: string,
): number {
  if (value === undefined || value === '') return defaultPort;
  const trimmed = value.trim();
  const n = Number.parseInt(trimmed, 10);
  if (
    !Number.isInteger(n) ||
    String(n) !== trimmed ||
    n < 1 ||
    n > 65535
  ) {
    throw new Error(
      `[price-service] Invalid ${name}="${value}" — must be 1..65535`,
    );
  }
  return n;
}

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
  const service = new PriceService({
    port: parseEnvPort(
      process.env.PRICE_SERVICE_PORT,
      DEFAULT_CONFIG.port,
      'PRICE_SERVICE_PORT',
    ),
    wsPort: parseEnvPort(
      process.env.PRICE_SERVICE_WS_PORT,
      DEFAULT_CONFIG.wsPort,
      'PRICE_SERVICE_WS_PORT',
    ),
  });
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
