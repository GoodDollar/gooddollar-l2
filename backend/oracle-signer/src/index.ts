/**
 * `oracle-signer` — off-chain keeper that reads price-service quotes and
 * publishes batched updates to the on-chain price oracles.
 *
 * Two rails:
 *   - Stocks: `StockOracleV2.batchUpdatePrices(symbol[], price8[], ts[], session[], confidence[])`
 *   - Crypto: `SwapPriceOracle.batchUpdatePrices(address[], price8[])` keyed by
 *     a configured `CRYPTO_SYMBOL_MAP`.
 *
 * Either rail can be disabled by leaving its oracle address empty. If both
 * rails end up disabled the service degrades (process stays up, health server
 * binds, no setInterval) — same graceful pattern as the missing-key and
 * chain-guard refusal paths.
 *
 * Env (see README):
 *   ORACLE_SIGNER_KEY (required), PRICE_SERVICE_URL, L2_RPC_URL,
 *   STOCK_ORACLE_V2_ADDRESS, SWAP_PRICE_ORACLE_ADDRESS,
 *   CRYPTO_SYMBOL_MAP (JSON or `KEY=ADDR,...`),
 *   ORACLE_UPDATE_INTERVAL, ORACLE_MIN_DEVIATION,
 *   ORACLE_CRYPTO_UPDATE_INTERVAL, ORACLE_CRYPTO_MIN_DEVIATION,
 *   ORACLE_SYMBOLS, ORACLE_CRYPTO_SYMBOLS,
 *   ORACLE_SIGNER_ALLOWED_CHAIN_IDS (default 31337,1337).
 */

import { PriceWsClient } from './price-ws-client';
import { QuoteBuffer } from './quote-buffer';
import { OracleSubmitter } from './oracle-submitter';
import { CryptoOracleSubmitter } from './crypto-oracle-submitter';
import { CryptoQuoteBuffer } from './crypto-quote-buffer';
import { CryptoSymbolMap, parseCryptoSymbolMap } from './crypto-symbol-map';
import { NormalizedQuote, OracleSignerConfig, UpdateResult } from './types';
import { startHealthServer } from './healthServer';
import { assertDevnetChain, parseAllowedChainIds } from './chain-guard';
import { ProofStore, ProofSnapshot, DEFAULT_PROOF_CAPACITY } from './proof-store';
import { AuditLog } from './audit-log';
import * as path from 'path';

export interface OracleSignerDeps {
  /** Optional chain-id getter. Defaults to reading from a rail's provider. Tests inject a stub to avoid a real RPC. */
  getChainId?: () => Promise<number>;
  /** Optional ProofStore. Defaults to a fresh in-memory store. */
  proofStore?: ProofStore;
  /** Optional AuditLog. Defaults to a writer under `.autobuilder/logs/oracle-signer/`. */
  auditLog?: AuditLog;
}

export interface RailStats {
  enabled: boolean;
  updateCount: number;
  bufferedSymbols: number;
}

export interface OracleSignerStats {
  stocks: RailStats;
  crypto: RailStats;
}

export class OracleSignerService {
  private wsClient: PriceWsClient;
  private readonly config: OracleSignerConfig;
  private readonly getChainId: () => Promise<number>;

  // Stocks rail
  private buffer: QuoteBuffer | null = null;
  private submitter: OracleSubmitter | null = null;
  private stocksIntervalHandle: ReturnType<typeof setInterval> | null = null;
  private stocksUpdateCount = 0;

  // Crypto rail
  private cryptoBuffer: CryptoQuoteBuffer | null = null;
  private cryptoSubmitter: CryptoOracleSubmitter | null = null;
  private cryptoSymbolMap: CryptoSymbolMap | null = null;
  private cryptoIntervalHandle: ReturnType<typeof setInterval> | null = null;
  private cryptoUpdateCount = 0;
  private warnedMissingCrypto = new Set<string>();
  private warnedDroppedUnknown = new Set<string>();

  private running = false;
  private refused = false;
  private refusalReason: string | null = null;

  private readonly proofStore: ProofStore;
  private readonly auditLog: AuditLog;

