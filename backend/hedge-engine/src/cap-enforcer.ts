import { HedgeOrder } from './types';

/**
 * Demo trading caps enforced before a single eToro order leaves the process.
 *
 * Notional assumption: `|HedgeOrder.deltaToHedge|` is already a USD-equivalent
 * (see `ExposureReader.formatUnits(raw, 18)`) so we can compare it directly
 * against the per-order / daily USD caps without an extra price round-trip.
 * If that assumption ever changes, this file is the single place to plug in
 * a price lookup.
 *
 * All counters are in-memory by design — disk persistence is out-of-scope
 * here (see task 0004 for the receipt store).
 */
export interface CapEnforcerConfig {
  maxOrderNotionalUsd: number;
  maxDailyNotionalUsd: number;
  maxOrdersPerCycle: number;
  maxOrdersPerDay: number;
}

export type CapRejectReason =
  | 'order_notional_exceeded'
  | 'daily_notional_exceeded'
  | 'cycle_count_exceeded'
  | 'daily_count_exceeded';

export interface CapDecision {
  approved: boolean;
  reason?: CapRejectReason;
}

export interface CapSnapshot {
  dailyNotionalUsd: number;
  dailyOrders: number;
  cycleOrders: number;
  dayKey: string;
}

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class CapEnforcer {
  private readonly cfg: CapEnforcerConfig;
  private readonly now: () => Date;
  private dayKey: string;
  private dailyNotionalUsd = 0;
  private dailyOrders = 0;
  private cycleOrders = 0;

  constructor(cfg: CapEnforcerConfig, now: () => Date = () => new Date()) {
    this.cfg = cfg;
    this.now = now;
    this.dayKey = utcDayKey(now());
  }

  /** Reset the per-cycle order counter at the start of every engine tick. */
  startCycle(): void {
    this.rolloverIfNewDay();
    this.cycleOrders = 0;
  }

  evaluate(order: HedgeOrder): CapDecision {
    this.rolloverIfNewDay();

    const notional = Math.abs(order.deltaToHedge);

    if (notional > this.cfg.maxOrderNotionalUsd) {
      return { approved: false, reason: 'order_notional_exceeded' };
    }
    if (this.cycleOrders >= this.cfg.maxOrdersPerCycle) {
      return { approved: false, reason: 'cycle_count_exceeded' };
    }
    if (this.dailyOrders >= this.cfg.maxOrdersPerDay) {
      return { approved: false, reason: 'daily_count_exceeded' };
    }
    if (this.dailyNotionalUsd + notional > this.cfg.maxDailyNotionalUsd) {
      return { approved: false, reason: 'daily_notional_exceeded' };
    }
    return { approved: true };
  }

  /**
   * Mark an order as filled — bumps cycle + daily counters. Callers MUST
   * only invoke this on truly successful executions (post-adapter).
   */
  recordFill(order: HedgeOrder): void {
    this.rolloverIfNewDay();
    const notional = Math.abs(order.deltaToHedge);
    this.dailyNotionalUsd += notional;
    this.dailyOrders += 1;
    this.cycleOrders += 1;
  }

  snapshot(): CapSnapshot {
    return {
      dailyNotionalUsd: this.dailyNotionalUsd,
      dailyOrders: this.dailyOrders,
      cycleOrders: this.cycleOrders,
      dayKey: this.dayKey,
    };
  }

  private rolloverIfNewDay(): void {
    const key = utcDayKey(this.now());
    if (key !== this.dayKey) {
      this.dayKey = key;
      this.dailyNotionalUsd = 0;
      this.dailyOrders = 0;
      this.cycleOrders = 0;
    }
  }
}
