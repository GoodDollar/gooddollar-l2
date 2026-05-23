import { ethers } from 'ethers';
import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor, EtoroAdapter } from './hedge-executor';
import { HedgeEngine } from './engine';
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
