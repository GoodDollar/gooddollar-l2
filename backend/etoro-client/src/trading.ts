import { AxiosInstance } from 'axios';
import { AuditLogger } from './audit-logger';
import { REAL_TRADING_ENABLED } from './auth';
import { DemoCapEnforcer, computeOrderNotionalUsd } from './cap-enforcer';
import {
  DemoCapExceededError,
  InvalidOrderError,
  MissingNotionalError,
  RealTradingDisabledError,
} from './errors';
import { EtoroMode, OrderRequest, OrderResult, Position } from './types';

/** Source label for the resolved USD notional, recorded in the audit log. */
export type NotionalSource = 'sizer' | 'limit-price' | 'live-quote' | 'reference-fallback';

export interface ResolvedNotional {
  usd: number;
  source: NotionalSource;
  /** Age in ms of the live quote used (only when `source === 'live-quote'`). */
  quoteAgeMs?: number;
}

/** Default freshness window for live quotes used in notional resolution. */
export const DEFAULT_MAX_QUOTE_AGE_MS = 60_000;

export interface LiveQuoteSnapshot {
  mid: number;
  timestamp: number;
}

export interface LimitOrderRequest extends OrderRequest {
  type: 'limit' | 'stop';
  price: number;
  /** Time-in-force: 'GTC' (default), 'DAY', 'IOC' */
  timeInForce?: 'GTC' | 'DAY' | 'IOC';
}

export interface TradeHistoryEntry {
  orderId: string;
  positionId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  executionPrice: number;
  fee: number;
  timestamp: number;
  status: 'filled' | 'cancelled' | 'expired';
}

export interface TradingModuleOptions {
  /** SDK mode the module is operating in. Defaults to `mock`. */
  mode?: EtoroMode;
  /**
   * Demo cap enforcer. REQUIRED for `demo-trading` mode unless the test-only
   * escape hatch `disableCapsForTestsOnly` is set; for read-only or mock
   * modes the field is optional.
   */
  capEnforcer?: DemoCapEnforcer;
  /**
   * Highest-priority hook for computing the USD notional. If it returns a
   * finite positive number it is used directly (escape hatch for callers
   * that want live oracle prices or pre-computed sizing).
   */
  notionalSizer?: (order: OrderRequest) => number;
  /**
   * Reference-price hook used as a degraded fallback for market orders
   * when no `notionalSizer` yields a value, the order does not carry a
   * `price`, AND no fresh `liveQuoteSource` snapshot is available.
   * Returning `undefined` for unknown symbols causes the SDK to throw
   * `MissingNotionalError` instead of silently treating the unit count as
   * USD. The default `EtoroClient` wires this to the lane's
   * `INSTRUMENT_MAP.referencePriceUsd` constants — which are frozen
   * literals and therefore inherently stale; prefer `liveQuoteSource`.
   */
  symbolReferencePriceUsd?: (symbol: string) => number | undefined;
  /**
   * Live-quote hook consulted ahead of the reference-price fallback. If
   * it returns `{ mid, timestamp }` with `mid > 0` and the timestamp is
   * within `maxQuoteAgeMs` of `Date.now()`, market-order notionals are
   * sized as `mid * amount` and audit-logged with
   * `notionalSource: 'live-quote'` plus a numeric `quoteAgeMs`.
   *
   * The default `EtoroClient` wires this to `marketData.getCachedQuote`
   * so the SDK's most recently observed quote drives sizing instead of
   * the hardcoded reference price.
   */
  liveQuoteSource?: (symbol: string) => LiveQuoteSnapshot | undefined;
  /**
   * Freshness window (ms) for `liveQuoteSource` snapshots. Quotes older
   * than this fall through to the reference fallback. Default 60 s.
   */
  maxQuoteAgeMs?: number;
  /**
   * Optional guardrail: when set, a market order is rejected with
   * `DemoCapExceededError({ cap: 'reference-drift' })` whenever the live
   * quote and the reference price diverge by more than this ratio
   * (absolute, `|live - ref| / ref`). Unset means "no drift check".
   */
  maxReferenceDriftRatio?: number;
  /**
   * Test-only escape hatch. When set, allows constructing a
   * `TradingModule` in `demo-trading` mode without a `DemoCapEnforcer`.
   * Every mutating call audit-logs a `caps-disabled` warning line so the
   * choice is visible at every order, not just at startup. NEVER set by
   * `EtoroClient`; NEVER readable from env. Reserved for unit tests that
   * intentionally test trading-fence or HTTP behavior without caps.
   *
   * See `docs/ETORO_GOODCHAIN_ADAPTER.md` for the operator-facing rule.
   */
  disableCapsForTestsOnly?: boolean;
}

