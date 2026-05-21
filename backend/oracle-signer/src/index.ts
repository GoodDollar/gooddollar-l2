import { PriceWsClient } from './price-ws-client';
import { QuoteBuffer } from './quote-buffer';
import { OracleSubmitter } from './oracle-submitter';
import { OracleSignerConfig, UpdateResult } from './types';

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
    this.submitter = new OracleSubmitter(config.rpcUrl, config.oracleAddress, config.signerKey);
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

function loadConfig(): OracleSignerConfig {
  const signerKey = process.env.ORACLE_SIGNER_KEY;
  if (!signerKey) {
    throw new Error('ORACLE_SIGNER_KEY env var required');
  }

  return {
    priceServiceUrl: process.env.PRICE_SERVICE_URL || 'ws://localhost:4001',
    rpcUrl: process.env.L2_RPC_URL || process.env.RPC || 'http://localhost:8545',
    oracleAddress: process.env.STOCK_ORACLE_V2_ADDRESS || '',
    signerKey,
    updateIntervalMs: parseInt(process.env.ORACLE_UPDATE_INTERVAL || '5000', 10),
    minDeviationBps: parseInt(process.env.ORACLE_MIN_DEVIATION || '10', 10),
    symbols: (process.env.ORACLE_SYMBOLS || 'AAPL,TSLA,NVDA,MSFT,META,AMZN,GOOGL,SPY,QQQ,NFLX')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  };
}

if (require.main === module) {
  const config = loadConfig();
  const service = new OracleSignerService(config);

  service.start().catch(err => {
    console.error('[oracle-signer] Failed to start:', err);
    process.exit(1);
  });

  const shutdown = () => {
    service.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
