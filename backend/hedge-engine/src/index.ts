import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor, EtoroAdapter } from './hedge-executor';
import { HedgeEngine } from './engine';
import { CapEnforcer } from './cap-enforcer';
import { KillSwitchProbe } from './kill-switch';
import { CircuitBreakers } from './circuit-breakers';
import { ReceiptStore } from './receipt-store';
import { ProofWriter } from './proof-writer';
import { EtoroClientAdapter, EtoroClientLike } from './etoro-adapter';
import { InstrumentResolver, MarketDataLike } from './instrument-resolver';
import { startHedgeStatusServer, ProofPointer } from './hedgeStatusServer';
import { HedgeEngineConfig, StockSymbol } from './types';
import { startHealthServer } from './healthServer';
import {
  assertTradeFence,
  RealTradingFenceError,
  REAL_TRADING_ENABLED,
} from './safety';

export { ExposureReader } from './exposure-reader';
export { DeltaCalculator } from './delta-calculator';
export { HedgeExecutor } from './hedge-executor';
export type { EtoroAdapter } from './hedge-executor';
export { HedgeEngine } from './engine';
export { CapEnforcer } from './cap-enforcer';
export type { CapEnforcerConfig, CapDecision, CapSnapshot } from './cap-enforcer';
export { KillSwitchProbe } from './kill-switch';
export { CircuitBreakers } from './circuit-breakers';
export type { BreakerState, BreakerReason } from './circuit-breakers';
export { ReceiptStore } from './receipt-store';
export type { HedgeReceipt } from './receipt-store';
export { ProofWriter, formatProofMarkdown } from './proof-writer';
export type { ProofWriterInput } from './proof-writer';
export { startHedgeStatusServer } from './hedgeStatusServer';
export type { HedgeStatusProvider, ProofPointer } from './hedgeStatusServer';
export { EtoroClientAdapter } from './etoro-adapter';
export { InstrumentResolver } from './instrument-resolver';
export {
  REAL_TRADING_ENABLED,
  RealTradingFenceError,
  assertTradeFence,
} from './safety';
export type * from './types';

