import { PriceWsClient } from './price-ws-client';
import { QuoteBuffer } from './quote-buffer';
import { OracleSubmitter } from './oracle-submitter';
import { OracleSignerConfig, UpdateResult } from './types';
import { startHealthServer } from './healthServer';
import { ProofStore, ProofSnapshot, DEFAULT_PROOF_CAPACITY, canonicalEmptyProofSnapshot, redactProofReason, redactRpcEndpoint } from './proof-store';

function readErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

export class OracleSignerService {
  private wsClient: PriceWsClient;
  private buffer: QuoteBuffer;
  private submitter: OracleSubmitter;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly config: OracleSignerConfig;
  private readonly proofStore: ProofStore;
  private running = false;
  private updateCount = 0;

  constructor(config: OracleSignerConfig) {
    this.config = config;
    this.buffer = new QuoteBuffer(config.minDeviationBps);
    this.submitter = new OracleSubmitter(config.rpcUrl, config.oracleAddress, config.signerKey, config.txTimeoutMs);
    this.proofStore = new ProofStore(
      parseInt(process.env.ORACLE_PROOF_CAPACITY || String(DEFAULT_PROOF_CAPACITY), 10),
    );
    this.proofStore.setRailEnabled('stocks', Boolean(config.oracleAddress));
    this.proofStore.setRailEnabled('crypto', false);
    this.proofStore.setChainInfo({
      rpcEndpoint: redactRpcEndpoint(config.rpcUrl),
      signerAddress: this.submitter.signerAddress,
      oracleAddresses: { stocks: config.oracleAddress || null, crypto: null },
    });
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

    const symbols = updates.map(u => u.symbol);
    const mids: Record<string, number> = {};
    for (const update of updates) {
      const quote = this.buffer.getLatestQuote(update.symbol);
      if (quote) mids[update.symbol] = quote.mid;
    }
    const submittedAtMs = Date.now();

    try {
      const result = await this.submitter.submitBatch(updates);
      this.buffer.markSubmitted(updates.map(u => u.symbol));
      this.updateCount++;
      this.proofStore.record('stocks', {
        txHash: result.txHash,
        blockNumber: result.blockNumber ?? 0,
        gasUsed: result.gasUsed.toString(),
        symbols,
        roundTripMs: result.roundTripMs,
        submittedAtMs,
        mids,
      });

      console.log(
        `[oracle-signer] Update #${this.updateCount}: ${result.symbolCount} symbols, ` +
        `tx=${result.txHash}, gas=${result.gasUsed.toString()}, ` +
        `rtt=${result.roundTripMs}ms`,
      );

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[oracle-signer] Submission failed: ${msg}`);
      this.proofStore.recordFailure('stocks', {
        reason: redactProofReason(err),
        errorClass: readErrorCode(err),
        symbols,
        attemptedAtMs: submittedAtMs,
      });
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

  getProofSnapshot(): ProofSnapshot {
    return this.proofStore.snapshot();
  }

  serviceStatus(): { status: 'ok' | 'degraded'; reason?: string } {
    const requestedStatus = process.env.SERVICE_HEALTH_STATUS;
    if (requestedStatus === 'degraded' || requestedStatus === 'health-only') {
      return {
        status: 'degraded',
        reason: redactProofReason(process.env.SERVICE_DISABLED_REASON ?? 'service loop disabled'),
      };
    }
    return { status: 'ok' };
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
    txTimeoutMs: parseInt(process.env.ORACLE_TX_TIMEOUT || '60000', 10),
    symbols: (process.env.ORACLE_SYMBOLS || 'AAPL,TSLA,NVDA,MSFT,META,AMZN,GOOGL,SPY,QQQ,NFLX')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
  };
}

async function main(): Promise<void> {
  // Start health server FIRST so the process is always reachable on its health
  // port — even if the service cannot start due to missing config (e.g. no
  // ORACLE_SIGNER_KEY). PM2 will not restart-loop the process and the
  // status-aggregator will see "ok" instead of "unreachable".
  let proofRef: () => ProofSnapshot = canonicalEmptyProofSnapshot;
  let proofStatusRef: () => { status: 'ok' | 'degraded'; reason?: string } = () => ({ status: 'ok' });

  const healthServer = startHealthServer({
    name: 'oracle-signer',
    port: parseInt(process.env.HEALTH_PORT ?? process.env.ORACLE_SIGNER_PORT ?? '9107', 10),
    proofProvider: () => proofRef(),
    proofStatusProvider: () => proofStatusRef(),
  });

  let config: OracleSignerConfig;
  try {
    config = loadConfig();
  } catch (err) {
    const reason = 'ORACLE_SIGNER_KEY is not set; signer loop disabled';
    process.env.SERVICE_HEALTH_STATUS = 'degraded';
    process.env.SERVICE_DISABLED_REASON = reason;
    proofStatusRef = () => ({
      status: 'degraded',
      reason: redactProofReason(process.env.SERVICE_DISABLED_REASON ?? reason),
    });
    console.warn('[oracle-signer] Config error — service loop disabled, health server running on port', process.env.ORACLE_SIGNER_PORT ?? '9107', ':', err instanceof Error ? err.message : String(err));
    // Return without exiting: the http.Server above keeps the event loop alive.
    return;
  }

  const service = new OracleSignerService(config);
  proofRef = () => service.getProofSnapshot();
  proofStatusRef = () => service.serviceStatus();

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
