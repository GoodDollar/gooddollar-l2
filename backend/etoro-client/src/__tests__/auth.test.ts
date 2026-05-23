import {
  DEMO_BASE_URL_DEFAULT,
  DEMO_WS_URL_DEFAULT,
  loadCredentialsFromEnv,
  loadDemoCapConfig,
  MODE_CAPABILITIES,
  REAL_TRADING_ENABLED,
  redactCredentials,
  resolveMode,
  resolveModeSource,
} from '../auth';
import { InvalidModeError } from '../errors';

describe('REAL_TRADING_ENABLED fence', () => {
  it('is a const set to false at the source level', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });
});

describe('resolveMode', () => {
  it('defaults to mock when ETORO_MODE is not set', () => {
    expect(resolveMode({})).toBe('mock');
  });

  it('returns mock for ETORO_MODE=mock', () => {
    expect(resolveMode({ ETORO_MODE: 'mock' })).toBe('mock');
  });

  it('returns demo-readonly for ETORO_MODE=demo-readonly', () => {
    expect(resolveMode({ ETORO_MODE: 'demo-readonly' })).toBe('demo-readonly');
  });

  it('returns demo-trading for ETORO_MODE=demo-trading', () => {
    expect(resolveMode({ ETORO_MODE: 'demo-trading' })).toBe('demo-trading');
  });

  it('returns real-disabled for ETORO_MODE=real-disabled', () => {
    expect(resolveMode({ ETORO_MODE: 'real-disabled' })).toBe('real-disabled');
  });

  it('is case-insensitive', () => {
    expect(resolveMode({ ETORO_MODE: 'DEMO-TRADING' })).toBe('demo-trading');
    expect(resolveMode({ ETORO_MODE: 'Mock' })).toBe('mock');
  });

  it('throws InvalidModeError for legacy or unknown mode names', () => {
    for (const raw of ['real', 'sandbox', 'production', 'live', 'demo', 'PRODUCTION-LIVE']) {
      expect(() => resolveMode({ ETORO_MODE: raw })).toThrow(InvalidModeError);
    }
  });

  it('InvalidModeError carries the raw value and the list of valid modes', () => {
    try {
      resolveMode({ ETORO_MODE: 'demo' });
      fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidModeError);
      const err = e as InvalidModeError;
      expect(err.rawValue).toBe('demo');
      expect(err.validModes).toContain('demo-trading');
      expect(err.validModes).toContain('demo-readonly');
      expect(err.message).toContain('demo-readonly');
    }
  });

  it('trims and lowercases the raw mode before validating', () => {
    expect(resolveMode({ ETORO_MODE: '  DEMO-TRADING  ' })).toBe('demo-trading');
  });
});

describe('resolveModeSource', () => {
  it("returns 'default' when ETORO_MODE is unset", () => {
    expect(resolveModeSource({})).toBe('default');
  });

  it("returns 'env' when ETORO_MODE is set", () => {
    expect(resolveModeSource({ ETORO_MODE: 'mock' })).toBe('env');
  });
});

