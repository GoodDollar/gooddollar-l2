import { InvalidCapConfigError, InvalidModeError } from './errors';
import { DemoCapConfig, EtoroCredentials, EtoroMode } from './types';

/**
 * Source-level fence for real-money trading. Set to `false` and intentionally
 * NOT readable from environment.
 *
 * Any code path that would route an order to a real eToro account must check
 * this flag. The autobuilder's safety policy is that flipping this constant
 * requires a source change that goes through product review — environment
 * variables alone can never enable a real-trading path.
 */
export const REAL_TRADING_ENABLED = false;

/**
 * Official eToro public API base URL — the only HTTPS host the SDK is
 * allowed to address under the lane-1 contract. Demo and real-disabled
 * modes both speak here; trading paths are scoped to
 * `/trading/execution/demo/*`. Real-account base URLs are deliberately
 * not encoded anywhere in the SDK.
 *
 * Replaces the deprecated `api.etoro.com/sapi/demo` internal-wrapper
 * host (see lane task 0017).
 */
export const DEMO_BASE_URL_DEFAULT = 'https://public-api.etoro.com/api/v1';
export const DEMO_WS_URL_DEFAULT = 'wss://streamer.etoro.com/sapi/demo';

const ALL_MODES: readonly EtoroMode[] = [
  'mock',
  'demo-readonly',
  'demo-trading',
  'real-disabled',
] as const;

const MOCK_BASE_URL = 'mock://etoro.local';
const MOCK_WS_URL = 'mock://etoro.local/ws';

const MOCK_CREDS: EtoroCredentials = {
  apiKey: 'mock-api-key',
  apiSecret: 'mock-api-secret',
  userKey: 'mock-user-key',
  baseUrl: MOCK_BASE_URL,
  wsUrl: MOCK_WS_URL,
  mode: 'mock',
};

const DEFAULT_CAP_PER_ORDER_USD = 1_000;
const DEFAULT_CAP_DAILY_USD = 10_000;

export function resolveMode(
  env: Record<string, string | undefined> = process.env,
): EtoroMode {
  const rawOriginal = env.ETORO_MODE;
  const raw = rawOriginal?.toLowerCase().trim();
  if (!raw) return 'mock';
  const normalized = ALL_MODES.find((m) => m === raw);
  if (!normalized) {
    throw new InvalidModeError(rawOriginal ?? '', ALL_MODES);
  }
  return normalized;
}

/**
 * Reports whether the resolved mode came from `ETORO_MODE` being explicitly
 * set (any value, including invalid — though invalid throws before it gets
 * here) or from the unset → `mock` default path.
 */
export function resolveModeSource(
  env: Record<string, string | undefined> = process.env,
): 'env' | 'default' {
  const raw = env.ETORO_MODE?.toLowerCase().trim();
  return raw ? 'env' : 'default';
}

/**
 * Loads credentials for the resolved mode. Defaults to `mock` when
 * `ETORO_MODE` is unset, in which case deterministic in-process credentials
 * are returned and no environment keys are consulted.
 *
 * For `demo-readonly` and `demo-trading`, `ETORO_DEMO_KEY` and
 * `ETORO_DEMO_SECRET` are required. For `real-disabled`, the demo URLs are
 * still used (market-data only); credentials are required so we know the
 * caller intentionally chose this mode rather than falling through.
 *
 * Real-account credential env vars are not read by this function under any
 * mode — see `REAL_TRADING_ENABLED` for the source-level fence.
 */
