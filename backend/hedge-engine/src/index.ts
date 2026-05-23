import { ethers } from 'ethers';
import {
  DEFAULT_LANE_SYMBOLS,
  INSTRUMENT_SYMBOLS,
  partitionLaneSymbols,
} from '@goodchain/etoro-client';
import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor, EtoroAdapter } from './hedge-executor';
import { HedgeEngine } from './engine';
import { HedgeEngineConfig, StockSymbol } from './types';
import { startHealthServer } from './healthServer';

export { ExposureReader } from './exposure-reader';
export { DeltaCalculator } from './delta-calculator';
export { HedgeExecutor } from './hedge-executor';
export type { EtoroAdapter } from './hedge-executor';
export { HedgeEngine } from './engine';
export type * from './types';

function getEnvOrDefault(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

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
  return {
    rpcUrl: env.RPC_URL ?? 'http://localhost:8545',
    riskEngineAddress: env.RISK_ENGINE_ADDRESS ?? '',
    symbols,
    deltaThresholdUsd: Number(env.HEDGE_DELTA_THRESHOLD_USD ?? '5000'),
    deltaThresholdPct: Number(env.HEDGE_DELTA_THRESHOLD_PCT ?? '2'),
    pollIntervalMs: Number(env.HEDGE_POLL_INTERVAL_MS ?? '30000'),
    dryRun: (env.HEDGE_DRY_RUN ?? 'true') === 'true',
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
 * Placeholder adapter — real adapter wires into EtoroClient from etoro-client.
 * In production this file would import { createEtoroClient } and wrap it.
 */
function createPlaceholderAdapter(): EtoroAdapter {
  return {
    async openPosition(params) {
      console.log(`[PlaceholderAdapter] openPosition: ${JSON.stringify(params)}`);
      return { orderId: `sim-${Date.now()}`, status: 'filled' };
    },
    async closePosition(positionId) {
      console.log(`[PlaceholderAdapter] closePosition: ${positionId}`);
      return { orderId: `sim-close-${Date.now()}` };
    },
    async getPositions() {
      return [];
    },
  };
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

  const reader = new ExposureReader(config.rpcUrl, config.riskEngineAddress);
  const calculator = new DeltaCalculator(config);
  const instrumentMap = loadInstrumentMap();
  const adapter = createPlaceholderAdapter();
  const executor = new HedgeExecutor(adapter, instrumentMap, config.dryRun);

  const engine = new HedgeEngine(reader, calculator, executor, config);

  const shutdown = () => {
    console.log('[HedgeEngine] Shutting down...');
    engine.stop();
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