describe('loadCredentialsFromEnv', () => {
  const demoEnv = {
    ETORO_DEMO_KEY: 'demo-key-123',
    ETORO_DEMO_SECRET: 'demo-secret-456',
  };

  it('returns deterministic mock credentials when ETORO_MODE is unset', () => {
    const creds = loadCredentialsFromEnv({}, { silent: true });
    expect(creds.mode).toBe('mock');
    expect(creds.apiKey).toBe('mock-api-key');
    expect(creds.apiSecret).toBe('mock-api-secret');
    expect(creds.baseUrl).toMatch(/^mock:/);
    expect(creds.wsUrl).toMatch(/^mock:/);
  });

  it('emits exactly one default-mock warning when ETORO_MODE is unset', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      loadCredentialsFromEnv({});
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/ETORO_MODE not set/);
    } finally {
      warn.mockRestore();
    }
  });

  it('suppresses the warning when { silent: true }', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      loadCredentialsFromEnv({}, { silent: true });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('does NOT warn when ETORO_MODE is explicitly set to mock', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      loadCredentialsFromEnv({ ETORO_MODE: 'mock' });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('propagates InvalidModeError for unknown ETORO_MODE values', () => {
    expect(() => loadCredentialsFromEnv({ ETORO_MODE: 'demo' }, { silent: true }))
      .toThrow(InvalidModeError);
  });

  it('returns mock creds for ETORO_MODE=mock without consulting demo env vars', () => {
    const creds = loadCredentialsFromEnv({
      ETORO_MODE: 'mock',
      ETORO_DEMO_KEY: 'should-not-be-read',
      ETORO_DEMO_SECRET: 'should-not-be-read',
    }, { silent: true });
    expect(creds.mode).toBe('mock');
    expect(creds.apiKey).toBe('mock-api-key');
    expect(creds.apiSecret).toBe('mock-api-secret');
  });

  it('loads demo-readonly credentials with default demo URLs', () => {
    const creds = loadCredentialsFromEnv({ ETORO_MODE: 'demo-readonly', ...demoEnv });
    expect(creds.mode).toBe('demo-readonly');
    expect(creds.apiKey).toBe('demo-key-123');
    expect(creds.apiSecret).toBe('demo-secret-456');
    expect(creds.baseUrl).toBe(DEMO_BASE_URL_DEFAULT);
    expect(creds.wsUrl).toBe(DEMO_WS_URL_DEFAULT);
  });

  it('loads demo-trading credentials with default demo URLs', () => {
    const creds = loadCredentialsFromEnv({ ETORO_MODE: 'demo-trading', ...demoEnv });
    expect(creds.mode).toBe('demo-trading');
    expect(creds.baseUrl).toBe(DEMO_BASE_URL_DEFAULT);
  });

  it('loads real-disabled credentials but still uses demo URLs (no real URL exposure)', () => {
    const creds = loadCredentialsFromEnv({ ETORO_MODE: 'real-disabled', ...demoEnv });
    expect(creds.mode).toBe('real-disabled');
    expect(creds.baseUrl).toBe(DEMO_BASE_URL_DEFAULT);
    expect(creds.wsUrl).toBe(DEMO_WS_URL_DEFAULT);
  });

  it('throws when demo-readonly is requested without credentials', () => {
    expect(() =>
      loadCredentialsFromEnv({ ETORO_MODE: 'demo-readonly' }),
    ).toThrow(/Missing eToro demo credentials/);
  });

  it('throws when demo-trading is requested without credentials', () => {
    expect(() =>
      loadCredentialsFromEnv({ ETORO_MODE: 'demo-trading', ETORO_DEMO_KEY: 'k' }),
    ).toThrow(/ETORO_DEMO_KEY and ETORO_DEMO_SECRET/);
  });

  it('throws when real-disabled is requested without credentials', () => {
    expect(() =>
      loadCredentialsFromEnv({ ETORO_MODE: 'real-disabled' }),
    ).toThrow(/Missing eToro demo credentials/);
  });

  it('respects ETORO_DEMO_BASE_URL and ETORO_DEMO_WS_URL overrides', () => {
    const creds = loadCredentialsFromEnv({
      ETORO_MODE: 'demo-readonly',
      ...demoEnv,
      ETORO_DEMO_BASE_URL: 'https://custom-demo.test/api',
      ETORO_DEMO_WS_URL: 'wss://custom-demo.test/ws',
    });
    expect(creds.baseUrl).toBe('https://custom-demo.test/api');
    expect(creds.wsUrl).toBe('wss://custom-demo.test/ws');
  });

  it('never returns real-account credentials regardless of legacy env vars', () => {
    const creds = loadCredentialsFromEnv({
      ETORO_MODE: 'demo-trading',
      ...demoEnv,
      ETORO_REAL_KEY: 'should-be-ignored',
      ETORO_REAL_SECRET: 'should-be-ignored',
      ETORO_REAL_CONFIRMED: 'true',
    });
    expect(creds.apiKey).not.toContain('ignored');
    expect(creds.apiSecret).not.toContain('ignored');
  });
});

