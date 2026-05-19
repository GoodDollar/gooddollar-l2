import { loadCredentialsFromEnv, resolveMode } from '../auth';

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

  it('is case-insensitive', () => {
    expect(resolveMode({ ETORO_MODE: 'REAL' })).toBe('real');
    expect(resolveMode({ ETORO_MODE: 'Sandbox' })).toBe('sandbox');
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
});