/**
 * Canonical error message used by both the constructor-time check and the
 * runtime `assertCapOk` belt-and-suspenders guard. Kept as an export so
 * operators can grep audit logs / stack traces for a single string.
 */
export const DEMO_CAP_ENFORCER_REQUIRED_MSG =
  'DemoCapEnforcer required for demo-trading mode. ' +
  'Pass `capEnforcer` when constructing TradingModule, or use EtoroClient ' +
  'which wires one automatically. The `disableCapsForTestsOnly` flag is ' +
  'reserved for unit tests only.';

/**
 * TradingModule owns the source-level real-trading fence and the demo cap
 * enforcement. Every mutating method is gated by `assertTradingEnabled()`,
 * which throws `RealTradingDisabledError` for any mode that is not
 * `demo-trading`. In `demo-trading` mode, `assertCapOk()` consults the
 * `DemoCapEnforcer` and throws `DemoCapExceededError` before any HTTP call.
 */
export class TradingModule {
  private readonly http: AxiosInstance;
  private readonly audit: AuditLogger;
  private readonly mode: EtoroMode;
  private readonly capEnforcer?: DemoCapEnforcer;
  private readonly notionalSizer?: (order: OrderRequest) => number;
  private readonly symbolReferencePriceUsd?: (symbol: string) => number | undefined;
  private readonly liveQuoteSource?: (symbol: string) => LiveQuoteSnapshot | undefined;
  private readonly maxQuoteAgeMs: number;
  private readonly maxReferenceDriftRatio?: number;
  private readonly clock: () => number;
  private readonly disableCapsForTestsOnly: boolean;

  constructor(http: AxiosInstance, audit: AuditLogger, options: TradingModuleOptions = {}) {
    const mode = options.mode ?? 'mock';
    const disableCapsForTestsOnly = options.disableCapsForTestsOnly === true;

    // Loud refusal: caps cannot be silently omitted in demo-trading mode.
    if (mode === 'demo-trading' && !options.capEnforcer && !disableCapsForTestsOnly) {
      throw new Error(DEMO_CAP_ENFORCER_REQUIRED_MSG);
    }

    this.http = http;
    this.audit = audit;
    this.mode = mode;
    this.capEnforcer = options.capEnforcer;
    this.notionalSizer = options.notionalSizer;
    this.symbolReferencePriceUsd = options.symbolReferencePriceUsd;
    this.liveQuoteSource = options.liveQuoteSource;
    this.maxQuoteAgeMs = options.maxQuoteAgeMs ?? DEFAULT_MAX_QUOTE_AGE_MS;
    this.maxReferenceDriftRatio = options.maxReferenceDriftRatio;
    this.clock = Date.now;
    this.disableCapsForTestsOnly = disableCapsForTestsOnly;
  }

  getMode(): EtoroMode {
    return this.mode;
  }

  async openPosition(order: OrderRequest): Promise<OrderResult> {
    this.validateOrder(order, { kind: 'market', action: 'openPosition' });
    this.assertTradingEnabled('openPosition');
    this.noteCapsDisabledIfActive('openPosition');
    const notional = this.computeNotional(order);
    this.assertCapOk('openPosition', notional.usd);

    const start = Date.now();
    try {
      const response = await this.http.post('/trading/orders', {
        instrumentId: order.instrumentId,
        symbol: order.symbol,
        side: order.side,
        amount: order.amount,
        leverage: order.leverage ?? 1,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
        type: 'market',
      });

      const data = asRecord(response.data);
      const result = this.normalizeOrderResult(data);

      this.recordCap(notional.usd);
      this.audit.log({
        action: 'openPosition',
        method: 'POST',
        path: '/trading/orders',
        statusCode: response.status,
        durationMs: Date.now() - start,
        resolvedNotionalUsd: notional.usd,
        notionalSource: notional.source,
      });

      return result;
    } catch (error) {
      this.logError('openPosition', 'POST', '/trading/orders', start, error);
      throw this.wrapError(error, 'openPosition');
    }
  }

