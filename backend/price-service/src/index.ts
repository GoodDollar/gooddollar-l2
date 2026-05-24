import { QuoteCache } from './quote-cache';
import { WsBroadcaster } from './ws-broadcaster';
import { createServer } from './server';
import { bootstrapEtoroSource } from './bootstrap';
import type { EtoroSourceHandle } from './etoro-source';
import { AuditLogger } from './audit-logger';
import { classifySourceError } from './source-status';
import { resolveRuntime, RuntimeBlock, checkRealTradingFence } from './runtime';
import {
  PriceServiceConfig,
  DEFAULT_CONFIG,
  NormalizedQuote,
  RiskFilterResult,
  IngestStats,
  SourceStatus,
} from './types';

export { QuoteCache } from './quote-cache';
export { RiskFilter } from './risk-filter';
export { WsBroadcaster } from './ws-broadcaster';
export { createServer } from './server';
export { connectEtoroSource } from './etoro-source';
export { AuditLogger } from './audit-logger';
export type { AuditLoggerOptions, AuditRecordInput } from './audit-logger';
export type { EtoroSourceConfig, EtoroSourceHandle, MarketDataSource } from './etoro-source';
export {
  bootstrapEtoroSource,
  defaultBootstrapDeps,
} from './bootstrap';
export type { BootstrapDeps, BootstrapResult } from './bootstrap';
export { RuntimeBlock, resolveRuntime, checkRealTradingFence } from './runtime';
export type * from './types';

export interface PriceServiceOptions {
  /** Optional pre-built audit logger; defaults to one using env defaults. */
  auditLogger?: AuditLogger;
}

/**
 * Parse a TCP port from an env var with loud-fail semantics.
 *
 * - Unset / empty → `defaultPort`.
 * - Anything else MUST be a base-10 integer in `1..65535`.
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

/**
 * Parse a positive integer port from env. Returns undefined for unset,
 * empty, or non-positive values so callers can fall through to defaults.
 */
export function envPort(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

export class PriceService {
  readonly cache: QuoteCache;
  readonly broadcaster: WsBroadcaster;
  readonly auditLogger: AuditLogger;
  readonly bootAtMs: number;
  readonly config: PriceServiceConfig;
  private httpServer?: ReturnType<typeof import('http').createServer>;
  private sourceStatus: SourceStatus = {
    connected: false,
    reason: 'not-attached',
    lastAttachAt: null,
  };

  constructor(config?: Partial<PriceServiceConfig>, options?: PriceServiceOptions) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new QuoteCache(config);
    this.broadcaster = new WsBroadcaster();
    this.auditLogger = options?.auditLogger ?? new AuditLogger();
    this.bootAtMs = Date.now();
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

  setSourceStatus(status: SourceStatus): void {
    this.sourceStatus = status;
  }

  getSourceStatus(): SourceStatus {
    return this.sourceStatus;
  }

  getRuntime(): RuntimeBlock {
    return resolveRuntime(this.bootAtMs, this.sourceStatus);
  }

  start(): void {
    const app = createServer(
      this.cache,
      this.config,
      () => this.getIngestStats(),
      () => this.getSourceStatus(),
      () => this.bootAtMs,
      () => ({ port: this.config.wsPort }),
      () => this.broadcaster.getStatus(),
      () => this.getRuntime(),
      () => this.broadcaster.clientCount,
    );
    this.httpServer = app.listen(this.config.port, () => {
      console.log(`[price-service] REST server listening on port ${this.config.port}`);
    });
    this.broadcaster.start(this.config.wsPort, this.cache, () => this.getSourceStatus());
    this.broadcaster.on('listening', () => {
      const port = this.broadcaster.getStatus().port ?? this.config.wsPort;
      console.log(`[price-service] WS broadcaster bound on port ${port}`);
    });
    this.broadcaster.on('error', () => {
      const reason = this.broadcaster.getStatus().bindError ?? 'unknown';
      console.error(`[price-service] WS broadcaster bind failed: ${reason}`);
    });
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
  const fence = checkRealTradingFence();
  if (fence) {
    console.error(fence.message);
    process.exit(fence.exitCode);
  }

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
    if (result.ok && result.handle) {
      service.setSourceStatus({
        connected: true,
        symbols: result.handle.stats().symbols,
        lastAttachAt: Date.now(),
      });
    } else if (!result.ok) {
      service.setSourceStatus({
        connected: false,
        reason: 'source-unavailable',
        detail: result.reason ?? null,
        lastAttachAt: null,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[price-service] eToro source unavailable: ${msg}`);
    console.warn('[price-service] Running without live quotes — use REST API to ingest manually');
    const { reason, detail } = classifySourceError(err);
    service.setSourceStatus({
      connected: false,
      reason,
      detail,
      lastAttachAt: null,
    });
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
