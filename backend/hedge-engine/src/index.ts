import { ethers } from 'ethers';
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

  if (!config.riskEngineAddress) {
    console.error('[HedgeEngine] RISK_ENGINE_ADDRESS is required. Exiting.');
    process.exit(1);
  }

  const reader = new ExposureReader(config.rpcUrl, config.riskEngineAddress);
  const calculator = new DeltaCalculator(config);
  const instrumentMap = loadInstrumentMap();
  const adapter = createPlaceholderAdapter();
  const executor = new HedgeExecutor(adapter, instrumentMap, config.dryRun);

  const engine = new HedgeEngine(reader, calculator, executor, config);

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const healthServer = startHealthServer({
    name: 'hedge-engine',
    port: parseInt(process.env.HEALTH_PORT ?? process.env.HEDGE_ENGINE_PORT ?? '9106', 10),
    chainCheck: async () => Number(await provider.getBlockNumber()),
  });

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