  async placeLimitOrder(order: LimitOrderRequest): Promise<OrderResult> {
    this.validateOrder(order, { kind: 'limit', action: 'placeLimitOrder' });
    this.assertTradingEnabled('placeLimitOrder');
    this.noteCapsDisabledIfActive('placeLimitOrder');
    const notional = this.computeNotional(order);
    this.assertCapOk('placeLimitOrder', notional.usd);

    const start = Date.now();
    try {
      const response = await this.http.post('/trading/orders', {
        instrumentId: order.instrumentId,
        symbol: order.symbol,
        side: order.side,
        amount: order.amount,
        leverage: order.leverage ?? 1,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
        type: order.type,
        price: order.price,
        timeInForce: order.timeInForce ?? 'GTC',
      });

      const data = asRecord(response.data);
      const result = this.normalizeOrderResult(data);

      this.recordCap(notional.usd);
      this.audit.log({
        action: 'placeLimitOrder',
        method: 'POST',
        path: '/trading/orders',
        statusCode: response.status,
        durationMs: Date.now() - start,
        resolvedNotionalUsd: notional.usd,
        notionalSource: notional.source,
      });

      return result;
    } catch (error) {
      this.logError('placeLimitOrder', 'POST', '/trading/orders', start, error);
      throw this.wrapError(error, 'placeLimitOrder');
    }
  }

