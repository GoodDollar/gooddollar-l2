import {
  REAL_TRADING_ENABLED,
  RealTradingFenceError,
  assertTradeFence,
} from '../safety';

describe('REAL_TRADING_ENABLED constant', () => {
  it('is the literal false', () => {
    expect(REAL_TRADING_ENABLED).toBe(false);
  });

  it('is typed as `false` (compile-time pinned)', () => {
    // If a future PR ever flips REAL_TRADING_ENABLED to `true`, the
    // following assignment will fail to compile, forcing a visible
    // code-review signal.
    // @ts-expect-error — REAL_TRADING_ENABLED must remain `false`
    const _shouldNotCompile: true = REAL_TRADING_ENABLED;
    void _shouldNotCompile;
  });
});

describe('assertTradeFence', () => {
  it('passes for { mode: "demo", dryRun: false }', () => {
    expect(() => assertTradeFence({ mode: 'demo', dryRun: false })).not.toThrow();
  });

  it('throws for { mode: "sandbox", dryRun: false }', () => {
    expect(() => assertTradeFence({ mode: 'sandbox', dryRun: false })).toThrow(
      RealTradingFenceError,
    );
  });

  it('throws for { mode: "real", dryRun: false }', () => {
    expect(() => assertTradeFence({ mode: 'real', dryRun: false })).toThrow(
      RealTradingFenceError,
    );
  });

  it('throws for an unknown mode label, dryRun: false', () => {
    expect(() =>
      assertTradeFence({ mode: 'production' as any, dryRun: false }),
    ).toThrow(RealTradingFenceError);
  });

  it('does NOT throw when dryRun is true — even for real mode', () => {
    expect(() => assertTradeFence({ mode: 'real', dryRun: true })).not.toThrow();
    expect(() => assertTradeFence({ mode: 'sandbox', dryRun: true })).not.toThrow();
    expect(() => assertTradeFence({ mode: 'demo', dryRun: true })).not.toThrow();
  });

  it('error message names the violation but does not echo env values', () => {
    let err: unknown;
    try {
      assertTradeFence({ mode: 'sandbox', dryRun: false });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(RealTradingFenceError);
    const message = (err as Error).message;
    expect(message).toContain('Refusing to enable trading');
    expect(message).toContain('sandbox');
    expect(message).toContain('REAL_TRADING_ENABLED');
    // No credential or env value content allowed in the message.
    expect(message).not.toMatch(/key|secret|token|api/i);
  });

  it('redacts unknown mode labels (does not echo arbitrary strings)', () => {
    let err: unknown;
    try {
      assertTradeFence({
        mode: 'evil-attacker-injected-string\nsecret=foo' as any,
        dryRun: false,
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(RealTradingFenceError);
    const message = (err as Error).message;
    // Untrusted labels are reduced to `<unknown>` to prevent log injection
    // and credential leakage via the mode argument.
    expect(message).toContain('<unknown>');
    expect(message).not.toContain('evil-attacker');
    expect(message).not.toContain('secret=foo');
  });
});