describe('loadDemoCapConfig', () => {
  it('returns defaults when env is empty', () => {
    const cfg = loadDemoCapConfig({});
    expect(cfg.maxOrderNotionalUsd).toBe(1_000);
    expect(cfg.maxDailyNotionalUsd).toBe(10_000);
  });

  it('reads positive values from env', () => {
    const cfg = loadDemoCapConfig({
      MAX_DEMO_ORDER_NOTIONAL_USD: '250',
      MAX_DAILY_DEMO_NOTIONAL_USD: '2500',
    });
    expect(cfg.maxOrderNotionalUsd).toBe(250);
    expect(cfg.maxDailyNotionalUsd).toBe(2500);
  });

  it('falls back to defaults for non-positive or non-numeric values', () => {
    const cfg = loadDemoCapConfig({
      MAX_DEMO_ORDER_NOTIONAL_USD: '-5',
      MAX_DAILY_DEMO_NOTIONAL_USD: 'abc',
    });
    expect(cfg.maxOrderNotionalUsd).toBe(1_000);
    expect(cfg.maxDailyNotionalUsd).toBe(10_000);
  });
});

describe('MODE_CAPABILITIES', () => {
  it('says mock has no credentials and disabled trading', () => {
    expect(MODE_CAPABILITIES.mock).toEqual({
      marketData: 'mock',
      trading: 'disabled',
      requiresCredentials: false,
    });
  });

  it('says demo-trading is the only mode with trading enabled', () => {
    expect(MODE_CAPABILITIES['demo-trading'].trading).toBe('enabled');
    expect(MODE_CAPABILITIES['demo-readonly'].trading).toBe('disabled');
    expect(MODE_CAPABILITIES['real-disabled'].trading).toBe('disabled');
    expect(MODE_CAPABILITIES.mock.trading).toBe('disabled');
  });
});

describe('redactCredentials', () => {
  it('masks API key and secret while exposing mode + URLs', () => {
    const redacted = redactCredentials({
      apiKey: 'abcdefghijklmnop',
      apiSecret: 'secret1234567890',
      baseUrl: DEMO_BASE_URL_DEFAULT,
      wsUrl: DEMO_WS_URL_DEFAULT,
      mode: 'demo-readonly',
    });
    expect(redacted.apiKey).toBe('abc...nop');
    expect(redacted.apiSecret).toBe('sec...890');
    expect(redacted.mode).toBe('demo-readonly');
    expect(redacted.baseUrl).toBe(DEMO_BASE_URL_DEFAULT);
    expect(redacted.wsUrl).toBe(DEMO_WS_URL_DEFAULT);
  });

  it('fully masks short credentials', () => {
    const redacted = redactCredentials({
      apiKey: 'abc',
      apiSecret: '12345',
      baseUrl: DEMO_BASE_URL_DEFAULT,
      wsUrl: DEMO_WS_URL_DEFAULT,
      mode: 'demo-trading',
    });
    expect(redacted.apiKey).toBe('***');
    expect(redacted.apiSecret).toBe('***');
  });

  it('never exposes raw credential values', () => {
    const redacted = redactCredentials({
      apiKey: 'SUPERSECRETAPIKEY1234',
      apiSecret: 'VERYSECRETAPISECRET5678',
      baseUrl: DEMO_BASE_URL_DEFAULT,
      wsUrl: DEMO_WS_URL_DEFAULT,
      mode: 'demo-trading',
    });
    const allValues = Object.values(redacted).join(' ');
    expect(allValues).not.toContain('SUPERSECRETAPIKEY1234');
    expect(allValues).not.toContain('VERYSECRETAPISECRET5678');
  });
});