  constructor(config: OracleSignerConfig, deps: OracleSignerDeps = {}) {
    this.config = config;
    this.proofStore = deps.proofStore ?? new ProofStore(
      parseInt(process.env.ORACLE_PROOF_CAPACITY || String(DEFAULT_PROOF_CAPACITY), 10),
    );
    this.auditLog = deps.auditLog ?? new AuditLog({
      dir: process.env.ORACLE_AUDIT_LOG_DIR || path.join(process.cwd(), '.autobuilder', 'logs', 'oracle-signer'),
    });

    // ---- Stocks rail wiring (enabled when STOCK_ORACLE_V2_ADDRESS is set) ----
    const stocksEnabled = Boolean(config.oracleAddress && config.oracleAddress.length > 0);
    if (stocksEnabled) {
      this.buffer = new QuoteBuffer(config.minDeviationBps);
      this.submitter = new OracleSubmitter(
        config.rpcUrl, config.oracleAddress, config.signerKey, config.txTimeoutMs,
      );
    }

    // ---- Crypto rail wiring (enabled when both address and map are present) ----
    const cryptoMap = parseCryptoSymbolMap(config.cryptoSymbolMap);
    const cryptoAddrSet = Boolean(config.swapPriceOracleAddress && config.swapPriceOracleAddress.length > 0);
    const cryptoEnabled = cryptoAddrSet && cryptoMap.size > 0;
    if (cryptoEnabled) {
      this.cryptoSymbolMap = cryptoMap;
      this.cryptoBuffer = new CryptoQuoteBuffer(
        config.cryptoMinDeviationBps ?? config.minDeviationBps,
        cryptoMap,
      );
      this.cryptoSubmitter = new CryptoOracleSubmitter(
        config.rpcUrl, config.swapPriceOracleAddress!, config.signerKey, config.txTimeoutMs,
      );
    } else if (cryptoAddrSet && cryptoMap.size === 0) {
      // Soft warn: address set but no symbols mapped. Operator likely forgot
      // the map. Don't crash; just leave the rail disabled.
      console.warn('[oracle-signer:crypto] SWAP_PRICE_ORACLE_ADDRESS is set but CRYPTO_SYMBOL_MAP is empty — crypto rail disabled.');
    }

    this.wsClient = new PriceWsClient(config.priceServiceUrl, (q) => this.dispatchQuote(q));

    // Chain-id probe falls back to whichever rail's provider is available.
    const providerSource = this.submitter ?? this.cryptoSubmitter;
    this.getChainId = deps.getChainId ?? (async () => {
      if (!providerSource) {
        throw new Error('no rail enabled; cannot probe chain id');
      }
      const net = await providerSource.provider.getNetwork();
      return Number(net.chainId);
    });
  }

  /**
   * Route a single incoming quote to the appropriate rail based on `assetClass`.
   *
   * - equity / etf / index → stocks (if symbol passes the stocks allowlist).
   * - crypto → crypto rail; symbols missing from the map produce a warn-once log.
   * - unknown/undefined → fallback to stocks if symbol is in the allowlist,
   *   otherwise drop with a warn-once log.
   */
  private dispatchQuote(quote: NormalizedQuote): void {
    const ac = (quote.assetClass ?? '').toLowerCase();

    if (ac === 'equity' || ac === 'etf' || ac === 'index') {
      this.routeToStocks(quote);
      return;
    }

    if (ac === 'crypto') {
      if (!this.cryptoBuffer || !this.cryptoSymbolMap) return;
      if (!this.cryptoSymbolMap.has(quote.symbol)) {
        const key = quote.symbol.toUpperCase();
        if (!this.warnedMissingCrypto.has(key)) {
          this.warnedMissingCrypto.add(key);
          console.warn(`[oracle-signer:crypto] symbol ${key} has no address in CRYPTO_SYMBOL_MAP — dropping all future quotes for this symbol until the map is updated.`);
        }
        return;
      }
      this.cryptoBuffer.update(quote);
      return;
    }

    // Unknown assetClass: legacy upstreams may omit the field. Fall back to
    // the stocks rail when the symbol is explicitly allowlisted there.
    if (this.buffer && this.symbolInStocksAllowlist(quote.symbol)) {
      this.buffer.update(quote);
      return;
    }

    const key = quote.symbol.toUpperCase();
    if (!this.warnedDroppedUnknown.has(key)) {
      this.warnedDroppedUnknown.add(key);
      console.warn(`[oracle-signer] symbol ${key} (assetClass=${quote.assetClass ?? 'undefined'}) is not in any rail — dropping all future quotes for this symbol.`);
    }
  }

