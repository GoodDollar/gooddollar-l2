import {
  DEFAULT_LANE_SYMBOLS,
  INSTRUMENT_SYMBOLS,
  partitionLaneSymbols,
} from '@goodchain/etoro-client';
import { PriceWsClient } from './price-ws-client';
import { QuoteBuffer } from './quote-buffer';
import { OracleSubmitter } from './oracle-submitter';
import { OracleSignerConfig, UpdateResult } from './types';
import { startHealthServer } from './healthServer';

// Prefix used by the stuck-tick watchdog when it owns the degrade state.
// Matched on clear so we never clobber another component's degrade reason
// (e.g. unknown-symbol or RPC-URL fallback set by loadConfig).
const WATCHDOG_REASON_PREFIX = 'tick stuck >';

export class OracleSignerService {
  private wsClient: PriceWsClient;
  private buffer: QuoteBuffer;
  private submitter: OracleSubmitter;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private watchdogHandle: ReturnType<typeof setInterval> | null = null;
  private readonly config: OracleSignerConfig;
  private running = false;
  private updateCount = 0;
  private tickInFlight = false;
  private overlappedTickCount = 0;
  private lastTickStartedAtMs: number | null = null;

  constructor(config: OracleSignerConfig) {
    this.config = config;
    this.buffer = new QuoteBuffer(config.minDeviationBps);
    this.submitter = new OracleSubmitter(config.rpcUrl, config.oracleAddress, config.signerKey, config.txTimeoutMs);
    this.wsClient = new PriceWsClient(config.priceServiceUrl, (quote) => {
      if (config.symbols.length === 0 || config.symbols.includes(quote.symbol)) {
        this.buffer.update(quote);
      }
    });
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    this.wsClient.connect();
    console.log(`[oracle-signer] Connected to price service at ${this.config.priceServiceUrl}`);
    console.log(`[oracle-signer] Signer: ${this.submitter.signerAddress}`);
    console.log(`[oracle-signer] Oracle: ${this.config.oracleAddress}`);
    console.log(`[oracle-signer] Interval: ${this.config.updateIntervalMs}ms, deviation: ${this.config.minDeviationBps}bps`);

    this.intervalHandle = setInterval(() => {
      this.tick().catch(err => {
        console.error('[oracle-signer] tick error:', err.message);
      });
    }, this.config.updateIntervalMs);

    // Watchdog: a tick that runs longer than 2x the tx timeout almost
    // certainly means the underlying tx is wedged. Surface it through
    // the canonical degrade env vars so /health turns amber.
    const watchdogPeriodMs = Math.max(50, Math.floor(this.config.txTimeoutMs / 4));
    this.watchdogHandle = setInterval(() => this.runWatchdog(), watchdogPeriodMs);
  }

