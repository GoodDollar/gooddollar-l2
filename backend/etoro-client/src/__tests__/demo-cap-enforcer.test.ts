import { DemoCapEnforcer, computeNotionalUsd } from '../demo-cap-enforcer';
import { TradingError } from '../trading';

describe('DemoCapEnforcer', () => {
  describe('per-order cap', () => {
    it('accepts notional at the per-order limit (default $100)', () => {
      const cap = new DemoCapEnforcer({ env: {} });
      expect(() => cap.check(100, 'openPosition')).not.toThrow();
    });

    it('rejects notional above the per-order limit with DEMO_CAP_EXCEEDED', () => {
      const cap = new DemoCapEnforcer({ env: {} });
      try {
        cap.check(101, 'openPosition');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(TradingError);
        expect((err as TradingError).code).toBe('DEMO_CAP_EXCEEDED');
      }
    });

    it('respects MAX_DEMO_ORDER_NOTIONAL_USD env override', () => {
      const cap = new DemoCapEnforcer({ env: { MAX_DEMO_ORDER_NOTIONAL_USD: '50' } });
      expect(() => cap.check(50, 'x')).not.toThrow();
      try {
        cap.check(51, 'x');
        fail('expected throw');
      } catch (err) {
        expect((err as TradingError).code).toBe('DEMO_CAP_EXCEEDED');
      }
    });

    it('fails closed when notional is NaN or non-positive', () => {
      const cap = new DemoCapEnforcer({ env: {} });
      expect(() => cap.check(NaN, 'x')).toThrow(/DEMO_CAP_INDETERMINATE|cannot determine notional/);
      expect(() => cap.check(0, 'x')).toThrow(/DEMO_CAP_INDETERMINATE|cannot determine notional/);
      expect(() => cap.check(-1, 'x')).toThrow(/DEMO_CAP_INDETERMINATE|cannot determine notional/);
    });
  });

  describe('daily cap', () => {
    it('accumulates across multiple orders', () => {
      const cap = new DemoCapEnforcer({ env: {} });
      cap.check(100, 'a');
      cap.check(100, 'b');
      expect(cap.getState().totalUsd).toBe(200);
    });

    it('rejects when next order would push over the daily limit', () => {
      const cap = new DemoCapEnforcer({ env: {} });
      for (let i = 0; i < 10; i++) {
        cap.check(100, `order-${i}`);
      }
      try {
        cap.check(1, 'overflow');
        fail('expected throw');
      } catch (err) {
        expect((err as TradingError).code).toBe('DEMO_DAILY_CAP_EXCEEDED');
      }
    });

    it('respects MAX_DAILY_DEMO_NOTIONAL_USD env override', () => {
      const cap = new DemoCapEnforcer({
        env: { MAX_DEMO_ORDER_NOTIONAL_USD: '50', MAX_DAILY_DEMO_NOTIONAL_USD: '100' },
      });
      cap.check(50, 'a');
      cap.check(50, 'b');
      try {
        cap.check(1, 'c');
        fail('expected throw');
      } catch (err) {
        expect((err as TradingError).code).toBe('DEMO_DAILY_CAP_EXCEEDED');
      }
    });
  });

  describe('UTC day reset', () => {
    it('resets the daily total when crossing UTC midnight', () => {
      let now = Date.UTC(2026, 4, 22, 23, 30); // 23:30 UTC, day 20232
      const cap = new DemoCapEnforcer({ env: {}, now: () => now });
      cap.check(100, 'late');
      expect(cap.getState().totalUsd).toBe(100);

      now = Date.UTC(2026, 4, 23, 0, 30);
      cap.check(100, 'next-day');
      expect(cap.getState().totalUsd).toBe(100);
    });
  });
});

describe('computeNotionalUsd', () => {
  it('returns price * amount when both are positive', () => {
    expect(computeNotionalUsd({ amount: 5, price: 20 })).toBe(100);
  });

  it('falls back to amount * leverage when price is missing', () => {
    expect(computeNotionalUsd({ amount: 50, leverage: 2 })).toBe(100);
  });

  it('falls back to amount alone when neither price nor leverage usable', () => {
    expect(computeNotionalUsd({ amount: 100 })).toBe(100);
  });

  it('returns NaN when amount is missing/invalid', () => {
    expect(computeNotionalUsd({ price: 20 })).toBeNaN();
    expect(computeNotionalUsd({ amount: 0, price: 20 })).toBeNaN();
    expect(computeNotionalUsd({ amount: -1, price: 20 })).toBeNaN();
  });
});