  async closePosition(positionId: string): Promise<OrderResult> {
    this.validateIdString(positionId, 'positionId', 'closePosition');
    this.assertTradingEnabled('closePosition');
    this.noteCapsDisabledIfActive('closePosition');

    const start = Date.now();
    const endpoint = `/trading/positions/${positionId}/close`;
    try {
      const response = await this.http.post(endpoint);
      const data = asRecord(response.data);
      const result = this.normalizeOrderResult(data);

      this.audit.log({
        action: 'closePosition',
        method: 'POST',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return result;
    } catch (error) {
      this.logError('closePosition', 'POST', endpoint, start, error);
      throw this.wrapError(error, 'closePosition');
    }
  }

  async partialClose(positionId: string, amount: number): Promise<OrderResult> {
    this.validateIdString(positionId, 'positionId', 'partialClose');
    this.validatePositiveAmount(amount, 'amount', 'partialClose');
    this.assertTradingEnabled('partialClose');
    this.noteCapsDisabledIfActive('partialClose');

    const start = Date.now();
    const endpoint = `/trading/positions/${positionId}/close`;
    try {
      const response = await this.http.post(endpoint, { amount });
      const data = asRecord(response.data);
      const result = this.normalizeOrderResult(data);

      this.audit.log({
        action: 'partialClose',
        method: 'POST',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return result;
    } catch (error) {
      this.logError('partialClose', 'POST', endpoint, start, error);
      throw this.wrapError(error, 'partialClose');
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.validateIdString(orderId, 'orderId', 'cancelOrder');
    this.assertTradingEnabled('cancelOrder');
    this.noteCapsDisabledIfActive('cancelOrder');

    const start = Date.now();
    const endpoint = `/trading/orders/${orderId}`;
    try {
      const response = await this.http.delete(endpoint);

      this.audit.log({
        action: 'cancelOrder',
        method: 'DELETE',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      this.logError('cancelOrder', 'DELETE', endpoint, start, error);
      throw this.wrapError(error, 'cancelOrder');
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult> {
    const start = Date.now();
    const endpoint = `/trading/orders/${orderId}`;
    try {
      const response = await this.http.get(endpoint);
      const data = asRecord(response.data);
      const result = this.normalizeOrderResult(data);

      this.audit.log({
        action: 'getOrderStatus',
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return result;
    } catch (error) {
      this.logError('getOrderStatus', 'GET', endpoint, start, error);
      throw this.wrapError(error, 'getOrderStatus');
    }
  }

  async getOpenPositions(): Promise<Position[]> {
    const start = Date.now();
    const endpoint = '/trading/positions';
    try {
      const response = await this.http.get(endpoint);
      const items = extractArray(response.data);
      const positions = items.map((r) => this.normalizePosition(asRecord(r)));

      this.audit.log({
        action: 'getOpenPositions',
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return positions;
    } catch (error) {
      this.logError('getOpenPositions', 'GET', endpoint, start, error);
      throw this.wrapError(error, 'getOpenPositions');
    }
  }

  async getTradeHistory(limit = 50): Promise<TradeHistoryEntry[]> {
    const start = Date.now();
    const endpoint = `/trading/history?limit=${limit}`;
    try {
      const response = await this.http.get(endpoint);
      const items = extractArray(response.data);
      const trades = items.map((r) => this.normalizeTradeHistory(asRecord(r)));

      this.audit.log({
        action: 'getTradeHistory',
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return trades;
    } catch (error) {
      this.logError('getTradeHistory', 'GET', endpoint, start, error);
      throw this.wrapError(error, 'getTradeHistory');
    }
  }

  /**
   * Source-level fence. Trading is permitted only when:
   *   - mode === 'demo-trading' (the only mode that addresses the demo
   *     trading endpoint), AND
   *   - REAL_TRADING_ENABLED === false (which is hardcoded). The check is
   *     phrased so that a future flip to true on real-disabled would still
   *     refuse demo-trading without code change here.
   *
   * Every other mode (`mock`, `demo-readonly`, `real-disabled`) throws.
   */
  private assertTradingEnabled(action: string): void {
    if (this.mode === 'demo-trading' && REAL_TRADING_ENABLED === false) {
      return;
    }
    throw new RealTradingDisabledError(action, this.mode);
  }

  /**
   * Hand-written validator. Runs BEFORE the trading fence and cap check so
   * caller-fixable errors take precedence over environmental ones; the
   * trading fence still catches anything that bypasses this method.
   *
   * Audit log carries only the field name and a short primitive reason —
   * never the raw request body — so secrets cannot leak via PRE-CHECK lines.
   */
  private validateOrder(
    order: OrderRequest | LimitOrderRequest,
    ctx: { kind: 'market' | 'limit'; action: string },
  ): void {
    const fail = (field: string, reason: string): never => {
      this.audit.log({
        action: ctx.action,
        method: 'PRE-CHECK',
        path: '/validation',
        error: `InvalidOrderError: field=${field} reason=${reason}`,
      });
      throw new InvalidOrderError({ field, reason });
    };

    if (typeof order.symbol !== 'string' || order.symbol.trim() === '') {
      fail('symbol', 'must be a non-empty string');
    }
    if (typeof order.instrumentId !== 'string' || order.instrumentId.trim() === '') {
      fail('instrumentId', 'must be a non-empty string');
    }
    if (order.side !== 'buy' && order.side !== 'sell') {
      fail('side', "must be 'buy' or 'sell'");
    }
    if (!Number.isFinite(order.amount) || order.amount <= 0) {
      fail('amount', 'must be a finite number > 0');
    }
    if (order.leverage !== undefined
      && (!Number.isFinite(order.leverage) || order.leverage <= 0)) {
      fail('leverage', 'must be a finite number > 0 when provided');
    }
    if (order.stopLoss !== undefined
      && (!Number.isFinite(order.stopLoss) || order.stopLoss <= 0)) {
      fail('stopLoss', 'must be a finite number > 0 when provided');
    }
    if (order.takeProfit !== undefined
      && (!Number.isFinite(order.takeProfit) || order.takeProfit <= 0)) {
      fail('takeProfit', 'must be a finite number > 0 when provided');
    }

    if (ctx.kind === 'limit') {
      const lim = order as LimitOrderRequest;
      if (typeof lim.price !== 'number' || !Number.isFinite(lim.price) || lim.price <= 0) {
        fail('price', 'must be a finite number > 0 for limit/stop orders');
      }
      if (lim.type !== 'limit' && lim.type !== 'stop') {
        fail('type', "must be 'limit' or 'stop'");
      }
      if (lim.timeInForce !== undefined
        && lim.timeInForce !== 'GTC'
        && lim.timeInForce !== 'DAY'
        && lim.timeInForce !== 'IOC') {
        fail('timeInForce', "must be 'GTC', 'DAY', or 'IOC'");
      }
    }
  }

  private validateIdString(value: string, field: string, action: string): void {
    if (typeof value !== 'string' || value.trim() === '') {
      this.audit.log({
        action,
        method: 'PRE-CHECK',
        path: '/validation',
        error: `InvalidOrderError: field=${field} reason=must be a non-empty string`,
      });
      throw new InvalidOrderError({
        field,
        reason: 'must be a non-empty string',
      });
    }
  }

  private validatePositiveAmount(value: number, field: string, action: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      this.audit.log({
        action,
        method: 'PRE-CHECK',
        path: '/validation',
        error: `InvalidOrderError: field=${field} reason=must be a finite number > 0`,
      });
      throw new InvalidOrderError({
        field,
        reason: 'must be a finite number > 0',
      });
    }
  }

  private assertCapOk(action: string, notional: number): void {
    if (!this.capEnforcer) {
      // Belt-and-suspenders: constructor already guards this in
      // demo-trading mode, but if a future refactor strips that throw the
      // runtime path still refuses to send orders without caps.
      if (this.mode === 'demo-trading' && !this.disableCapsForTestsOnly) {
        throw new Error(DEMO_CAP_ENFORCER_REQUIRED_MSG);
      }
      return;
    }
    const err = this.capEnforcer.wouldExceed(notional);
    if (err) {
      this.audit.log({
        action,
        method: 'PRE-CHECK',
        path: '/cap-enforcer',
        error: `${err.name}: cap=${err.cap} limit=${err.capLimitUsd} attempt=${err.attemptedNotionalUsd}`,
      });
      throw err;
    }
  }

  /**
   * Audit-log one `caps-disabled` line per mutating call when the test-only
   * escape hatch is active. Makes the choice visible at every order, not
   * just at construction.
   */
  private noteCapsDisabledIfActive(action: string): void {
    if (this.disableCapsForTestsOnly) {
      this.audit.log({
        action,
        method: 'PRE-CHECK',
        path: '/cap-enforcer',
        error: 'caps-disabled: disableCapsForTestsOnly=true — cap check skipped',
      });
    }
  }

  private recordCap(notional: number): void {
    if (this.capEnforcer && notional > 0) {
      this.capEnforcer.recordOrder(notional);
    }
  }

  /**
   * Resolution order:
   *   1. `notionalSizer(order)` if it yields a finite positive USD value.
   *   2. `order.price * order.amount` for limit/stop orders.
   *   3. `symbolReferencePriceUsd(order.symbol) * order.amount` for market
   *      orders on known symbols.
   *   4. Throw `MissingNotionalError` — never silently treat a unit count
   *      as USD.
   */
  private computeNotional(order: OrderRequest | LimitOrderRequest): ResolvedNotional {
    if (this.notionalSizer) {
      const sized = this.notionalSizer(order);
      if (Number.isFinite(sized) && sized > 0) {
        return { usd: sized, source: 'sizer' };
      }
    }

    const hasLimitPrice = 'price' in order
      && typeof order.price === 'number'
      && Number.isFinite(order.price)
      && order.price > 0;
    if (hasLimitPrice) {
      const usd = computeOrderNotionalUsd({
        price: (order as LimitOrderRequest).price,
        amount: order.amount,
      });
      if (usd !== null && usd > 0) {
        return { usd, source: 'limit-price' };
      }
    }

    if (this.symbolReferencePriceUsd && Number.isFinite(order.amount) && order.amount > 0) {
      const ref = this.symbolReferencePriceUsd(order.symbol);
      if (typeof ref === 'number' && Number.isFinite(ref) && ref > 0) {
        return { usd: ref * order.amount, source: 'reference' };
      }
    }

    throw new MissingNotionalError({
      symbol: order.symbol,
      attemptedAmount: order.amount,
      reason: hasLimitPrice
        ? 'price * amount produced a non-positive notional'
        : 'no notionalSizer match, no order.price, and no symbolReferencePriceUsd for the symbol',
    });
  }

  private normalizeOrderResult(data: Record<string, unknown>): OrderResult {
    return {
      orderId: pickStr(data, 'orderId', 'order_id', 'id') || 'unknown',
      positionId: pickStr(data, 'positionId', 'position_id') || '',
      symbol: pickStr(data, 'symbol', 'ticker') || '',
      side: (pickStr(data, 'side', 'direction') || 'buy') as 'buy' | 'sell',
      amount: pickNum(data, 'amount', 'units', 'quantity'),
      executionPrice: pickNum(data, 'executionPrice', 'execution_price', 'price', 'avgPrice'),
      timestamp: pickTimestamp(data),
      status: normalizeStatus(pickStr(data, 'status', 'state')),
    };
  }

  private normalizePosition(data: Record<string, unknown>): Position {
    const openPrice = pickNum(data, 'openPrice', 'open_price', 'entryPrice', 'avgOpenPrice');
    const currentPrice = pickNum(data, 'currentPrice', 'current_price', 'markPrice', 'lastPrice');
    const amount = pickNum(data, 'amount', 'units', 'quantity');
    const sideStr = pickStr(data, 'side', 'direction') || 'buy';
    const multiplier = sideStr === 'sell' ? -1 : 1;
    const rawPnl = pickNum(data, 'pnl', 'profit', 'unrealizedPnl');
    const pnl = rawPnl !== 0 ? rawPnl : (currentPrice - openPrice) * amount * multiplier;

    return {
      positionId: pickStr(data, 'positionId', 'position_id', 'id') || 'unknown',
      instrumentId: pickStr(data, 'instrumentId', 'instrument_id') || '',
      symbol: pickStr(data, 'symbol', 'ticker') || '',
      side: sideStr as 'buy' | 'sell',
      amount,
      openPrice,
      currentPrice,
      pnl,
      leverage: pickNum(data, 'leverage') || 1,
      openTimestamp: pickTimestamp(data, 'openTimestamp', 'open_timestamp', 'openDate', 'created_at'),
    };
  }

  private normalizeTradeHistory(data: Record<string, unknown>): TradeHistoryEntry {
    return {
      orderId: pickStr(data, 'orderId', 'order_id', 'id') || 'unknown',
      positionId: pickStr(data, 'positionId', 'position_id') || '',
      symbol: pickStr(data, 'symbol', 'ticker') || '',
      side: (pickStr(data, 'side', 'direction') || 'buy') as 'buy' | 'sell',
      amount: pickNum(data, 'amount', 'units', 'quantity'),
      executionPrice: pickNum(data, 'executionPrice', 'execution_price', 'price'),
      fee: pickNum(data, 'fee', 'commission', 'spread_fee'),
      timestamp: pickTimestamp(data),
      status: normalizeHistoryStatus(pickStr(data, 'status', 'state')),
    };
  }

  private logError(action: string, method: string, path: string, start: number, error: unknown): void {
    const msg = error instanceof Error ? error.message : String(error);
    this.audit.log({ action, method, path, durationMs: Date.now() - start, error: msg });
  }

  private wrapError(error: unknown, action: string): Error {
    if (error instanceof RealTradingDisabledError) return error;
    if (error instanceof DemoCapExceededError) return error;
    if (error instanceof MissingNotionalError) return error;
    if (error instanceof InvalidOrderError) return error;
    if (error instanceof Error) {
      const axErr = error as { response?: { data?: { errorCode?: string; message?: string } } };
      const code = axErr.response?.data?.errorCode;
      if (code === 'INSUFFICIENT_MARGIN') return new TradingError('Insufficient margin', code, error);
      if (code === 'INSTRUMENT_UNAVAILABLE') return new TradingError('Instrument unavailable', code, error);
      if (code === 'MARKET_CLOSED') return new TradingError('Market closed', code, error);
      if (code === 'POSITION_NOT_FOUND') return new TradingError('Position not found', code, error);
      if (code === 'ORDER_NOT_FOUND') return new TradingError('Order not found', code, error);
      return new TradingError(`${action} failed: ${error.message}`, code, error);
    }
    return new Error(`${action} failed: ${String(error)}`);
  }
}

export class TradingError extends Error {
  readonly code?: string;
  readonly cause?: Error;

  constructor(message: string, code?: string, cause?: Error) {
    super(message);
    this.name = 'TradingError';
    this.code = code;
    this.cause = cause;
  }
}

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v) return v;
  }
  return '';
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string') { const n = Number(v); if (isFinite(n)) return n; }
  }
  return 0;
}

function pickTimestamp(obj: Record<string, unknown>, ...extra: string[]): number {
  const keys = ['timestamp', 'time', 'executedAt', 'executed_at', 'createdAt', 'created_at', ...extra];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && v > 1_000_000_000) return v > 1e12 ? v : v * 1000;
    if (typeof v === 'string') { const d = Date.parse(v); if (!isNaN(d)) return d; }
  }
  return Date.now();
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'items', 'positions', 'trades', 'results', 'orders', 'history']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
  }
  return [];
}

function normalizeStatus(s: string): 'filled' | 'pending' | 'rejected' {
  const lower = s.toLowerCase();
  if (lower.includes('fill') || lower.includes('execut') || lower === 'completed') return 'filled';
  if (lower.includes('pend') || lower.includes('open') || lower === 'active') return 'pending';
  return 'rejected';
}

function normalizeHistoryStatus(s: string): 'filled' | 'cancelled' | 'expired' {
  const lower = s.toLowerCase();
  if (lower.includes('cancel')) return 'cancelled';
  if (lower.includes('expir')) return 'expired';
  return 'filled';
}