  async tick(): Promise<UpdateResult | null> {
    if (this.tickInFlight) {
      this.overlappedTickCount++;
      const ageMs = Date.now() - (this.lastTickStartedAtMs ?? 0);
      console.warn(
        `[oracle-signer] Skipping tick — previous submitBatch still in flight ` +
        `(started ${ageMs}ms ago, overlapped ${this.overlappedTickCount}x)`,
      );
      return null;
    }

    const updates = this.buffer.getPendingUpdates();
    if (updates.length === 0) return null;

    // Capture the actually-submitted mids before awaiting confirmation
    // so the deviation gate is anchored to the on-chain price even if
    // WS pushes mutate latestQuotes during the in-flight tx.
    const submittedMids = updates.map((u) => ({
      symbol: u.symbol,
      mid: Number(u.price8) / 1e8,
    }));
    this.tickInFlight = true;
    this.lastTickStartedAtMs = Date.now();
    try {
      const result = await this.submitter.submitBatch(updates);
      this.buffer.markSubmitted(submittedMids);
      this.updateCount++;

      console.log(
        `[oracle-signer] Update #${this.updateCount}: ${result.symbolCount} symbols, ` +
        `tx=${result.txHash}, gas=${result.gasUsed.toString()}, ` +
        `rtt=${result.roundTripMs}ms`,
      );

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[oracle-signer] Submission failed: ${msg}`);
      throw err;
    } finally {
      this.tickInFlight = false;
    }
  }

  private runWatchdog(): void {
    const stuckThresholdMs = this.config.txTimeoutMs * 2;
    const startedAt = this.lastTickStartedAtMs;
    const elapsed = startedAt === null ? 0 : Date.now() - startedAt;
    const isStuck = this.tickInFlight && elapsed > stuckThresholdMs;

    if (isStuck) {
      process.env.SERVICE_HEALTH_STATUS = 'degraded';
      process.env.SERVICE_DISABLED_REASON =
        `${WATCHDOG_REASON_PREFIX}${elapsed}ms — tx timeout exceeded twice`;
      return;
    }

    // Only clear a degrade marker that the watchdog itself set; never
    // touch another source's degrade reason (e.g. unknown symbols).
    if (process.env.SERVICE_DISABLED_REASON?.startsWith(WATCHDOG_REASON_PREFIX)) {
      delete process.env.SERVICE_HEALTH_STATUS;
      delete process.env.SERVICE_DISABLED_REASON;
    }
  }

  stop(): void {
    this.running = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    if (this.watchdogHandle) {
      clearInterval(this.watchdogHandle);
      this.watchdogHandle = null;
    }
    this.wsClient.close();
    console.log(`[oracle-signer] Stopped after ${this.updateCount} updates`);
  }

  get inFlight(): boolean {
    return this.tickInFlight;
  }

  get overlappedTicks(): number {
    return this.overlappedTickCount;
  }

  get lastTickStartedAt(): number | null {
    return this.lastTickStartedAtMs;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get totalUpdates(): number {
    return this.updateCount;
  }

  get bufferedSymbols(): number {
    return this.buffer.symbolCount;
  }

  /** Exposed for testing */
  getBuffer(): QuoteBuffer {
    return this.buffer;
  }

  /** Exposed for testing */
  getSubmitter(): OracleSubmitter {
    return this.submitter;
  }
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): OracleSignerConfig {
  const signerKey = env.ORACLE_SIGNER_KEY;
  if (!signerKey) {
    throw new Error('ORACLE_SIGNER_KEY env var required');
  }

  const rawSymbols = (env.ORACLE_SYMBOLS ?? DEFAULT_LANE_SYMBOLS.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const { valid: symbols, unknown } = partitionLaneSymbols(rawSymbols);
  if (unknown.length > 0) {
    console.error(
      `[oracle-signer] Unknown symbols: ${unknown.join(', ')}. ` +
      `Valid: ${INSTRUMENT_SYMBOLS.join(', ')}`,
    );
    env.SERVICE_HEALTH_STATUS = 'degraded';
    env.SERVICE_DISABLED_REASON = `Unknown symbols: ${unknown.join(',')}`;
  }

  // RPC alias chain. `.env.example` documents L2_RPC_URL as an alias
  // for RPC_URL — honor both. The legacy `env.RPC` (no `_URL`) read
  // was an undocumented typo and is no longer accepted. Mark the
  // service degraded when neither is set so the silent-localhost
  // fallback surfaces on `/health` instead of looking like a working
  // boot pointed at a non-existent local Anvil. Don't clobber an
  // earlier degrade reason (e.g. unknown symbols) — first cause wins.
  const rpcUrl = env.L2_RPC_URL || env.RPC_URL || 'http://localhost:8545';
  if (!env.L2_RPC_URL && !env.RPC_URL && !env.SERVICE_DISABLED_REASON) {
    env.SERVICE_HEALTH_STATUS = 'degraded';
    env.SERVICE_DISABLED_REASON =
      'L2_RPC_URL/RPC_URL not set; signer points at default localhost:8545';
  }

  return {
    priceServiceUrl: env.PRICE_SERVICE_URL || 'ws://localhost:9301',
    rpcUrl,
    oracleAddress: env.STOCK_ORACLE_V2_ADDRESS || '',
    signerKey,
    updateIntervalMs: parseInt(env.ORACLE_UPDATE_INTERVAL || '5000', 10),
    minDeviationBps: parseInt(env.ORACLE_MIN_DEVIATION || '10', 10),
    txTimeoutMs: parseInt(env.ORACLE_TX_TIMEOUT || '60000', 10),
    symbols,
  };
}

async function main(): Promise<void> {
  // Start health server FIRST so the process is always reachable on its health
  // port — even if the service cannot start due to missing config (e.g. no
  // ORACLE_SIGNER_KEY). PM2 will not restart-loop the process and the
  // status-aggregator will see "ok" instead of "unreachable".
  const healthServer = startHealthServer({
    name: 'oracle-signer',
    port: parseInt(process.env.HEALTH_PORT ?? process.env.ORACLE_SIGNER_PORT ?? '9107', 10),
  });

  let config: OracleSignerConfig;
  try {
    config = loadConfig();
  } catch (err) {
    process.env.SERVICE_HEALTH_STATUS = 'degraded';
    process.env.SERVICE_DISABLED_REASON = 'ORACLE_SIGNER_KEY is not set; signer loop disabled';
    console.warn('[oracle-signer] Config error — service loop disabled, health server running on port', process.env.ORACLE_SIGNER_PORT ?? '9107', ':', err instanceof Error ? err.message : String(err));
    // Return without exiting: the http.Server above keeps the event loop alive.
    return;
  }

  const service = new OracleSignerService(config);

  const shutdown = () => {
    service.stop();
    healthServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  service.start().catch(err => {
    console.error('[oracle-signer] Failed to start:', err);
    process.exit(1);
  });
}

if (require.main === module) {
  main().catch(err => {
    console.error('[oracle-signer] Fatal:', err);
    process.exit(1);
  });
}
