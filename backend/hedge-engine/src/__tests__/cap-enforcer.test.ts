import { CapEnforcer, CapEnforcerConfig } from '../cap-enforcer';
import { HedgeOrder } from '../types';

const DEFAULT_CFG: CapEnforcerConfig = {
  maxOrderNotionalUsd: 100,
  maxDailyNotionalUsd: 300,
  maxOrdersPerCycle: 3,
  maxOrdersPerDay: 10,
};

function order(deltaToHedge: number, symbol = 'AAPL'): HedgeOrder {
  return { symbol, deltaToHedge, reason: 'threshold_breach' };
}

describe('CapEnforcer', () => {
  it('approves a small order under all caps', () => {
    const enforcer = new CapEnforcer(DEFAULT_CFG);
    enforcer.startCycle();
    expect(enforcer.evaluate(order(50))).toEqual({ approved: true });
  });

  it('rejects an order whose |notional| exceeds per-order cap', () => {
    const enforcer = new CapEnforcer(DEFAULT_CFG);
    enforcer.startCycle();
    const decision = enforcer.evaluate(order(150));
    expect(decision).toEqual({
      approved: false,
      reason: 'order_notional_exceeded',
    });
  });

  it('uses |deltaToHedge| for the order cap (negative orders rejected too)', () => {
    const enforcer = new CapEnforcer(DEFAULT_CFG);
    enforcer.startCycle();
    expect(enforcer.evaluate(order(-150))).toEqual({
      approved: false,
      reason: 'order_notional_exceeded',
    });
  });

  it('rejects when this order would push daily-notional past the daily cap', () => {
    const enforcer = new CapEnforcer(DEFAULT_CFG);
    enforcer.startCycle();
    enforcer.recordFill(order(100));
    enforcer.startCycle();
    enforcer.recordFill(order(100));
    enforcer.startCycle();
    enforcer.recordFill(order(100));
    enforcer.startCycle();
    expect(enforcer.evaluate(order(50))).toEqual({
      approved: false,
      reason: 'daily_notional_exceeded',
    });
  });

  it('rejects with cycle_count_exceeded once per-cycle counter hits the cap', () => {
    const enforcer = new CapEnforcer(DEFAULT_CFG);
    enforcer.startCycle();
    expect(enforcer.evaluate(order(10))).toEqual({ approved: true });
    enforcer.recordFill(order(10));
    expect(enforcer.evaluate(order(10))).toEqual({ approved: true });
    enforcer.recordFill(order(10));
    expect(enforcer.evaluate(order(10))).toEqual({ approved: true });
    enforcer.recordFill(order(10));
    expect(enforcer.evaluate(order(10))).toEqual({
      approved: false,
      reason: 'cycle_count_exceeded',
    });
  });

  it('rejects with daily_count_exceeded once per-day counter hits the cap', () => {
    const cfg = { ...DEFAULT_CFG, maxOrdersPerCycle: 100, maxOrdersPerDay: 2 };
    const enforcer = new CapEnforcer(cfg);
    enforcer.startCycle();
    enforcer.recordFill(order(10));
    enforcer.recordFill(order(10));
    expect(enforcer.evaluate(order(10))).toEqual({
      approved: false,
      reason: 'daily_count_exceeded',
    });
  });

  it('startCycle resets the per-cycle counter but NOT the daily counter', () => {
    const enforcer = new CapEnforcer(DEFAULT_CFG);
    enforcer.startCycle();
    enforcer.recordFill(order(40));
    enforcer.recordFill(order(40));
    enforcer.recordFill(order(40));
    enforcer.startCycle();
    expect(enforcer.evaluate(order(40))).toEqual({ approved: true });
    const snap = enforcer.snapshot();
    expect(snap.dailyOrders).toBe(3);
    expect(snap.dailyNotionalUsd).toBe(120);
    expect(snap.cycleOrders).toBe(0);
  });

  it('crosses UTC midnight to reset daily counters', () => {
    let now = new Date('2026-01-15T23:00:00.000Z');
    const enforcer = new CapEnforcer(DEFAULT_CFG, () => now);
    enforcer.startCycle();
    enforcer.recordFill(order(100));
    enforcer.recordFill(order(100));
    enforcer.recordFill(order(100));
    expect(enforcer.snapshot().dailyNotionalUsd).toBe(300);

    now = new Date('2026-01-16T00:00:30.000Z');
    enforcer.startCycle();
    expect(enforcer.evaluate(order(50))).toEqual({ approved: true });
    const snap = enforcer.snapshot();
    expect(snap.dailyOrders).toBe(0);
    expect(snap.dailyNotionalUsd).toBe(0);
    expect(snap.dayKey).toBe('2026-01-16');
  });

  it('snapshot reports current state', () => {
    const enforcer = new CapEnforcer(DEFAULT_CFG);
    enforcer.startCycle();
    enforcer.recordFill(order(25));
    enforcer.recordFill(order(75));
    const snap = enforcer.snapshot();
    expect(snap.cycleOrders).toBe(2);
    expect(snap.dailyOrders).toBe(2);
    expect(snap.dailyNotionalUsd).toBe(100);
    expect(typeof snap.dayKey).toBe('string');
  });

  it('does not echo credential strings in any state or thrown message', () => {
    const enforcer = new CapEnforcer(DEFAULT_CFG);
    enforcer.startCycle();
    const decision = enforcer.evaluate(order(150));
    const serialized = JSON.stringify(decision) + JSON.stringify(enforcer.snapshot());
    expect(serialized).not.toMatch(/secret|api[_-]?key|password/i);
  });
});
