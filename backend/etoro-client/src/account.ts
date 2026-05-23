import { AxiosInstance } from 'axios';
import { AuditLogger } from './audit-logger';
import { AccountUnavailableError } from './errors';
import { HttpDispatcher, identityDispatcher } from './rate-limiter';
import { MalformedListSink, readListOrAudit } from './util/list-envelope';
import { AccountBalance, EtoroMode, Position } from './types';

export interface PendingOrder {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  type: 'limit' | 'stop';
  createdAt: number;
}

export interface MarginInfo {
  instrumentId: string;
  symbol: string;
  maxLeverage: number;
  marginRequired: number;
  maintenanceMargin: number;
}

export interface PortfolioPnl {
  realized: number;
  unrealized: number;
  fees: number;
  overnightFees: number;
  dividends: number;
}

export interface AccountModuleOptions {
  mode: EtoroMode;
  /**
   * HTTP dispatcher (typically `EtoroClient.withRateLimit`) so account
   * reads share the SDK's single rate-limit bucket. Defaults to a
   * no-retry pass-through for standalone unit-test construction.
   */
  dispatch?: HttpDispatcher;
  /**
   * If `true`, list-returning read methods (`getPositions`,
   * `getPendingOrders`) throw `MalformedListResponseError` on an
   * unrecognized envelope shape instead of returning `[]`. Defaults to
   * `false`; the audit-log line and counter still fire either way.
   */
  throwOnMalformedListResponse?: boolean;
}

export class AccountModule {
  private readonly http: AxiosInstance;
  private readonly audit: AuditLogger;
  private readonly mode: EtoroMode;
  private readonly dispatch: HttpDispatcher;
  private readonly malformedListSink: MalformedListSink;

  constructor(http: AxiosInstance, audit: AuditLogger, options: AccountModuleOptions) {
    this.http = http;
    this.audit = audit;
    this.mode = options.mode;
    this.dispatch = options.dispatch ?? identityDispatcher;
    this.malformedListSink = {
      audit: this.audit,
      counter: new Map<string, number>(),
      throwOnMalformed: options.throwOnMalformedListResponse ?? false,
    };
  }

  async getBalance(): Promise<AccountBalance> {
    return this.runRead('getBalance', '/account/balance', (data) => {
      const record = asRecord(data);
      const balance: AccountBalance = {
        totalEquity: pickNum(record, 'totalEquity', 'total_equity', 'equity'),
        availableCash: pickNum(record, 'availableCash', 'available_cash', 'cash', 'available'),
        usedMargin: pickNum(record, 'usedMargin', 'used_margin', 'margin'),
        freeMargin: pickNum(record, 'freeMargin', 'free_margin'),
        currency: pickStr(record, 'currency') || 'USD',
      };
      if (balance.freeMargin === 0 && balance.totalEquity > 0) {
        balance.freeMargin = balance.totalEquity - balance.usedMargin;
      }
      return balance;
    });
  }

  async getPositions(): Promise<Position[]> {
    const path = '/account/positions';
    return this.runRead('getPositions', path, (data) =>
      readListOrAudit({ data, action: 'getPositions', path, sink: this.malformedListSink })
        .map((r) => normalizePosition(asRecord(r))),
    );
  }

  async getPendingOrders(): Promise<PendingOrder[]> {
    const path = '/account/orders/pending';
    return this.runRead('getPendingOrders', path, (data) =>
      readListOrAudit({ data, action: 'getPendingOrders', path, sink: this.malformedListSink })
        .map((r) => normalizePendingOrder(asRecord(r))),
    );
  }

  /**
   * Count of 200-OK responses that returned an unrecognized envelope
   * shape for one of `AccountModule`'s list-returning methods.
   * Aggregated into `EtoroClient.getSummary().malformedListResponses`.
   */
  getMalformedListResponseCount(action: string): number {
    return this.malformedListSink.counter.get(action) ?? 0;
  }

