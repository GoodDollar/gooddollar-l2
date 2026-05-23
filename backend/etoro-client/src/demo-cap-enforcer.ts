import { TradingError } from './trading';

const DEFAULT_PER_ORDER = 100;
const DEFAULT_DAILY = 1000;

export interface DemoCapState {
  utcDay: number;
  totalUsd: number;
  perOrderLimit: number;
  dailyLimit: number;
}

/**
 * Single-process accumulator that enforces demo notional caps:
 *
 * - per-order cap (`MAX_DEMO_ORDER_NOTIONAL_USD`, default $100)
 * - rolling daily cap (`MAX_DAILY_DEMO_NOTIONAL_USD`, default $1000)
 *
 * Resets the daily total at UTC midnight. The cap is checked BEFORE we hit
 * the network, so an exceeded cap never produces an http call.
 */
export class DemoCapEnforcer {
  private readonly perOrderLimit: number;
  private readonly dailyLimit: number;
  private utcDay: number;
  private totalUsd: number;
  private readonly now: () => number;

  constructor(opts?: {
    env?: Record<string, string | undefined>;
    now?: () => number;
  }) {
    const env = opts?.env ?? process.env;
    this.now = opts?.now ?? (() => Date.now());
    this.perOrderLimit = parsePositive(env.MAX_DEMO_ORDER_NOTIONAL_USD, DEFAULT_PER_ORDER);
    this.dailyLimit = parsePositive(env.MAX_DAILY_DEMO_NOTIONAL_USD, DEFAULT_DAILY);
    this.utcDay = dayKey(this.now());
    this.totalUsd = 0;
  }

  /**
   * Throws `TradingError` if the notional exceeds either cap.
   * On success, increments the daily accumulator.
   *
   * `notionalUsd` MUST be a positive finite number. Callers that cannot
   * determine notional MUST fail-closed (pass a value that exceeds the cap
   * or call `failClosed()`).
   */
  check(notionalUsd: number, action: string): void {
    this.resetIfNewDay();

    if (!isFinite(notionalUsd) || notionalUsd <= 0) {
      throw new TradingError(
        `${action} refused: cannot determine notional (got ${notionalUsd}). ` +
          `Demo cap enforcer fails closed.`,
        'DEMO_CAP_INDETERMINATE',
      );
    }

    if (notionalUsd > this.perOrderLimit) {
      throw new TradingError(
        `${action} refused: notional $${notionalUsd.toFixed(2)} exceeds per-order ` +
          `demo cap $${this.perOrderLimit.toFixed(2)} ` +
          `(MAX_DEMO_ORDER_NOTIONAL_USD).`,
        'DEMO_CAP_EXCEEDED',
      );
    }

    if (this.totalUsd + notionalUsd > this.dailyLimit) {
      throw new TradingError(
        `${action} refused: cumulative daily notional ` +
          `$${(this.totalUsd + notionalUsd).toFixed(2)} would exceed daily demo cap ` +
          `$${this.dailyLimit.toFixed(2)} ` +
          `(MAX_DAILY_DEMO_NOTIONAL_USD).`,
        'DEMO_DAILY_CAP_EXCEEDED',
      );
    }

    this.totalUsd += notionalUsd;
  }

  getState(): DemoCapState {
    this.resetIfNewDay();
    return {
      utcDay: this.utcDay,
      totalUsd: this.totalUsd,
      perOrderLimit: this.perOrderLimit,
      dailyLimit: this.dailyLimit,
    };
  }

  private resetIfNewDay(): void {
    const today = dayKey(this.now());
    if (today !== this.utcDay) {
      this.utcDay = today;
      this.totalUsd = 0;
    }
  }
}

function parsePositive(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!isFinite(n) || n <= 0) return fallback;
  return n;
}

function dayKey(ms: number): number {
  return Math.floor(ms / 86_400_000);
}

/**
 * Compute the notional value of an order in USD. Returns NaN when neither
 * `price * amount` nor `amount * leverage` is determinable so callers can
 * fail-closed.
 */
export function computeNotionalUsd(input: {
  amount?: number;
  price?: number;
  leverage?: number;
}): number {
  const { amount, price, leverage } = input;
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) return NaN;
  if (typeof price === 'number' && isFinite(price) && price > 0) {
    return price * amount;
  }
  if (typeof leverage === 'number' && isFinite(leverage) && leverage >= 1) {
    return amount * leverage;
  }
  return amount;
}