function getEnvOrDefault(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function resolveEtoroMode(raw: string): 'sandbox' | 'real' | 'demo' {
  const value = raw.toLowerCase().trim();
  if (value === 'real') return 'real';
  if (value === 'demo') return 'demo';
  return 'sandbox';
}

function loadConfig(): HedgeEngineConfig {
  const symbolsRaw = getEnvOrDefault('HEDGE_SYMBOLS', 'AAPL,TSLA,NVDA,MSFT,META,AMZN,GOOGL,SPY,QQQ');
  return {
    rpcUrl: getEnvOrDefault('RPC_URL', 'http://localhost:8545'),
    riskEngineAddress: getEnvOrDefault('RISK_ENGINE_ADDRESS', ''),
    symbols: symbolsRaw.split(',').map((s) => s.trim()).filter(Boolean),
    deltaThresholdUsd: Number(getEnvOrDefault('HEDGE_DELTA_THRESHOLD_USD', '5000')),
    deltaThresholdPct: Number(getEnvOrDefault('HEDGE_DELTA_THRESHOLD_PCT', '2')),
    pollIntervalMs: Number(getEnvOrDefault('HEDGE_POLL_INTERVAL_MS', '30000')),
    dryRun: getEnvOrDefault('HEDGE_DRY_RUN', 'true') === 'true',
    etoroMode: resolveEtoroMode(getEnvOrDefault('ETORO_MODE', 'demo')),
  };
}

/** Instrument ID map — in production would come from etoro-client.marketData */
function loadInstrumentMap(): Map<StockSymbol, string> {
  const raw = getEnvOrDefault('HEDGE_INSTRUMENT_MAP', '');
  const map = new Map<StockSymbol, string>();
  if (raw) {
    for (const pair of raw.split(',')) {
      const [sym, id] = pair.split(':');
      if (sym && id) map.set(sym.trim(), id.trim());
    }
  }
  return map;
}

/**
 * Dry-run-only adapter. The real adapter wires into `@goodchain/etoro-client`
 * via `EtoroClientAdapter.create()` below. We only fall back to this no-op
 * shape when `HEDGE_DRY_RUN=true` — in that path the executor short-circuits
 * before any adapter call, so the body never runs.
 */
function createDryRunOnlyAdapter(): EtoroAdapter {
  return {
    async openPosition(params) {
      console.log(`[DryRunAdapter] openPosition: ${JSON.stringify(params)}`);
      return { orderId: `sim-${Date.now()}`, status: 'filled' };
    },
    async closePosition(positionId) {
      console.log(`[DryRunAdapter] closePosition: ${positionId}`);
      return { orderId: `sim-close-${Date.now()}` };
    },
    async getPositions() {
      return [];
    },
  };
}

interface CapEnvConfig {
  maxOrderNotionalUsd: number;
  maxDailyNotionalUsd: number;
  maxOrdersPerCycle: number;
  maxOrdersPerDay: number;
}

/** Caps are clamped to the spec's hard ceilings ($100 / $300) for safety. */
function loadCapConfig(): CapEnvConfig {
  const orderCap = Math.min(
    100,
    Number(getEnvOrDefault('MAX_DEMO_ORDER_NOTIONAL_USD', '100')),
  );
  const dailyCap = Math.min(
    300,
    Number(getEnvOrDefault('MAX_DAILY_DEMO_NOTIONAL_USD', '300')),
  );
  return {
    maxOrderNotionalUsd: orderCap,
    maxDailyNotionalUsd: dailyCap,
    maxOrdersPerCycle: Number(getEnvOrDefault('HEDGE_MAX_ORDERS_PER_CYCLE', '3')),
    maxOrdersPerDay: Number(getEnvOrDefault('HEDGE_MAX_ORDERS_PER_DAY', '10')),
  };
}

async function createLiveAdapterOrFallback(): Promise<{
  adapter: EtoroAdapter;
  marketData: MarketDataLike | null;
}> {
  try {
    const live = await EtoroClientAdapter.create();
    // The live client also exposes marketData; we can lift it for the resolver.
    const client = (live as unknown as { client?: EtoroClientLike }).client;
    const marketData = (client as unknown as { marketData?: MarketDataLike })?.marketData ?? null;
    return { adapter: live, marketData };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[HedgeEngine] eToro client unavailable (${msg}); using dry-run adapter.`);
    return { adapter: createDryRunOnlyAdapter(), marketData: null };
  }
}

async function main(): Promise<void> {
  const config = loadConfig();

  // Start health server FIRST so the process is always reachable on its health
  // port — even if the engine cannot start due to missing config. PM2 will not
  // restart-loop the process, and the status-aggregator will see "ok" (or 503
  // if the RPC is also down) instead of "unreachable".
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const healthServer = startHealthServer({
    name: 'hedge-engine',
    port: parseInt(process.env.HEALTH_PORT ?? process.env.HEDGE_ENGINE_PORT ?? '9106', 10),
    chainCheck: async () => Number(await provider.getBlockNumber()),
  });

  if (!config.riskEngineAddress) {
    process.env.SERVICE_HEALTH_STATUS = 'degraded';
    process.env.SERVICE_DISABLED_REASON = 'RISK_ENGINE_ADDRESS is not set; hedge loop disabled';
    console.warn('[HedgeEngine] RISK_ENGINE_ADDRESS is not set — engine loop disabled, health server running on port', process.env.HEDGE_ENGINE_PORT ?? '9106');
    // Return without exiting: the http.Server above keeps the event loop alive
    // so PM2 does not restart-loop and the health port stays bound.
    return;
  }

  // Hard fence: refuse to construct a non-dry-run executor unless ETORO_MODE
  // is exactly 'demo' AND REAL_TRADING_ENABLED is the compile-time false.
  // Mirrors the spec's "no real account trading path enabled" constraint.
  try {
    assertTradeFence({ mode: config.etoroMode, dryRun: config.dryRun });
  } catch (err) {
    const reason = err instanceof RealTradingFenceError ? err.message : 'trade fence tripped';
    process.env.SERVICE_HEALTH_STATUS = 'degraded';
    process.env.SERVICE_DISABLED_REASON = reason;
    console.warn(`[HedgeEngine] ${reason} — engine loop disabled, health server running.`);
    return;
  }

  const reader = new ExposureReader(config.rpcUrl, config.riskEngineAddress);
  const calculator = new DeltaCalculator(config);
  const instrumentMap = loadInstrumentMap();

  // Dry-run path never opens orders, so we keep a cheap no-op adapter.
  // Non-dry-run path requires a real eToro client; if that import fails
  // we degrade to dry-run-only rather than crash.
  let adapter: EtoroAdapter;
  let marketData: MarketDataLike | null = null;
  if (config.dryRun) {
    adapter = createDryRunOnlyAdapter();
  } else {
    const live = await createLiveAdapterOrFallback();
    adapter = live.adapter;
    marketData = live.marketData;
  }

  const resolver = new InstrumentResolver(instrumentMap, marketData);

  const killSwitch = new KillSwitchProbe(process.env.HEDGE_KILL_SWITCH_FILE);
  const capEnforcer = new CapEnforcer(loadCapConfig());
  const breakers = new CircuitBreakers({
    maxExposureAgeMs: Number(getEnvOrDefault('MAX_EXPOSURE_AGE_MS', '15000')),
    maxRpcLagMs: Number(getEnvOrDefault('MAX_RPC_LAG_MS', '60000')),
    explorerBlockUrl: process.env.CHAIN_EXPLORER_BLOCK_URL || undefined,
    maxChainBlockLag: Number(getEnvOrDefault('MAX_CHAIN_BLOCK_LAG', '10')),
  });

  const receiptStore = new ReceiptStore(process.env.HEDGE_RECEIPT_FILE);
  await receiptStore.recoverIfCorrupt();

  const executor = new HedgeExecutor(adapter, instrumentMap, config.dryRun, {
    killSwitch,
    resolver,
  });

  const proofWriter = new ProofWriter(process.env.HEDGE_PROOF_DIR);

  const engine = new HedgeEngine(
    reader,
    calculator,
    executor,
    config,
    {
      capEnforcer,
      killSwitch,
      circuitBreakers: breakers,
      receiptStore,
      proofWriter,
      blockNumberFn: async () => Number(await provider.getBlockNumber()),
    },
  );

  // Hedge-specific HTTP surface on its own port. The canonical
  // healthServer above stays unchanged.
  const statusServer = startHedgeStatusServer({
    port: parseInt(process.env.HEDGE_STATUS_PORT ?? '9116', 10),
    provider: {
      getLastSnapshot: () => engine.getLastSnapshot(),
      getCapSnapshot: () => engine.getCapSnapshot(),
      getBreakerState: () => engine.getBreakerState(),
      isKillSwitchEngaged: () => engine.isKillSwitchEngaged(),
      readReceipts: (limit: number) => receiptStore.readNewestFirst(limit),
      readLatestProof: async (): Promise<ProofPointer | null> => proofWriter.readLatestPointer(),
    },
  });

  const shutdown = () => {
    console.log('[HedgeEngine] Shutting down...');
    engine.stop();
    statusServer.close();
    healthServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  engine.start();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[HedgeEngine] Fatal:', err);
    process.exit(1);
  });
}
