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

export class OracleSignerService {
  private wsClient: PriceWsClient;
  private buffer: QuoteBuffer;
  private submitter: OracleSubmitter;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly config: OracleSignerConfig;
  private running = false;
  private updateCount = 0;

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
  }

  async tick(): Promise<UpdateResult | null> {
    const updates = this.buffer.getPendingUpdates();
    if (updates.length === 0) return null;

    try {
      const result = await this.submitter.submitBatch(updates);
      this.buffer.markSubmitted(updates.map(u => u.symbol));
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
    }
  }

  stop(): void {
    this.running = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.wsClient.close();
    console.log(`[oracle-signer] Stopped after ${this.updateCount} updates`);
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

  return {
    priceServiceUrl: env.PRICE_SERVICE_URL || 'ws://localhost:9301',
    rpcUrl: env.L2_RPC_URL || env.RPC || 'http://localhost:8545',
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
