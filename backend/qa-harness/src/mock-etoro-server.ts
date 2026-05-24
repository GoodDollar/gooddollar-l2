import { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';

export interface MockQuote {
  symbol: string;
  instrumentId: string;
  bid: number;
  ask: number;
  last: number;
  timestamp: number;
  sessionState?: string;
  assetClass?: string;
  currency?: string;
}

const DEFAULT_SEEDS: Record<string, MockQuote> = {
  AAPL: {
    symbol: 'AAPL',
    instrumentId: 'INST-AAPL',
    bid: 191.45,
    ask: 191.55,
    last: 191.5,
    timestamp: Date.now(),
    sessionState: 'open',
    assetClass: 'equity',
    currency: 'USD',
  },
  TSLA: {
    symbol: 'TSLA',
    instrumentId: 'INST-TSLA',
    bid: 178.25,
    ask: 178.35,
    last: 178.3,
    timestamp: Date.now(),
    sessionState: 'open',
    assetClass: 'equity',
    currency: 'USD',
  },
  NVDA: {
    symbol: 'NVDA',
    instrumentId: 'INST-NVDA',
    bid: 130.9,
    ask: 131.0,
    last: 130.95,
    timestamp: Date.now(),
    sessionState: 'open',
    assetClass: 'equity',
    currency: 'USD',
  },
};

export interface MockEtoroHandle {
  axios: AxiosInstance;
  adapter: MockAdapter;
  /** Seed or replace a quote (sets timestamp to now if not specified). */
  seedQuote: (symbol: string, partial: Partial<MockQuote>) => void;
  /** Backdate a single quote so it triggers the price-service stale filter. */
  backdateQuote: (symbol: string, ageMs: number) => void;
  /** Snapshot of orders the harness has been asked to place. */
  orders: Array<{ payload: Record<string, unknown>; orderId: string }>;
  /** Restore axios + remove all handlers. */
  stop: () => void;
}

let mockCounter = 0;

/**
 * Wraps an axios instance with handlers that replay realistic eToro responses
 * — `/auth/login`, `/sapi/quotes`, `/trading/orders` and friends.
 */
export function createMockEtoro(opts: { axios: AxiosInstance }): MockEtoroHandle {
  const { axios } = opts;
  const adapter = new MockAdapter(axios, { onNoMatch: 'passthrough' });

  const quotes: Record<string, MockQuote> = JSON.parse(JSON.stringify(DEFAULT_SEEDS));
  const orders: Array<{ payload: Record<string, unknown>; orderId: string }> = [];

  type Reply = [number, unknown];

  adapter.onPost('/auth/login').reply(
    (): Reply => [
      200,
      {
        accessToken: 'mock-token-' + ++mockCounter,
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
    ],
  );

  const quotesHandler = (): Reply => {
    const arr = Object.values(quotes).map((q) => ({ ...q }));
    return [200, { quotes: arr }];
  };
  adapter.onGet('/quotes').reply(quotesHandler);
  adapter.onGet('/sapi/quotes').reply(quotesHandler);

  const instrumentsHandler = (): Reply => {
    const arr = Object.values(quotes).map((q) => ({
      instrumentId: q.instrumentId,
      symbol: q.symbol,
      displayName: q.symbol,
      exchange: 'NASDAQ',
      currency: q.currency ?? 'USD',
      assetClass: q.assetClass ?? 'equity',
      minTradeSize: 0.01,
      maxLeverage: 5,
    }));
    return [200, { instruments: arr }];
  };
  adapter.onGet('/instruments').reply(instrumentsHandler);
  adapter.onGet('/sapi/instruments').reply(instrumentsHandler);

  adapter.onPost('/trading/orders').reply((config): Reply => {
    const payload: Record<string, unknown> = config.data ? JSON.parse(config.data) : {};
    const orderId = `mock-ord-${++mockCounter}`;
    orders.push({ payload, orderId });
    const sym = typeof payload.symbol === 'string' ? payload.symbol : '';
    return [
      200,
      {
        orderId,
        positionId: `mock-pos-${mockCounter}`,
        symbol: payload.symbol,
        side: payload.side,
        amount: payload.amount,
        executionPrice: quotes[sym]?.last ?? 0,
        timestamp: Date.now(),
        status: 'filled',
      },
    ];
  });

  adapter.onGet('/trading/positions').reply((): Reply => [200, { positions: [] }]);

  return {
    axios,
    adapter,
    orders,
    seedQuote(symbol, partial) {
      const base = quotes[symbol] ?? {
        symbol,
        instrumentId: `INST-${symbol}`,
        bid: 100,
        ask: 100.1,
        last: 100.05,
        timestamp: Date.now(),
      };
      quotes[symbol] = {
        ...base,
        ...partial,
        timestamp: partial.timestamp ?? Date.now(),
      };
    },
    backdateQuote(symbol, ageMs) {
      const existing = quotes[symbol];
      if (existing) {
        existing.timestamp = Date.now() - ageMs;
      }
    },
    stop() {
      adapter.restore();
    },
  };
}
