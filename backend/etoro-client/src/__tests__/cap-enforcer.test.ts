import { DemoCapEnforcer, computeOrderNotionalUsd } from '../cap-enforcer';
import { DemoCapExceededError } from '../errors';

describe('DemoCapEnforcer', () => {
  it('accepts orders within both per-order and daily caps', () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 5_000 });
    expect(cap.wouldExceed(500)).toBeNull();
    cap.recordOrder(500);
    expect(cap.getDailyTotalUsd()).toBe(500);
  });

  it('rejects orders that exceed the per-order cap', () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 100_000 });
    const err = cap.wouldExceed(1_500);
    expect(err).toBeInstanceOf(DemoCapExceededError);
    expect(err?.cap).toBe('per-order');
    expect(err?.capLimitUsd).toBe(1_000);
    expect(err?.attemptedNotionalUsd).toBe(1_500);
  });

  it('rejects orders that would push daily total over the daily cap', () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 1_500 });
    cap.recordOrder(800);
    const err = cap.wouldExceed(800); // 800 + 800 = 1600 > 1500
    expect(err).toBeInstanceOf(DemoCapExceededError);
    expect(err?.cap).toBe('daily');
  });

  it('assertCanPlaceOrder throws when wouldExceed returns an error', () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100, maxDailyNotionalUsd: 100 });
    expect(() => cap.assertCanPlaceOrder(150)).toThrow(DemoCapExceededError);
  });

  it('rolls the day bucket at UTC midnight', () => {
    let now = Date.UTC(2026, 4, 22, 10, 0, 0);
    const cap = new DemoCapEnforcer(
      { maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 1_000 },
      () => now,
    );
    cap.recordOrder(900);
    expect(cap.getDailyTotalUsd()).toBe(900);
    expect(cap.wouldExceed(200)?.cap).toBe('daily');

    // Advance to next UTC day.
    now = Date.UTC(2026, 4, 23, 0, 5, 0);
    expect(cap.getDailyTotalUsd()).toBe(0);
    expect(cap.wouldExceed(900)).toBeNull();
  });

  it('treats negative or non-finite notional as a per-order violation', () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 10_000 });
    expect(cap.wouldExceed(-1)?.cap).toBe('per-order');
    expect(cap.wouldExceed(NaN)?.cap).toBe('per-order');
  });

  it('exposes its config without sharing internal state', () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 250, maxDailyNotionalUsd: 1_000 });
    const cfg = cap.getConfig();
    expect(cfg).toEqual({ maxOrderNotionalUsd: 250, maxDailyNotionalUsd: 1_000 });
    cfg.maxOrderNotionalUsd = 999_999;
    expect(cap.getConfig().maxOrderNotionalUsd).toBe(250);
  });
});

describe('computeOrderNotionalUsd', () => {
  it('multiplies price by amount when both are positive numbers', () => {
    expect(computeOrderNotionalUsd({ price: 100, amount: 5 })).toBe(500);
  });

  it('returns null when price is missing (no more amount-as-USD fallback)', () => {
    expect(computeOrderNotionalUsd({ amount: 250 })).toBeNull();
  });

  it('returns null when price is non-positive or non-finite', () => {
    expect(computeOrderNotionalUsd({ price: 0, amount: 5 })).toBeNull();
    expect(computeOrderNotionalUsd({ price: -10, amount: 5 })).toBeNull();
    expect(computeOrderNotionalUsd({ price: NaN, amount: 5 })).toBeNull();
  });

  it('returns null for zero or negative amounts even when price is positive', () => {
    expect(computeOrderNotionalUsd({ price: 100, amount: 0 })).toBeNull();
    expect(computeOrderNotionalUsd({ price: 100, amount: -1 })).toBeNull();
    expect(computeOrderNotionalUsd({ amount: 0 })).toBeNull();
    expect(computeOrderNotionalUsd({ amount: -10 })).toBeNull();
  });
});
