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
 * SDK treats `amount` as a unit count of the instrument. To convert a unit
 * count into a USD notional we MUST have a price; without one we return
 * `null` so the caller can decide whether to throw, look up a reference
 * price, or use an injected sizer. The previous behavior — falling back to
 * amount-as-USD — silently bypassed the cap math for market orders on
 * high-priced instruments (e.g., 0.1 BTC reported as $0.10), which is why
 * we no longer accept that fallback here.
 */
export function computeOrderNotionalUsd(input: {
  price?: number;
  amount: number;
}): number | null {
  const { price, amount } = input;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  return price * amount;
}

function utcDayStart(nowMs: number): number {
  const d = new Date(nowMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
