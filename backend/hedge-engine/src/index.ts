import { ethers } from 'ethers';
import { ExposureReader } from './exposure-reader';
import { DeltaCalculator } from './delta-calculator';
import { HedgeExecutor, EtoroAdapter } from './hedge-executor';
import { HedgeEngine } from './engine';
import { DEFAULT_LANE_SYMBOLS, EtoroClient, EtoroMode, INSTRUMENT_MAP } from '@goodchain/etoro-client';
import { HedgeEngineConfig, StockSymbol } from './types';
import { selectAdapter } from './select-adapter';
import { startHealthServer } from './healthServer';

export { ExposureReader } from './exposure-reader';
export { DeltaCalculator } from './delta-calculator';
export { HedgeExecutor, HEDGE_REAL_TRADING_ENABLED } from './hedge-executor';
export type { EtoroAdapter, HedgeExecutorOptions, SafetyMode } from './hedge-executor';
export { HedgeEngine } from './engine';
export { HedgeProofRecorder, newProofRunId } from './hedge-proof';
export type { HedgeProof, ExposureSnapshot } from './hedge-proof';
export { createEtoroAdapter } from './etoro-adapter';
export type { EtoroClientLike, CreateEtoroAdapterOpts } from './etoro-adapter';
export type * from './types';

function getEnvOrDefault(env: NodeJS.ProcessEnv, key: string, fallback: string): string {
  return env[key] ?? fallback;
}

export interface HedgeRuntimeConfig extends HedgeEngineConfig {
  /** Canonical lane-1 eToro mode. */
  mode: EtoroMode;
  /** True only for ETORO_MODE=demo-trading with explicit HEDGE_TRADING_ENABLED=true. */
  tradingEnabled: boolean;
}

const KNOWN_MODES: readonly EtoroMode[] = ['mock', 'demo-readonly', 'demo-trading', 'real-disabled'];

function resolveEtoroMode(raw: string | undefined): EtoroMode {
  if (!raw) return 'mock';
  if ((KNOWN_MODES as readonly string[]).includes(raw)) return raw as EtoroMode;
  return 'mock';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): HedgeRuntimeConfig {
  const mode = resolveEtoroMode(env.ETORO_MODE);
  const symbolsRaw = env.HEDGE_SYMBOLS;
  const requestedSymbols = symbolsRaw
    ? symbolsRaw.split(',').map((sym) => sym.trim()).filter(Boolean)
    : [...DEFAULT_LANE_SYMBOLS];
  const symbols = requestedSymbols.filter((sym): sym is StockSymbol => sym in INSTRUMENT_MAP);
  const unknownSymbols = requestedSymbols.filter((sym) => !(sym in INSTRUMENT_MAP));
  if (unknownSymbols.length > 0) {
    env.SERVICE_HEALTH_STATUS = 'degraded';
    env.SERVICE_DISABLED_REASON = `Unknown symbols: ${unknownSymbols.join(',')}`;
  }

  return {
    rpcUrl: getEnvOrDefault(env, 'RPC_URL', 'http://localhost:8545'),
    riskEngineAddress: getEnvOrDefault(env, 'RISK_ENGINE_ADDRESS', ''),
    symbols,
    deltaThresholdUsd: Number(getEnvOrDefault(env, 'HEDGE_DELTA_THRESHOLD_USD', '5000')),
    deltaThresholdPct: Number(getEnvOrDefault(env, 'HEDGE_DELTA_THRESHOLD_PCT', '2')),
    pollIntervalMs: Number(getEnvOrDefault(env, 'HEDGE_POLL_INTERVAL_MS', '30000')),
    dryRun: getEnvOrDefault(env, 'HEDGE_DRY_RUN', 'true') === 'true',
    mode,
    tradingEnabled: mode === 'demo-trading' && env.HEDGE_TRADING_ENABLED === 'true',
  };
}

/** Instrument ID map — in production would come from etoro-client.marketData */
function loadInstrumentMap(env: NodeJS.ProcessEnv = process.env): Map<StockSymbol, string> {
  const map = new Map<StockSymbol, string>();
  for (const [sym, meta] of Object.entries(INSTRUMENT_MAP)) {
    map.set(sym, meta.etoroInstrumentId);
  }
  const raw = getEnvOrDefault(env, 'HEDGE_INSTRUMENT_MAP', '');
  if (raw) {
    for (const pair of raw.split(',')) {
      const [sym, id] = pair.split(':');
      if (sym && id && sym in INSTRUMENT_MAP) map.set(sym.trim(), id.trim());
    }
  }
  return map;
}

/**
 * Placeholder adapter — kept ONLY as a fallback for tests and for boots
 * where no eToro credentials are configured. Production calls
 * `createEtoroAdapter(client)` (see `etoro-adapter.ts`) when sandbox keys
 * are present in env.
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

/**
 * Try to build a real eToro adapter from env. Returns null if credentials
 * are missing OR if the etoro-client module cannot be resolved.
 */
function createAdapterFromEnv(): EtoroAdapter | null {
  if (!process.env.ETORO_SANDBOX_KEY || !process.env.ETORO_SANDBOX_SECRET) {
    return null;
  }
  try {
    // Relative require keeps hedge-engine independent of npm workspace wiring.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const etoro = require('../../etoro-client/src') as {
      EtoroClient: new (config?: unknown) => import('./etoro-adapter').EtoroClientLike;
      assertDemoModeOrThrow?: (mode: string) => void;
    };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createEtoroAdapter } = require('./etoro-adapter') as typeof import('./etoro-adapter');
    const client = new etoro.EtoroClient();
    return createEtoroAdapter(client, { assertDemoMode: etoro.assertDemoModeOrThrow });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[HedgeEngine] real eToro adapter unavailable, using placeholder: ${msg}`);
    return null;
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
    process.env.SERVICE_HEALTH_STATUS = 'health-only';
    process.env.SERVICE_HEALTH_MODE = 'disabled';
    process.env.SERVICE_DISABLED_REASON = 'RISK_ENGINE_ADDRESS is not set; hedge loop disabled';
    console.warn('[HedgeEngine] RISK_ENGINE_ADDRESS is not set — engine loop disabled, health server running on port', process.env.HEDGE_ENGINE_PORT ?? '9106');
    // Return without exiting: the http.Server above keeps the event loop alive
    // so PM2 does not restart-loop and the health port stays bound.
    return;
  }

  const reader = new ExposureReader(config.rpcUrl, config.riskEngineAddress);
  const calculator = new DeltaCalculator(config);
  const instrumentMap = loadInstrumentMap();
  const selection = selectAdapter({
    mode: config.mode,
    tradingEnabled: config.tradingEnabled,
    clientFactory: () => new EtoroClient(),
  });
  if (selection.readOnly) {
    process.env.SERVICE_HEALTH_STATUS = 'degraded';
    process.env.SERVICE_DISABLED_REASON = selection.reason;
  }
  const executor = new HedgeExecutor(selection.adapter, instrumentMap, {
    dryRun: config.dryRun || selection.readOnly,
    safetyMode: config.mode === 'real-disabled' ? 'real' : 'sandbox',
  });

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
