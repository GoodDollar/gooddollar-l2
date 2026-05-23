import {
  REAL_TRADING_ENABLED,
  assertDemoModeOrThrow,
  isRealTradingEnabled,
  RealTradingDisabledError,
} from '../safety';

describe('REAL_TRADING_ENABLED source constant', () => {
  it('is hardcoded false at runtime', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });

  it('has a literal-false type that cannot be flipped at runtime', () => {
    // The const-typed `false` makes any attempt to assign true a compile error.
    // We still verify the runtime guarantee — env tampering can't change it.
    process.env.REAL_TRADING_ENABLED = 'true';
    process.env.ETORO_REAL_CONFIRMED = 'true';
    process.env.ETORO_MODE = 'real';
    expect(REAL_TRADING_ENABLED).toBe(false);
    delete process.env.REAL_TRADING_ENABLED;
    delete process.env.ETORO_REAL_CONFIRMED;
    delete process.env.ETORO_MODE;
  });

  it('isRealTradingEnabled() returns false', () => {
    expect(isRealTradingEnabled()).toBe(false);
  });
});

describe('assertDemoModeOrThrow', () => {
  it('is a no-op for sandbox mode', () => {
    expect(() => assertDemoModeOrThrow('sandbox')).not.toThrow();
  });

  it('throws RealTradingDisabledError for real mode', () => {
    expect(() => assertDemoModeOrThrow('real')).toThrow(RealTradingDisabledError);
  });

  it('error message references the constant name', () => {
    try {
      assertDemoModeOrThrow('real');
      fail('expected throw');
    } catch (err) {
      expect((err as Error).message).toMatch(/REAL_TRADING_ENABLED/);
      expect((err as RealTradingDisabledError).code).toBe('REAL_TRADING_DISABLED');
    }
  });

  it('error references the source file for the reviewer', () => {
    expect(() => assertDemoModeOrThrow('real')).toThrow(/safety\.ts/);
  });

  it('env tampering cannot bypass the fence', () => {
    process.env.REAL_TRADING_ENABLED = 'true';
    process.env.ETORO_MODE = 'real';
    process.env.ETORO_REAL_CONFIRMED = 'true';
    expect(() => assertDemoModeOrThrow('real')).toThrow(RealTradingDisabledError);
    delete process.env.REAL_TRADING_ENABLED;
    delete process.env.ETORO_MODE;
    delete process.env.ETORO_REAL_CONFIRMED;
  });
});
