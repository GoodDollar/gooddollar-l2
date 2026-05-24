import { loadCredentialsFromEnv, resolveMode, redactCredentials } from '../auth';

describe('resolveMode', () => {
  it('defaults to sandbox when ETORO_MODE is not set', () => {
    expect(resolveMode({})).toBe('sandbox');
  });

  it('returns sandbox for ETORO_MODE=sandbox', () => {
    expect(resolveMode({ ETORO_MODE: 'sandbox' })).toBe('sandbox');
  });

  it('returns real for ETORO_MODE=real', () => {
    expect(resolveMode({ ETORO_MODE: 'real' })).toBe('real');
  });

  it('returns demo for ETORO_MODE=demo', () => {
    expect(resolveMode({ ETORO_MODE: 'demo' })).toBe('demo');
  });

  it('is case-insensitive', () => {
    expect(resolveMode({ ETORO_MODE: 'REAL' })).toBe('real');
    expect(resolveMode({ ETORO_MODE: 'Sandbox' })).toBe('sandbox');
    expect(resolveMode({ ETORO_MODE: 'DEMO' })).toBe('demo');
    expect(resolveMode({ ETORO_MODE: 'Demo' })).toBe('demo');
  });
});

describe('loadCredentialsFromEnv', () => {
  const sandboxEnv = {
    ETORO_MODE: 'sandbox',
    ETORO_SANDBOX_KEY: 'sb-key-123',
    ETORO_SANDBOX_SECRET: 'sb-secret-456',
  };

  it('loads sandbox credentials', () => {
    const creds = loadCredentialsFromEnv(sandboxEnv);
    expect(creds.mode).toBe('sandbox');
    expect(creds.apiKey).toBe('sb-key-123');
    expect(creds.apiSecret).toBe('sb-secret-456');
    expect(creds.baseUrl).toBe('https://api.etoro.com/sapi');
  });

  it('throws when sandbox key is missing', () => {
    expect(() =>
      loadCredentialsFromEnv({ ETORO_MODE: 'sandbox' }),
    ).toThrow('Missing eToro sandbox credentials');
  });

  it('throws when sandbox secret is missing', () => {
    expect(() =>
      loadCredentialsFromEnv({
        ETORO_MODE: 'sandbox',
        ETORO_SANDBOX_KEY: 'key',
      }),
    ).toThrow('Missing eToro sandbox credentials');
  });

  it('loads real credentials with confirmation', () => {
    const realEnv = {
      ETORO_MODE: 'real',
      ETORO_REAL_KEY: 'real-key',
      ETORO_REAL_SECRET: 'real-secret',
      ETORO_REAL_CONFIRMED: 'true',
    };
    const creds = loadCredentialsFromEnv(realEnv);
    expect(creds.mode).toBe('real');
    expect(creds.apiKey).toBe('real-key');
    expect(creds.apiSecret).toBe('real-secret');
  });

  it('throws when real mode without ETORO_REAL_CONFIRMED', () => {
    expect(() =>
      loadCredentialsFromEnv({
        ETORO_MODE: 'real',
        ETORO_REAL_KEY: 'key',
        ETORO_REAL_SECRET: 'secret',
      }),
    ).toThrow('ETORO_REAL_CONFIRMED=true is required');
  });

  it('uses custom base URL when provided', () => {
    const creds = loadCredentialsFromEnv({
      ...sandboxEnv,
      ETORO_BASE_URL: 'https://custom.api.com',
    });
    expect(creds.baseUrl).toBe('https://custom.api.com');
  });

  it('sandbox mode never loads real credentials even if present', () => {
    const mixedEnv = {
      ETORO_MODE: 'sandbox',
      ETORO_SANDBOX_KEY: 'sb-key-123',
      ETORO_SANDBOX_SECRET: 'sb-secret-456',
      ETORO_REAL_KEY: 'real-key-should-not-appear',
      ETORO_REAL_SECRET: 'real-secret-should-not-appear',
    };
    const creds = loadCredentialsFromEnv(mixedEnv);
    expect(creds.apiKey).toBe('sb-key-123');
    expect(creds.apiSecret).toBe('sb-secret-456');
    expect(creds.apiKey).not.toContain('real');
    expect(creds.apiSecret).not.toContain('real');
  });

  it('rejects ETORO_REAL_CONFIRMED=false for real mode', () => {
    expect(() =>
      loadCredentialsFromEnv({
        ETORO_MODE: 'real',
        ETORO_REAL_KEY: 'key',
        ETORO_REAL_SECRET: 'secret',
        ETORO_REAL_CONFIRMED: 'false',
      }),
    ).toThrow('ETORO_REAL_CONFIRMED=true is required');
  });

  describe('demo mode', () => {
    it('loads demo credentials when ETORO_DEMO_KEY/SECRET are present', () => {
      const demoEnv = {
        ETORO_MODE: 'demo',
        ETORO_DEMO_KEY: 'demo-key-123',
        ETORO_DEMO_SECRET: 'demo-secret-456',
      };
      const creds = loadCredentialsFromEnv(demoEnv);
      expect(creds.mode).toBe('demo');
      expect(creds.apiKey).toBe('demo-key-123');
      expect(creds.apiSecret).toBe('demo-secret-456');
      // Demo aliases the sandbox API surface
      expect(creds.baseUrl).toBe('https://api.etoro.com/sapi');
    });

    it('falls back to sandbox credentials when demo creds are absent', () => {
      const demoEnv = {
        ETORO_MODE: 'demo',
        ETORO_SANDBOX_KEY: 'sb-key-fallback',
        ETORO_SANDBOX_SECRET: 'sb-secret-fallback',
      };
      const creds = loadCredentialsFromEnv(demoEnv);
      // Mode is NEVER silently coerced — we stay on `demo` even if
      // sandbox credentials were used to populate the request.
      expect(creds.mode).toBe('demo');
      expect(creds.apiKey).toBe('sb-key-fallback');
      expect(creds.apiSecret).toBe('sb-secret-fallback');
      expect(creds.baseUrl).toBe('https://api.etoro.com/sapi');
    });

    it('prefers demo-specific credentials when both demo and sandbox vars are set', () => {
      const env = {
        ETORO_MODE: 'demo',
        ETORO_DEMO_KEY: 'demo-key',
        ETORO_DEMO_SECRET: 'demo-secret',
        ETORO_SANDBOX_KEY: 'sb-key',
        ETORO_SANDBOX_SECRET: 'sb-secret',
      };
      const creds = loadCredentialsFromEnv(env);
      expect(creds.mode).toBe('demo');
      expect(creds.apiKey).toBe('demo-key');
      expect(creds.apiSecret).toBe('demo-secret');
    });

    it('throws when neither demo nor sandbox creds are present', () => {
      expect(() =>
        loadCredentialsFromEnv({ ETORO_MODE: 'demo' }),
      ).toThrow('Missing eToro demo credentials');
    });

    it('does NOT require ETORO_REAL_CONFIRMED for demo mode', () => {
      expect(() =>
        loadCredentialsFromEnv({
          ETORO_MODE: 'demo',
          ETORO_DEMO_KEY: 'k',
          ETORO_DEMO_SECRET: 's',
        }),
      ).not.toThrow();
    });

    it('demo mode never loads real credentials even if present', () => {
      const env = {
        ETORO_MODE: 'demo',
        ETORO_DEMO_KEY: 'demo-key',
        ETORO_DEMO_SECRET: 'demo-secret',
        ETORO_REAL_KEY: 'real-key-should-not-appear',
        ETORO_REAL_SECRET: 'real-secret-should-not-appear',
        ETORO_REAL_CONFIRMED: 'true',
      };
      const creds = loadCredentialsFromEnv(env);
      expect(creds.mode).toBe('demo');
      expect(creds.apiKey).not.toContain('real');
      expect(creds.apiSecret).not.toContain('real');
    });
  });
});

