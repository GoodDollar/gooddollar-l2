import { AxiosInstance } from 'axios';
import { AuditLogger } from './audit-logger';
import { AccountBalance, Position } from './types';

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

export class AccountModule {
  private readonly http: AxiosInstance;
  private readonly audit: AuditLogger;

  constructor(http: AxiosInstance, audit: AuditLogger) {
    this.http = http;
    this.audit = audit;
  }

  async getBalance(): Promise<AccountBalance> {
    const start = Date.now();
    const endpoint = '/account/balance';
    try {
      const response = await this.http.get(endpoint);
      const data = asRecord(response.data);

      const balance: AccountBalance = {
        totalEquity: pickNum(data, 'totalEquity', 'total_equity', 'equity'),
        availableCash: pickNum(data, 'availableCash', 'available_cash', 'cash', 'available'),
        usedMargin: pickNum(data, 'usedMargin', 'used_margin', 'margin'),
        freeMargin: pickNum(data, 'freeMargin', 'free_margin'),
        currency: pickStr(data, 'currency') || 'USD',
      };

      if (balance.freeMargin === 0 && balance.totalEquity > 0) {
        balance.freeMargin = balance.totalEquity - balance.usedMargin;
      }

      this.audit.log({
        action: 'getBalance',
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return balance;
    } catch (error) {
      this.logError('getBalance', 'GET', endpoint, start, error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    const start = Date.now();
    const endpoint = '/account/positions';
    try {
      const response = await this.http.get(endpoint);
      const items = extractArray(response.data);
      const positions = items.map((r) => normalizePosition(asRecord(r)));

      this.audit.log({
        action: 'getPositions',
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return positions;
    } catch (error) {
      this.logError('getPositions', 'GET', endpoint, start, error);
      throw error;
    }
  }

  async getPendingOrders(): Promise<PendingOrder[]> {
    const start = Date.now();
    const endpoint = '/account/orders/pending';
    try {
      const response = await this.http.get(endpoint);
      const items = extractArray(response.data);
      const orders = items.map((r) => normalizePendingOrder(asRecord(r)));

      this.audit.log({
        action: 'getPendingOrders',
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return orders;
    } catch (error) {
      this.logError('getPendingOrders', 'GET', endpoint, start, error);
      throw error;
    }
  }

  async getPortfolioPnl(): Promise<PortfolioPnl> {
    const start = Date.now();
    const endpoint = '/account/pnl';
    try {
      const response = await this.http.get(endpoint);
      const data = asRecord(response.data);

      const pnl: PortfolioPnl = {
        realized: pickNum(data, 'realized', 'realizedPnl', 'realized_pnl'),
        unrealized: pickNum(data, 'unrealized', 'unrealizedPnl', 'unrealized_pnl'),
        fees: pickNum(data, 'fees', 'totalFees', 'total_fees'),
        overnightFees: pickNum(data, 'overnightFees', 'overnight_fees', 'swapFees'),
        dividends: pickNum(data, 'dividends', 'totalDividends'),
      };

      this.audit.log({
        action: 'getPortfolioPnl',
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return pnl;
    } catch (error) {
      this.logError('getPortfolioPnl', 'GET', endpoint, start, error);
      throw error;
    }
  }

  async getMarginInfo(instrumentId: string): Promise<MarginInfo> {
    const start = Date.now();
    const endpoint = `/account/margin/${instrumentId}`;
    try {
      const response = await this.http.get(endpoint);
      const data = asRecord(response.data);

      const info: MarginInfo = {
        instrumentId,
        symbol: pickStr(data, 'symbol', 'ticker') || '',
        maxLeverage: pickNum(data, 'maxLeverage', 'max_leverage') || 1,
        marginRequired: pickNum(data, 'marginRequired', 'margin_required', 'initialMargin'),
        maintenanceMargin: pickNum(data, 'maintenanceMargin', 'maintenance_margin', 'mmr'),
      };

      this.audit.log({
        action: 'getMarginInfo',
        method: 'GET',
        path: endpoint,
        statusCode: response.status,
        durationMs: Date.now() - start,
      });

      return info;
    } catch (error) {
      this.logError('getMarginInfo', 'GET', endpoint, start, error);
      throw error;
    }
  }

  private logError(action: string, method: string, path: string, start: number, error: unknown): void {
    const msg = error instanceof Error ? error.message : String(error);
    this.audit.log({ action, method, path, durationMs: Date.now() - start, error: msg });
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

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'items', 'positions', 'orders', 'results']) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
  }
  return [];
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
