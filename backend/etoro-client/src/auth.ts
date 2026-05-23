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
 * eToro demo base endpoints. These are the only URLs the SDK is allowed to
 * speak to under the lane-1 contract. Real-account base URLs are deliberately
 * not encoded here.
 */
export const DEMO_BASE_URL_DEFAULT = 'https://api.etoro.com/sapi/demo';
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
  baseUrl: MOCK_BASE_URL,
  wsUrl: MOCK_WS_URL,
  mode: 'mock',
};

const DEFAULT_CAP_PER_ORDER_USD = 1_000;
const DEFAULT_CAP_DAILY_USD = 10_000;

export function resolveMode(
  env: Record<string, string | undefined> = process.env,
): EtoroMode {
  const raw = env.ETORO_MODE?.toLowerCase().trim();
  if (!raw) return 'mock';
  const normalized = ALL_MODES.find((m) => m === raw);
  return normalized ?? 'mock';
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
): EtoroCredentials {
  const mode = resolveMode(env);

  if (mode === 'mock') {
    return { ...MOCK_CREDS };
  }

  const apiKey = env.ETORO_DEMO_KEY;
  const apiSecret = env.ETORO_DEMO_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      `Missing eToro demo credentials for mode "${mode}": ` +
      `ETORO_DEMO_KEY and ETORO_DEMO_SECRET must be set. ` +
      `Use ETORO_MODE=mock to run without credentials.`,
    );
  }

  const baseUrl = env.ETORO_DEMO_BASE_URL ?? DEMO_BASE_URL_DEFAULT;
  const wsUrl = env.ETORO_DEMO_WS_URL ?? DEMO_WS_URL_DEFAULT;

  return { apiKey, apiSecret, baseUrl, wsUrl, mode };
}

/**
 * Reads the demo cap config from env with safe defaults. Negative or
 * non-numeric values fall back to the defaults; this is consulted at
 * client construction and per-order in `TradingModule`.
 */
export function loadDemoCapConfig(
  env: Record<string, string | undefined> = process.env,
): DemoCapConfig {
  const order = parsePositiveNumber(
    env.MAX_DEMO_ORDER_NOTIONAL_USD,
    DEFAULT_CAP_PER_ORDER_USD,
  );
  const daily = parsePositiveNumber(
    env.MAX_DAILY_DEMO_NOTIONAL_USD,
    DEFAULT_CAP_DAILY_USD,
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

function mask(value: string): string {
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}
