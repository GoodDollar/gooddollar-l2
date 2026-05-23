import { AxiosInstance } from 'axios';
import { AuditLogger } from './audit-logger';
import { REAL_TRADING_ENABLED } from './auth';
import { DemoCapEnforcer, computeOrderNotionalUsd } from './cap-enforcer';
import {
  DemoCapExceededError,
  MissingNotionalError,
  RealTradingDisabledError,
} from './errors';
import { EtoroMode, OrderRequest, OrderResult, Position } from './types';

/** Source label for the resolved USD notional, recorded in the audit log. */
export type NotionalSource = 'sizer' | 'limit-price' | 'reference';

export interface ResolvedNotional {
  usd: number;
  source: NotionalSource;
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
  /** Optional cap enforcer; when omitted, a no-cap stub is wired for non-`demo-trading` modes. */
  capEnforcer?: DemoCapEnforcer;
  /**
   * Highest-priority hook for computing the USD notional. If it returns a
   * finite positive number it is used directly (escape hatch for callers
   * that want live oracle prices or pre-computed sizing).
   */
  notionalSizer?: (order: OrderRequest) => number;
  /**
   * Reference-price hook used for market orders when no `notionalSizer`
   * yields a value and the order does not carry a `price`. Returning
   * `undefined` for unknown symbols causes the SDK to throw
   * `MissingNotionalError` instead of silently treating the unit count as
   * USD. The default `EtoroClient` wires this to the lane's
   * `INSTRUMENT_MAP.referencePriceUsd`.
   */
  symbolReferencePriceUsd?: (symbol: string) => number | undefined;
}

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

  constructor(http: AxiosInstance, audit: AuditLogger, options: TradingModuleOptions = {}) {
    this.http = http;
    this.audit = audit;
    this.mode = options.mode ?? 'mock';
    this.capEnforcer = options.capEnforcer;
    this.notionalSizer = options.notionalSizer;
    this.symbolReferencePriceUsd = options.symbolReferencePriceUsd;
  }

  getMode(): EtoroMode {
    return this.mode;
  }

  async openPosition(order: OrderRequest): Promise<OrderResult> {
    this.assertTradingEnabled('openPosition');
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
    this.assertTradingEnabled('placeLimitOrder');
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
    this.assertTradingEnabled('closePosition');

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
    this.assertTradingEnabled('partialClose');

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
    this.assertTradingEnabled('cancelOrder');

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

  private assertCapOk(action: string, notional: number): void {
    if (!this.capEnforcer) return;
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
