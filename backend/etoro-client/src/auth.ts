import { EtoroCredentials, EtoroMode } from './types';

const ENV_MAP = {
  sandbox: {
    key: 'ETORO_SANDBOX_KEY',
    secret: 'ETORO_SANDBOX_SECRET',
    baseUrl: 'https://api.etoro.com/sapi',
  },
  real: {
    key: 'ETORO_REAL_KEY',
    secret: 'ETORO_REAL_SECRET',
    baseUrl: 'https://api.etoro.com/api',
  },
  demo: {
    key: 'ETORO_DEMO_KEY',
    secret: 'ETORO_DEMO_SECRET',
    // Demo aliases the sandbox API surface — same endpoints, no real money.
    baseUrl: 'https://api.etoro.com/sapi',
  },
} as const;

export function loadCredentialsFromEnv(
  env: Record<string, string | undefined> = process.env,
): EtoroCredentials {
  const mode = resolveMode(env);
  const config = ENV_MAP[mode];

  let apiKey = env[config.key];
  let apiSecret = env[config.secret];

  // Demo mode falls back to sandbox credentials when demo-specific vars are
  // absent. This lets existing sandbox test envs work unmodified while
  // still labelling the run as `demo` for safety-fence purposes.
  if (mode === 'demo' && (!apiKey || !apiSecret)) {
    apiKey = env[ENV_MAP.sandbox.key];
    apiSecret = env[ENV_MAP.sandbox.secret];
  }

  if (!apiKey || !apiSecret) {
    const hint =
      mode === 'demo'
        ? `${config.key}/${config.secret} (or ${ENV_MAP.sandbox.key}/${ENV_MAP.sandbox.secret})`
        : `${config.key} and ${config.secret}`;
    throw new Error(
      `Missing eToro ${mode} credentials: ${hint} must be set`,
    );
  }

  if (mode === 'real') {
    const confirmed = env.ETORO_REAL_CONFIRMED;
    if (confirmed !== 'true') {
      throw new Error(
        'ETORO_REAL_CONFIRMED=true is required to use real eToro credentials. ' +
        'This is a safety check — set it explicitly to confirm real trading.',
      );
    }
  }

  const baseUrl = env.ETORO_BASE_URL ?? config.baseUrl;

  return { apiKey, apiSecret, baseUrl, mode };
}

export function resolveMode(
  env: Record<string, string | undefined> = process.env,
): EtoroMode {
  const raw = env.ETORO_MODE?.toLowerCase().trim();
  if (raw === 'real') return 'real';
  if (raw === 'demo') return 'demo';
  return 'sandbox';
}

export function redactCredentials(creds: EtoroCredentials): Record<string, string> {
  return {
    mode: creds.mode,
    baseUrl: creds.baseUrl,
    apiKey: mask(creds.apiKey),
    apiSecret: mask(creds.apiSecret),
  };
}

function mask(value: string): string {
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}
