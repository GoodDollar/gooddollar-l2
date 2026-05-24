import { AxiosInstance } from 'axios';
import { AuditLogger } from './audit-logger';
import { DemoCapEnforcer, computeNotionalUsd } from './demo-cap-enforcer';
import { assertDemoModeOrThrow } from './safety';
import { EtoroMode, OrderRequest, OrderResult, Position } from './types';

export interface LimitOrderRequest extends OrderRequest {
  type: 'limit' | 'stop';
  price: number;
  /** Time-in-force: 'GTC' (default), 'DAY', 'IOC' */
  timeInForce?: 'GTC' | 'DAY' | 'IOC';
}

export interface TradingModuleOptions {
  /** Active eToro mode — gates the source-level safety fence. */
  mode?: EtoroMode;
  /** Optional cap enforcer; constructed from env defaults if omitted. */
  capEnforcer?: DemoCapEnforcer;
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

export class TradingModule {
  private readonly http: AxiosInstance;
  private readonly audit: AuditLogger;
  private readonly mode: EtoroMode;
  private readonly capEnforcer: DemoCapEnforcer;

  constructor(http: AxiosInstance, audit: AuditLogger, opts: TradingModuleOptions = {}) {
    this.http = http;
    this.audit = audit;
    this.mode = opts.mode ?? 'sandbox';
    this.capEnforcer = opts.capEnforcer ?? new DemoCapEnforcer();
  }

  /** Exposed for proof reporting; not for cap logic. */
  getCapState(): ReturnType<DemoCapEnforcer['getState']> {
    return this.capEnforcer.getState();
  }

  private enforcePreTrade(action: string, notional: number): void {
    assertDemoModeOrThrow(this.mode);
    try {
      this.capEnforcer.check(notional, action);
    } catch (err) {
      const baseMsg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string }).code;
      this.audit.log({
        action,
        method: 'POST',
        path: '/trading/orders',
        durationMs: 0,
        error: code ? `[${code}] ${baseMsg}` : baseMsg,
      });
      throw err;
    }
  }

  async openPosition(order: OrderRequest): Promise<OrderResult> {
    const start = Date.now();
    const notional = computeNotionalUsd({
      amount: order.amount,
      leverage: order.leverage,
    });
    this.enforcePreTrade('openPosition', notional);
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

      this.audit.log({
        action: 'openPosition',
        method: 'POST',
        path: '/trading/orders',
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return result;
    } catch (error) {
      this.logError('openPosition', 'POST', '/trading/orders', start, error);
      throw this.wrapError(error, 'openPosition');
    }
  }

  async placeLimitOrder(order: LimitOrderRequest): Promise<OrderResult> {
    const start = Date.now();
    const notional = computeNotionalUsd({
      amount: order.amount,
      price: order.price,
      leverage: order.leverage,
    });
    this.enforcePreTrade('placeLimitOrder', notional);
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

      this.audit.log({
        action: 'placeLimitOrder',
        method: 'POST',
        path: '/trading/orders',
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return result;
    } catch (error) {
      this.logError('placeLimitOrder', 'POST', '/trading/orders', start, error);
      throw this.wrapError(error, 'placeLimitOrder');
    }
  }

  async closePosition(positionId: string): Promise<OrderResult> {
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