describe('redactCredentials', () => {
  it('masks API key and secret', () => {
    const redacted = redactCredentials({
      apiKey: 'abcdefghijklmnop',
      apiSecret: 'secret1234567890',
      baseUrl: 'https://api.etoro.com/sapi',
      mode: 'sandbox',
    });
    expect(redacted.apiKey).toBe('abc...nop');
    expect(redacted.apiSecret).toBe('sec...890');
    expect(redacted.mode).toBe('sandbox');
    expect(redacted.baseUrl).toBe('https://api.etoro.com/sapi');
  });

  it('fully masks short credentials', () => {
    const redacted = redactCredentials({
      apiKey: 'abc',
      apiSecret: '12345',
      baseUrl: 'https://api.etoro.com/sapi',
      mode: 'sandbox',
    });
    expect(redacted.apiKey).toBe('***');
    expect(redacted.apiSecret).toBe('***');
  });

  it('never exposes raw credential values', () => {
    const creds = {
      apiKey: 'SUPERSECRETAPIKEY1234',
      apiSecret: 'VERYSECRETAPISECRET5678',
      baseUrl: 'https://api.etoro.com/sapi',
      mode: 'sandbox' as const,
    };
    const redacted = redactCredentials(creds);
    const allValues = Object.values(redacted).join(' ');
    expect(allValues).not.toContain('SUPERSECRETAPIKEY1234');
    expect(allValues).not.toContain('VERYSECRETAPISECRET5678');
  });
});
