import { SourceStatus } from './types';
import { isoFromMs } from './iso';

/**
 * Operator-readable runtime block surfaced on `GET /` and `GET /health`
 * so an integrator (frontend, oracle-signer, ops dashboard) can confirm
 * demo/read-only safety from the public surface alone — without parsing
 * logs or reading the deploy config (task 0055).
 *
 * Field semantics:
 *   - `etoroMode`            literal `ETORO_MODE` env value, default `'sandbox'`
 *   - `realTradingEnabled`   `process.env.REAL_TRADING_ENABLED === 'true'`;
 *                            on this service the boot fence in `index.ts`
 *                            refuses to start when the env var is `'true'`,
 *                            so the wire value is contractually `false`.
 *   - `network`              `PRICE_SERVICE_NETWORK` env value, default `'testnet'`
 *   - `fixtureOnly`          `true` when the upstream eToro source has not
 *                            attached (the only field that flips per request)
 *   - `configuredAtMs` /
 *     `configuredAtIso`      boot epoch when the runtime block was assembled
 */
export interface RuntimeBlock {
  etoroMode: string;
  realTradingEnabled: boolean;
  network: string;
  fixtureOnly: boolean;
  configuredAtMs: number;
  configuredAtIso: string;
}

const DEFAULT_ETORO_MODE = 'sandbox';
const DEFAULT_NETWORK = 'testnet';

/**
 * Resolve the per-boot runtime block from `process.env`. The boot
 * epoch is captured at the call site (typically `PriceService` ctor)
 * and passed in so the value pins to the construction moment, not the
 * read moment. `fixtureOnly` derives from the live source status:
 * the source has not attached when `connected: false` AND the reason
 * is anything other than `'not-attached'` (the booting-but-no-attempt
 * branch is distinct from permanent-fixture mode).
 */
export function resolveRuntime(
  configuredAtMs: number,
  sourceStatus: SourceStatus,
): RuntimeBlock {
  const env = process.env;
  return {
    etoroMode: env.ETORO_MODE ?? DEFAULT_ETORO_MODE,
    realTradingEnabled: env.REAL_TRADING_ENABLED === 'true',
    network: env.PRICE_SERVICE_NETWORK ?? DEFAULT_NETWORK,
    fixtureOnly: !sourceStatus.connected,
    configuredAtMs,
    configuredAtIso: isoFromMs(configuredAtMs)!,
  };
}

/**
 * Defence-in-depth boot fence (task 0055). Returns a fatal-line
 * payload (or `null` when safe) so callers in `index.ts` decide
 * whether to emit it on stderr and exit. Distinct exit code (78,
 * "configuration error" per BSD `sysexits.h`) lets supervisors
 * (systemd, k8s, the autobuilder loop) recognise a config-rejection
 * vs a generic crash without parsing logs.
 *
 * The price-service is read-only by design and never branches on
 * `REAL_TRADING_ENABLED`; the fence exists so a misconfigured deploy
 * that flipped the env var ANYWHERE in the chain refuses to start
 * here, producing a loud, recognisable failure rather than a silent
 * "running" service that an operator could mistake for the live
 * trading path.
 */
export const REAL_TRADING_FENCE_MESSAGE =
  '[price-service] FATAL: REAL_TRADING_ENABLED=true is rejected by the autobuilder safety fence';
export const REAL_TRADING_FENCE_EXIT_CODE = 78;

export function checkRealTradingFence(env: NodeJS.ProcessEnv = process.env): {
  fatal: true;
  message: string;
  exitCode: number;
} | null {
  if (env.REAL_TRADING_ENABLED === 'true') {
    return {
      fatal: true,
      message: REAL_TRADING_FENCE_MESSAGE,
      exitCode: REAL_TRADING_FENCE_EXIT_CODE,
    };
  }
  return null;
}