  private routeToStocks(quote: NormalizedQuote): void {
    if (!this.buffer) return;
    if (!this.symbolInStocksAllowlist(quote.symbol)) return;
    this.buffer.update(quote);
  }

  private symbolInStocksAllowlist(symbol: string): boolean {
    return this.config.symbols.length === 0 || this.config.symbols.includes(symbol);
  }

  async start(): Promise<void> {
    if (this.running || this.refused) return;

    // If neither rail is configured we degrade just like the missing-key path.
    if (!this.buffer && !this.cryptoBuffer) {
      this.refused = true;
      this.refusalReason = 'no rail configured (set STOCK_ORACLE_V2_ADDRESS and/or SWAP_PRICE_ORACLE_ADDRESS+CRYPTO_SYMBOL_MAP)';
      process.env.SERVICE_HEALTH_STATUS = 'degraded';
      process.env.SERVICE_DISABLED_REASON = this.refusalReason;
      console.warn(`[oracle-signer] ${this.refusalReason} — submission loop disabled, health server stays up`);
      return;
    }

    // Devnet chain-id guard — defence in depth. Must run BEFORE WS connect.
    const allowed = new Set(this.config.allowedChainIds);
    let guard;
    try {
      guard = await assertDevnetChain(this.getChainId, allowed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.refused = true;
      this.refusalReason = `chain-guard probe failed: ${msg}`;
      process.env.SERVICE_HEALTH_STATUS = 'degraded';
      process.env.SERVICE_DISABLED_REASON = this.refusalReason;
      console.warn(`[oracle-signer] ${this.refusalReason} — submission loop disabled, health server stays up`);
      return;
    }

    if (!guard.allowed) {
      this.refused = true;
      this.refusalReason = `refused: non-devnet chain id ${guard.chainId}`;
      process.env.SERVICE_HEALTH_STATUS = 'degraded';
      process.env.SERVICE_DISABLED_REASON = this.refusalReason;
      console.warn(
        `[oracle-signer] ${this.refusalReason} — submission loop disabled, health server stays up. ` +
        `Allowed chain ids: [${Array.from(allowed).sort((a, b) => a - b).join(', ')}]. ` +
        `Set ORACLE_SIGNER_ALLOWED_CHAIN_IDS to override (devnet-only).`,
      );
      return;
    }

    this.running = true;
    this.wsClient.connect();
    console.log(`[oracle-signer] Connected to price service at ${this.config.priceServiceUrl}`);
    console.log(`[oracle-signer] Chain id: ${guard.chainId} (allowlist OK)`);

    if (this.submitter) {
      console.log(`[oracle-signer:stocks] Signer: ${this.submitter.signerAddress}`);
      console.log(`[oracle-signer:stocks] Oracle: ${this.config.oracleAddress}`);
      console.log(`[oracle-signer:stocks] Interval: ${this.config.updateIntervalMs}ms, deviation: ${this.config.minDeviationBps}bps`);
      this.stocksIntervalHandle = setInterval(() => {
        this.tickStocks().catch(err => {
          console.error('[oracle-signer:stocks] tick error:', err.message);
        });
      }, this.config.updateIntervalMs);
    }

    if (this.cryptoSubmitter && this.cryptoBuffer && this.cryptoSymbolMap) {
      const cryptoInterval = this.config.cryptoUpdateIntervalMs ?? this.config.updateIntervalMs;
      const cryptoDev = this.config.cryptoMinDeviationBps ?? this.config.minDeviationBps;
      console.log(`[oracle-signer:crypto] Signer: ${this.cryptoSubmitter.signerAddress}`);
      console.log(`[oracle-signer:crypto] Oracle: ${this.config.swapPriceOracleAddress}`);
      console.log(`[oracle-signer:crypto] Interval: ${cryptoInterval}ms, deviation: ${cryptoDev}bps`);
      console.log(`[oracle-signer:crypto] Symbols: [${this.cryptoSymbolMap.symbols().sort().join(', ')}]`);
      this.cryptoIntervalHandle = setInterval(() => {
        this.tickCrypto().catch(err => {
          console.error('[oracle-signer:crypto] tick error:', err.message);
        });
      }, cryptoInterval);
    }
  }

  /** Stocks-rail tick. Kept as the public `tick()` alias for back-compat. */
  async tickStocks(): Promise<UpdateResult | null> {
    if (!this.buffer || !this.submitter) return null;
    const updates = this.buffer.getPendingUpdates();
    if (updates.length === 0) return null;

    const symbols = updates.map(u => u.symbol);
    const mids: Record<string, number> = {};
    for (const u of updates) {
      const q = this.buffer.getLatestQuote(u.symbol);
      if (q) mids[u.symbol] = q.mid;
    }

    try {
      const submittedAtMs = Date.now();
      const result = await this.submitter.submitBatch(updates);
      this.buffer.markSubmitted(symbols);
      this.stocksUpdateCount++;

      this.proofStore.record('stocks', {
        txHash: result.txHash,
        blockNumber: result.blockNumber ?? 0,
        gasUsed: result.gasUsed.toString(),
        symbols,
        roundTripMs: result.roundTripMs,
        submittedAtMs,
        mids,
      });
      void this.auditLog.append({
        rail: 'stocks', event: 'submit_ok',
        txHash: result.txHash, symbols,
        blockNumber: result.blockNumber, gasUsed: result.gasUsed.toString(),
        roundTripMs: result.roundTripMs,
      });

      console.log(
        `[oracle-signer:stocks] Update #${this.stocksUpdateCount}: ${result.symbolCount} symbols, ` +
        `tx=${result.txHash}, gas=${result.gasUsed.toString()}, ` +
        `rtt=${result.roundTripMs}ms`,
      );
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[oracle-signer:stocks] Submission failed: ${msg}`);
      void this.auditLog.append({ rail: 'stocks', event: 'submit_fail', error: msg, symbols });
      throw err;
    }
  }

  /** Crypto-rail tick. */
  async tickCrypto(): Promise<UpdateResult | null> {
    if (!this.cryptoBuffer || !this.cryptoSubmitter) return null;
    const updates = this.cryptoBuffer.getPendingUpdates();
    if (updates.length === 0) return null;

    const symbols = updates.map(u => u.symbol);
    const mids: Record<string, number> = {};
    for (const u of updates) {
      const q = this.cryptoBuffer.getLatestQuote(u.symbol);
      if (q) mids[u.symbol] = q.mid;
    }

    try {
      const submittedAtMs = Date.now();
      const result = await this.cryptoSubmitter.submitBatch(updates);
      this.cryptoBuffer.markSubmitted(symbols);
      this.cryptoUpdateCount++;

      this.proofStore.record('crypto', {
        txHash: result.txHash,
        blockNumber: result.blockNumber ?? 0,
        gasUsed: result.gasUsed.toString(),
        symbols,
        roundTripMs: result.roundTripMs,
        submittedAtMs,
        mids,
      });
      void this.auditLog.append({
        rail: 'crypto', event: 'submit_ok',
        txHash: result.txHash, symbols,
        blockNumber: result.blockNumber, gasUsed: result.gasUsed.toString(),
        roundTripMs: result.roundTripMs,
      });

      console.log(
        `[oracle-signer:crypto] Update #${this.cryptoUpdateCount}: ${result.symbolCount} symbols, ` +
        `tx=${result.txHash}, gas=${result.gasUsed.toString()}, ` +
        `rtt=${result.roundTripMs}ms`,
      );
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[oracle-signer:crypto] Submission failed: ${msg}`);
      void this.auditLog.append({ rail: 'crypto', event: 'submit_fail', error: msg, symbols });
      throw err;
    }
  }

  /** Public getter for the proof snapshot — wired into the health server's `/proof` route. */
  getProofSnapshot(): ProofSnapshot {
    return this.proofStore.snapshot();
  }

  /** Back-compat alias. Today this returns the stocks-rail tick result. */
  async tick(): Promise<UpdateResult | null> {
    return this.tickStocks();
  }

  stop(): void {
    this.running = false;
    if (this.stocksIntervalHandle) { clearInterval(this.stocksIntervalHandle); this.stocksIntervalHandle = null; }
    if (this.cryptoIntervalHandle) { clearInterval(this.cryptoIntervalHandle); this.cryptoIntervalHandle = null; }
    this.wsClient.close();
    console.log(`[oracle-signer] Stopped after ${this.stocksUpdateCount + this.cryptoUpdateCount} updates (stocks=${this.stocksUpdateCount}, crypto=${this.cryptoUpdateCount})`);
  }

  get isRunning(): boolean { return this.running; }
  get totalUpdates(): number { return this.stocksUpdateCount + this.cryptoUpdateCount; }
  get bufferedSymbols(): number {
    return (this.buffer?.symbolCount ?? 0) + (this.cryptoBuffer?.symbolCount ?? 0);
  }

  get isRefused(): boolean { return this.refused; }
  getRefusalReason(): string | null { return this.refusalReason; }

  getStats(): OracleSignerStats {
    return {
      stocks: {
        enabled: this.buffer !== null,
        updateCount: this.stocksUpdateCount,
        bufferedSymbols: this.buffer?.symbolCount ?? 0,
      },
      crypto: {
        enabled: this.cryptoBuffer !== null,
        updateCount: this.cryptoUpdateCount,
        bufferedSymbols: this.cryptoBuffer?.symbolCount ?? 0,
      },
    };
  }

  /** Exposed for testing. Returns the stocks-rail buffer; throws when disabled is intentional. */
  getBuffer(): QuoteBuffer {
    if (!this.buffer) throw new Error('stocks rail disabled');
    return this.buffer;
  }

  /** Exposed for testing. Returns the stocks-rail submitter; throws when disabled. */
  getSubmitter(): OracleSubmitter {
    if (!this.submitter) throw new Error('stocks rail disabled');
    return this.submitter;
  }

  getCryptoBuffer(): CryptoQuoteBuffer | null { return this.cryptoBuffer; }
  getCryptoSubmitter(): CryptoOracleSubmitter | null { return this.cryptoSubmitter; }
}

function loadConfig(): OracleSignerConfig {
  const signerKey = process.env.ORACLE_SIGNER_KEY;
  if (!signerKey) {
    throw new Error('ORACLE_SIGNER_KEY env var required');
  }

  const cryptoSymbols = (process.env.ORACLE_CRYPTO_SYMBOLS || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  return {
    priceServiceUrl: process.env.PRICE_SERVICE_URL || 'ws://localhost:4001',
    rpcUrl: process.env.L2_RPC_URL || process.env.RPC || 'http://localhost:8545',
    oracleAddress: process.env.STOCK_ORACLE_V2_ADDRESS || '',
    signerKey,
    updateIntervalMs: parseInt(process.env.ORACLE_UPDATE_INTERVAL || '5000', 10),
    minDeviationBps: parseInt(process.env.ORACLE_MIN_DEVIATION || '10', 10),
    txTimeoutMs: parseInt(process.env.ORACLE_TX_TIMEOUT || '60000', 10),
    symbols: (process.env.ORACLE_SYMBOLS || 'AAPL,TSLA,NVDA,MSFT,META,AMZN,GOOGL,SPY,QQQ,NFLX')
      .split(',').map(s => s.trim()).filter(Boolean),
    allowedChainIds: Array.from(parseAllowedChainIds(process.env.ORACLE_SIGNER_ALLOWED_CHAIN_IDS)),
    swapPriceOracleAddress: process.env.SWAP_PRICE_ORACLE_ADDRESS || '',
    cryptoSymbolMap: process.env.CRYPTO_SYMBOL_MAP || '',
    cryptoUpdateIntervalMs: process.env.ORACLE_CRYPTO_UPDATE_INTERVAL
      ? parseInt(process.env.ORACLE_CRYPTO_UPDATE_INTERVAL, 10)
      : undefined,
    cryptoMinDeviationBps: process.env.ORACLE_CRYPTO_MIN_DEVIATION
      ? parseInt(process.env.ORACLE_CRYPTO_MIN_DEVIATION, 10)
      : undefined,
    cryptoSymbols: cryptoSymbols.length ? cryptoSymbols : undefined,
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