  /** Snapshot of all malformed-list counters keyed by action. */
  getMalformedListResponseCounts(): Record<string, number> {
    return Object.fromEntries(this.malformedListSink.counter);
  }

  async getPortfolioPnl(): Promise<PortfolioPnl> {
    return this.runRead('getPortfolioPnl', '/account/pnl', (data) => {
      const record = asRecord(data);
      return {
        realized: pickNum(record, 'realized', 'realizedPnl', 'realized_pnl'),
        unrealized: pickNum(record, 'unrealized', 'unrealizedPnl', 'unrealized_pnl'),
        fees: pickNum(record, 'fees', 'totalFees', 'total_fees'),
        overnightFees: pickNum(record, 'overnightFees', 'overnight_fees', 'swapFees'),
        dividends: pickNum(record, 'dividends', 'totalDividends'),
      };
    });
  }

  async getMarginInfo(instrumentId: string): Promise<MarginInfo> {
    return this.runRead('getMarginInfo', `/account/margin/${instrumentId}`, (data) => {
      const record = asRecord(data);
      return {
        instrumentId,
        symbol: pickStr(record, 'symbol', 'ticker') || '',
        maxLeverage: pickNum(record, 'maxLeverage', 'max_leverage') || 1,
        marginRequired: pickNum(record, 'marginRequired', 'margin_required', 'initialMargin'),
        maintenanceMargin: pickNum(record, 'maintenanceMargin', 'maintenance_margin', 'mmr'),
      };
    });
  }

  /**
   * Single read-pipeline that every public method funnels through. Order
   * of operations is intentional:
   *   1. Mode-gate refusal (PRE-CHECK audit + typed error, no HTTP).
   *   2. Rate-limited HTTP via the injected dispatcher.
   *   3. Success audit (GET/200 + duration + retry telemetry).
   *   4. On failure: error audit (GET/duration + masked error message),
   *      rethrow.
   */
  private async runRead<T>(
    action: string,
    endpoint: string,
    parse: (data: unknown) => T,
  ): Promise<T> {
    this.assertAccountReachable(action);
    const start = Date.now();
    try {
      const { value: response, attempts, totalBackoffMs } =
        await this.dispatch(() => this.http.get(endpoint));
      const value = parse(response.data);
      this.audit.log({
        action,
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
        attempts,
        totalBackoffMs,
      });
      return value;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.audit.log({
        action,
        method: 'GET',
        path: endpoint,
        durationMs: Date.now() - start,
        error: msg,
      });
      throw error;
    }
  }

  private assertAccountReachable(action: string): void {
    if (this.mode !== 'mock') return;
    const error = new AccountUnavailableError({
      action,
      mode: this.mode,
      reason: 'Account API has no demo HTTP base in mock mode',
    });
    this.audit.log({
      action,
      method: 'PRE-CHECK',
      path: '/mode-gate',
      error: `AccountUnavailableError: ${error.message}`,
    });
    throw error;
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
  const keys = ['timestamp', 'openTimestamp', 'open_timestamp', 'createdAt', 'created_at', ...extra];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && v > 1_000_000_000) return v > 1e12 ? v : v * 1000;
    if (typeof v === 'string') { const d = Date.parse(v); if (!isNaN(d)) return d; }
  }
  return Date.now();
}

function normalizePosition(data: Record<string, unknown>): Position {
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
    openTimestamp: pickTimestamp(data),
  };
}

function normalizePendingOrder(data: Record<string, unknown>): PendingOrder {
  return {
    orderId: pickStr(data, 'orderId', 'order_id', 'id') || 'unknown',
    symbol: pickStr(data, 'symbol', 'ticker') || '',
    side: (pickStr(data, 'side', 'direction') || 'buy') as 'buy' | 'sell',
    amount: pickNum(data, 'amount', 'units', 'quantity'),
    price: pickNum(data, 'price', 'targetPrice', 'limitPrice'),
    type: (pickStr(data, 'type', 'orderType') || 'limit') as 'limit' | 'stop',
    createdAt: pickTimestamp(data),
  };
}
