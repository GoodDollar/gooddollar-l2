import { EtoroMode } from './types';

/**
 * Thrown by any trading-mutating method when the SDK is not in a mode
 * that allows real-money or demo trading. The lane's `REAL_TRADING_ENABLED`
 * fence guarantees this is also thrown for `real-disabled` mode regardless
 * of what env vars are present.
 */
export class RealTradingDisabledError extends Error {
  readonly mode: EtoroMode;
  readonly action: string;

  constructor(action: string, mode: EtoroMode) {
    super(
      `Trading is disabled in mode "${mode}". Action "${action}" refused. ` +
      `Real trading is fenced at the source level (REAL_TRADING_ENABLED=false). ` +
      `Use ETORO_MODE=demo-trading with demo credentials to place demo orders.`,
    );
    this.name = 'RealTradingDisabledError';
    this.mode = mode;
    this.action = action;
  }
}

/**
 * Thrown when a demo order would exceed either the per-order or
 * cumulative-day notional cap. The cap-enforcer audits the attempt and
 * never lets the request reach the HTTP layer.
 */
export class DemoCapExceededError extends Error {
  readonly cap: 'per-order' | 'daily';
  readonly capLimitUsd: number;
  readonly attemptedNotionalUsd: number;
  readonly currentDailyTotalUsd: number;

  constructor(input: {
    cap: 'per-order' | 'daily';
    capLimitUsd: number;
    attemptedNotionalUsd: number;
    currentDailyTotalUsd: number;
  }) {
    super(
      `Demo cap "${input.cap}" exceeded: ` +
      `attempt=${input.attemptedNotionalUsd.toFixed(2)} USD, ` +
      `cap=${input.capLimitUsd.toFixed(2)} USD, ` +
      `dailyTotal=${input.currentDailyTotalUsd.toFixed(2)} USD.`,
    );
    this.name = 'DemoCapExceededError';
    this.cap = input.cap;
    this.capLimitUsd = input.capLimitUsd;
    this.attemptedNotionalUsd = input.attemptedNotionalUsd;
    this.currentDailyTotalUsd = input.currentDailyTotalUsd;
  }
}

/**
 * Thrown by `TradingModule` when the USD notional of a market order cannot
 * be resolved. Market orders never carry a `price`, so the SDK needs either
 * an injected `notionalSizer`, an `INSTRUMENT_MAP.referencePriceUsd` via the
 * `symbolReferencePriceUsd` hook, or an explicit limit-order `price`. When
 * none are available we refuse the order rather than letting the cap math
 * silently treat a unit count as a USD figure.
 */
export class MissingNotionalError extends Error {
  readonly symbol: string;
  readonly attemptedAmount: number;
  readonly reason: string;

  constructor(input: {
    symbol: string;
    attemptedAmount: number;
    reason: string;
  }) {
    super(
      `Cannot resolve USD notional for order on symbol "${input.symbol}" ` +
      `(amount=${input.attemptedAmount}): ${input.reason}. ` +
      `Provide a limit-order price, a notionalSizer, or a ` +
      `symbolReferencePriceUsd hook with a reference price for the symbol.`,
    );
    this.name = 'MissingNotionalError';
    this.symbol = input.symbol;
    this.attemptedAmount = input.attemptedAmount;
    this.reason = input.reason;
  }
}