export function loadCredentialsFromEnv(
  env: Record<string, string | undefined> = process.env,
  opts: { silent?: boolean } = {},
): EtoroCredentials {
  const mode = resolveMode(env);
  const source = resolveModeSource(env);

  if (mode === 'mock') {
    if (source === 'default' && !opts.silent) {
      console.warn(
        'ETORO_MODE not set; defaulting to mock. ' +
        'No live or demo eToro traffic will occur. ' +
        'Set ETORO_MODE to one of: mock, demo-readonly, demo-trading, real-disabled.',
      );
    }
    return { ...MOCK_CREDS };
  }

  const apiKey = env.ETORO_DEMO_KEY;
  const apiSecret = env.ETORO_DEMO_SECRET;
  const userKey = mode === 'real-disabled'
    ? env.ETORO_USER_KEY
    : env.ETORO_DEMO_USER_KEY;

  if (!apiKey || !apiSecret || !userKey) {
    const userKeyVar = mode === 'real-disabled'
      ? 'ETORO_USER_KEY'
      : 'ETORO_DEMO_USER_KEY';
    throw new Error(
      `Missing eToro demo credentials for mode "${mode}": ` +
      `ETORO_DEMO_KEY, ETORO_DEMO_SECRET, and ${userKeyVar} must be set. ` +
      `Use ETORO_MODE=mock to run without credentials.`,
    );
  }

  const baseUrl = env.ETORO_DEMO_BASE_URL ?? DEMO_BASE_URL_DEFAULT;
  const wsUrl = env.ETORO_DEMO_WS_URL ?? DEMO_WS_URL_DEFAULT;

  return { apiKey, apiSecret, userKey, baseUrl, wsUrl, mode };
}

/**
 * Reads the demo cap config from env with safe defaults. Negative or
 * non-numeric values fall back to the defaults; this is consulted at
 * client construction and per-order in `TradingModule`.
 */
export function loadDemoCapConfig(
  env: Record<string, string | undefined> = process.env,
): DemoCapConfig {
  const order = parseCapValue(
    env.MAX_DEMO_ORDER_NOTIONAL_USD,
    DEFAULT_CAP_PER_ORDER_USD,
    'maxOrder',
  );
  const daily = parseCapValue(
    env.MAX_DAILY_DEMO_NOTIONAL_USD,
    DEFAULT_CAP_DAILY_USD,
    'maxDaily',
  );
  return { maxOrderNotionalUsd: order, maxDailyNotionalUsd: daily };
}

export function redactCredentials(creds: EtoroCredentials): Record<string, string> {
  return {
    mode: creds.mode,
    baseUrl: creds.baseUrl,
    wsUrl: creds.wsUrl,
    apiKey: mask(creds.apiKey),
    apiSecret: mask(creds.apiSecret),
    userKey: mask(creds.userKey),
  };
}

/**
 * The four-mode safety matrix. Documenting it as code so tests and runtime
 * checks share one source of truth.
 */
export interface ModeCapabilities {
  marketData: 'mock' | 'demo' | 'disabled';
  trading: 'enabled' | 'disabled';
  requiresCredentials: boolean;
}

export const MODE_CAPABILITIES: Readonly<Record<EtoroMode, ModeCapabilities>> = {
  mock: { marketData: 'mock', trading: 'disabled', requiresCredentials: false },
  'demo-readonly': { marketData: 'demo', trading: 'disabled', requiresCredentials: true },
  'demo-trading': { marketData: 'demo', trading: 'enabled', requiresCredentials: true },
  'real-disabled': { marketData: 'demo', trading: 'disabled', requiresCredentials: true },
} as const;

function parsePositiveNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

/**
 * Strict parser for the demo notional caps:
 *   - unset / empty string         → fallback (default cap)
 *   - finite number ≥ 0            → the parsed number (0 means "no orders")
 *   - negative or non-numeric      → throw `InvalidCapConfigError`
 *
 * The `0`-is-valid carve-out is intentional: operators sometimes want to
 * configure "block all trading from this process" without removing the
 * enforcer entirely. The `DemoCapEnforcer` already returns a per-order
 * error for any positive notional when `maxOrderNotionalUsd === 0`, so the
 * semantics flow through end-to-end.
 */
function parseCapValue(
  raw: string | undefined,
  fallback: number,
  field: 'maxOrder' | 'maxDaily',
): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new InvalidCapConfigError({
      field,
      rawValue: raw,
      reason: 'value is not a finite number',
    });
  }
  if (n < 0) {
    throw new InvalidCapConfigError({
      field,
      rawValue: raw,
      reason: 'value is negative',
    });
  }
  return n;
}

function mask(value: string): string {
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}
