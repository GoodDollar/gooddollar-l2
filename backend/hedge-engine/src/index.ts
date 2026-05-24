import { ethers } from 'ethers';
import {
  createEtoroClient,
  DEFAULT_LANE_SYMBOLS,
  EtoroMode,
  INSTRUMENT_SYMBOLS,
  partitionLaneSymbols,
  resolveMode,
} from '@goodchain/etoro-client';
import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor } from './hedge-executor';
import { HedgeEngine } from './engine';
import { HedgeEngineConfig, StockSymbol } from './types';
import { startHealthServer } from './healthServer';
import { selectAdapter } from './select-adapter';

export { ExposureReader } from './exposure-reader';
export { DeltaCalculator } from './delta-calculator';
export { HedgeExecutor } from './hedge-executor';
export type { EtoroAdapter } from './hedge-executor';
export { HedgeEngine } from './engine';
export { createMockAdapter } from './mock-adapter';
export type { MockAdapter } from './mock-adapter';
export {
  createEtoroBackedAdapter,
  createReadOnlyAdapter,
  ReadOnlyAdapterError,
} from './etoro-adapter';
export { selectAdapter } from './select-adapter';
export type {
  AdapterSelection,
  EtoroClientFactory,
  SelectAdapterInput,
} from './select-adapter';
export type * from './types';

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): HedgeEngineConfig {
  const rawSymbols = (env.HEDGE_SYMBOLS ?? DEFAULT_LANE_SYMBOLS.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const { valid: symbols, unknown } = partitionLaneSymbols(rawSymbols);
  if (unknown.length > 0) {
    console.error(
      `[hedge-engine] Unknown symbols: ${unknown.join(', ')}. ` +
      `Valid: ${INSTRUMENT_SYMBOLS.join(', ')}`,
    );
    env.SERVICE_HEALTH_STATUS = 'degraded';
    env.SERVICE_DISABLED_REASON = `Unknown symbols: ${unknown.join(',')}`;
  }
  const mode = resolveMode(env);
  const tradingEnabled = mode === 'demo-trading'
    && env.HEDGE_TRADING_ENABLED === 'true';
  return {
    rpcUrl: env.RPC_URL ?? 'http://localhost:8545',
    riskEngineAddress: env.RISK_ENGINE_ADDRESS ?? '',
    symbols,
    deltaThresholdUsd: Number(env.HEDGE_DELTA_THRESHOLD_USD ?? '5000'),
    deltaThresholdPct: Number(env.HEDGE_DELTA_THRESHOLD_PCT ?? '2'),
    pollIntervalMs: Number(env.HEDGE_POLL_INTERVAL_MS ?? '30000'),
    dryRun: (env.HEDGE_DRY_RUN ?? 'true') === 'true',
    mode,
    tradingEnabled,
  };
}

/**
 * Operator-pinned `symbol → instrumentId` map. Stays as an override hook
 * so an operator can patch a single mis-resolved ID via
 * `HEDGE_INSTRUMENT_MAP=AAPL:INST-1001,BTC:INST-100100` without redeploying.
 * The primary source is `EtoroClient.marketData` resolution at startup; a
 * follow-up wires that path once 0017's `InstrumentResolver` is exercised
 * end-to-end here.
 */
function loadInstrumentMap(env: NodeJS.ProcessEnv): Map<StockSymbol, string> {
  const raw = env.HEDGE_INSTRUMENT_MAP ?? '';
  const map = new Map<StockSymbol, string>();
  if (raw) {
    for (const pair of raw.split(',')) {
      const [sym, id] = pair.split(':');
      if (sym && id) map.set(sym.trim(), id.trim());
    }
  }
  return map;
}

function setDegraded(env: NodeJS.ProcessEnv, reason: string): void {
  env.SERVICE_HEALTH_STATUS = 'degraded';
  env.SERVICE_DISABLED_REASON = reason;
}

async function main(): Promise<void> {
  const config = loadConfig();

  // Start health server FIRST so the process is always reachable on its
  // health port — even if the engine cannot start due to missing config.
  // PM2 will not restart-loop the process, and the status-aggregator
  // will see "ok" instead of "unreachable".
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const healthServer = startHealthServer({
    name: 'hedge-engine',
    port: parseInt(process.env.HEALTH_PORT ?? process.env.HEDGE_ENGINE_PORT ?? '9106', 10),
    chainCheck: async () => Number(await provider.getBlockNumber()),
  });

  if (!config.riskEngineAddress) {
    setDegraded(process.env, 'RISK_ENGINE_ADDRESS is not set; hedge loop disabled');
    console.warn('[HedgeEngine] RISK_ENGINE_ADDRESS is not set — engine loop disabled, health server running on port', process.env.HEDGE_ENGINE_PORT ?? '9106');
    // Return without exiting: the http.Server above keeps the event loop
    // alive so PM2 does not restart-loop and the health port stays bound.
    return;
  }

  const selection = selectAdapter({
    mode: config.mode,
    tradingEnabled: config.tradingEnabled,
    clientFactory: () => createEtoroClient(),
  });

  if (selection.readOnly && selection.reason) {
    setDegraded(process.env, selection.reason);
    console.warn(`[HedgeEngine] ${selection.reason} — running in read-only mode`);
  }

  const reader = new ExposureReader(config.rpcUrl, config.riskEngineAddress);
  const calculator = new DeltaCalculator(config);
  const instrumentMap = loadInstrumentMap(process.env);
  const executor = new HedgeExecutor(selection.adapter, instrumentMap, config.dryRun);

  const engine = new HedgeEngine(reader, calculator, executor, config);

  const shutdown = () => {
    console.log('[HedgeEngine] Shutting down...');
    engine.stop();
    healthServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  if (selection.readOnly) {
    // Read-only path: keep the health server bound and the exposure
    // reader available for the status surface, but never invoke the
    // executor loop. Future task can plumb a one-shot reconcile-and-
    // report cycle here.
    console.log(`[HedgeEngine] read-only mode (${selection.reason ?? 'no reason given'}); executor loop disabled.`);
    return;
  }

  engine.start();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[HedgeEngine] Fatal:', err);
    process.exit(1);
  });
}
