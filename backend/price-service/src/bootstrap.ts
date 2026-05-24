import {
  EtoroClient,
  INSTRUMENT_SYMBOLS,
  InvalidModeError,
  partitionLaneSymbols,
  resolveMode,
  resolveModeSource,
} from '@goodchain/etoro-client';
import { connectEtoroSource } from './etoro-source';
import type { EtoroSourceHandle, MarketDataSource } from './etoro-source';
import type { PriceService } from './index';

/**
 * Dependency seam for `bootstrapEtoroSource`. Tests inject stub
 * `resolveMode` / `createClient` to exercise the degraded-init paths
 * without touching real env or constructing a real SDK client.
 */
export interface BootstrapDeps {
  env: NodeJS.ProcessEnv;
  resolveMode: typeof resolveMode;
  resolveModeSource: typeof resolveModeSource;
  createClient: () => { marketData: MarketDataSource };
}

export interface BootstrapResult {
  ok: boolean;
  handle?: EtoroSourceHandle;
  reason?: string;
}

export function defaultBootstrapDeps(): BootstrapDeps {
  return {
    env: process.env,
    resolveMode,
    resolveModeSource,
    createClient: () => new EtoroClient(),
  };
}

/**
 * Wires an `EtoroClient` to a `PriceService` instance with explicit
 * mode resolution and degraded-state signalling.
 *
 * Safety contract:
 *   - `InvalidModeError` ALWAYS fails closed (marks degraded + rethrows)
 *     regardless of `PRICE_SERVICE_STRICT_MODE`. The operator typed
 *     something deliberate; silently running with no quotes is the
 *     worst outcome.
 *   - Any other init error (e.g. missing credentials) marks degraded.
 *     Rethrows only when `PRICE_SERVICE_STRICT_MODE === 'true'`; the
 *     default soft-fallback shape keeps the broadcaster alive so REST
 *     ingestion still works.
 *   - Unknown symbols mark degraded but never abort: the service
 *     continues with the valid subset.
 */
export function bootstrapEtoroSource(
  service: PriceService,
  deps: BootstrapDeps = defaultBootstrapDeps(),
): BootstrapResult {
  const mode = resolveModeOrDegrade(deps);
  const modeSource = deps.resolveModeSource(deps.env);
  console.log(
    `[price-service] eToro mode resolved: ${mode} (from ${modeSource})`,
  );

  const client = createClientOrDegrade(deps);
  if (!client.ok) return client;

  const { valid: symbols, unknown } = partitionRequestedSymbols(service, deps.env);
  if (unknown.length > 0) {
    console.error(
      `[price-service] Unknown symbols: ${unknown.join(', ')}. ` +
      `Valid: ${INSTRUMENT_SYMBOLS.join(', ')}`,
    );
    setDegraded(deps.env, `Unknown symbols: ${unknown.join(',')}`);
  }

  const handle = connectEtoroSource(service, {
    symbols,
    marketData: client.client.marketData,
  });
  console.log(
    `[price-service] Subscribed to ${symbols.length} symbols via eToro: ${symbols.join(', ')}`,
  );
  return { ok: true, handle };
}

function resolveModeOrDegrade(deps: BootstrapDeps): string {
  try {
    return deps.resolveMode(deps.env);
  } catch (err) {
    if (err instanceof InvalidModeError) {
      setDegraded(deps.env, `Invalid ETORO_MODE: ${err.message}`);
    }
    throw err;
  }
}

type ClientResult =
  | { ok: true; client: { marketData: MarketDataSource } }
  | { ok: false; reason: string };

function createClientOrDegrade(deps: BootstrapDeps): ClientResult {
  try {
    return { ok: true, client: deps.createClient() };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    setDegraded(deps.env, reason);
    if (deps.env.PRICE_SERVICE_STRICT_MODE === 'true') {
      throw err;
    }
    console.warn(`[price-service] eToro source unavailable: ${reason}`);
    console.warn(
      '[price-service] Running without live quotes — use REST API to ingest manually',
    );
    return { ok: false, reason };
  }
}

function partitionRequestedSymbols(
  service: PriceService,
  env: NodeJS.ProcessEnv,
): ReturnType<typeof partitionLaneSymbols> {
  const raw = (env.ORACLE_SYMBOLS ?? service.config.symbols.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return partitionLaneSymbols(raw);
}

function setDegraded(env: NodeJS.ProcessEnv, reason: string): void {
  env.SERVICE_HEALTH_STATUS = 'degraded';
  env.SERVICE_DISABLED_REASON = reason;
}
