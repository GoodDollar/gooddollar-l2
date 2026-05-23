import { DemoCapExceededError } from './errors';
import { DemoCapConfig } from './types';

/**
 * In-process demo order cap enforcer.
 *
 * Tracks cumulative notional within a UTC-day bucket. The bucket rolls over
 * at UTC midnight; persistence across process restarts is intentionally out
 * of scope for the lane (caps are a v0 demo guard, not an audit ledger —
 * the audit log carries the full record).
 *
 * Usage pattern:
 *   1. `assertCanPlaceOrder(notional)` — throws `DemoCapExceededError` if
 *      either the per-order or post-order daily cap would be breached.
 *   2. `recordOrder(notional)` — call only after the order is accepted;
 *      adds to the running daily total.
 *
 * The two steps are split so callers can decide between optimistic and
 * pessimistic accounting; `TradingModule` records on success.
 */
export class DemoCapEnforcer {
  private readonly config: DemoCapConfig;
  private readonly clock: () => number;
  private dayBucketStartMs = 0;
  private dailyTotalUsd = 0;

  constructor(config: DemoCapConfig, clock: () => number = () => Date.now()) {
    this.config = config;
    this.clock = clock;
  }

  getDailyTotalUsd(): number {
    this.rollIfNeeded();
    return this.dailyTotalUsd;
  }

  getConfig(): DemoCapConfig {
    return { ...this.config };
  }

  wouldExceed(notionalUsd: number): null | DemoCapExceededError {
    if (!Number.isFinite(notionalUsd) || notionalUsd < 0) {
      return new DemoCapExceededError({
        cap: 'per-order',
        capLimitUsd: this.config.maxOrderNotionalUsd,
        attemptedNotionalUsd: notionalUsd,
        currentDailyTotalUsd: this.getDailyTotalUsd(),
      });
    }

    if (notionalUsd > this.config.maxOrderNotionalUsd) {
      return new DemoCapExceededError({
        cap: 'per-order',
        capLimitUsd: this.config.maxOrderNotionalUsd,
        attemptedNotionalUsd: notionalUsd,
        currentDailyTotalUsd: this.getDailyTotalUsd(),
      });
    }

    const projected = this.getDailyTotalUsd() + notionalUsd;
    if (projected > this.config.maxDailyNotionalUsd) {
      return new DemoCapExceededError({
        cap: 'daily',
        capLimitUsd: this.config.maxDailyNotionalUsd,
        attemptedNotionalUsd: notionalUsd,
        currentDailyTotalUsd: this.getDailyTotalUsd(),
      });
    }

    return null;
  }

  assertCanPlaceOrder(notionalUsd: number): void {
    const err = this.wouldExceed(notionalUsd);
    if (err) throw err;
  }

  recordOrder(notionalUsd: number): void {
    this.rollIfNeeded();
    if (Number.isFinite(notionalUsd) && notionalUsd > 0) {
      this.dailyTotalUsd += notionalUsd;
    }
  }

  /**
   * Forces the day bucket forward — used in tests to verify rollover. Not
   * intended for runtime use.
   */
  resetDayBucket(): void {
    this.dayBucketStartMs = utcDayStart(this.clock());
    this.dailyTotalUsd = 0;
  }

  private rollIfNeeded(): void {
    const todayStart = utcDayStart(this.clock());
    if (this.dayBucketStartMs !== todayStart) {
      this.dayBucketStartMs = todayStart;
      this.dailyTotalUsd = 0;
    }
  }
}

/**
 * Computes the order's notional in USD given a price and amount. The lane
 * SDK treats `amount` as either a unit count (when price is known) or as a
 * USD-denominated stake (when price is 0/missing). When neither is usable,
 * we conservatively return 0 so the caller can decide whether to require a
 * notional explicitly.
 */
export function computeOrderNotionalUsd(input: {
  price?: number;
  amount: number;
}): number {
  const { price, amount } = input;
  if (typeof price === 'number' && Number.isFinite(price) && price > 0
    && Number.isFinite(amount) && amount > 0) {
    return price * amount;
  }
  if (Number.isFinite(amount) && amount > 0) {
    return amount;
  }
  return 0;
}

function utcDayStart(nowMs: number): number {
  const d = new Date(nowMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
