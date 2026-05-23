import axios from 'axios';
import { TradingModule, TradingError, LimitOrderRequest } from '../trading';
import { AuditLogger } from '../audit-logger';
import { DemoCapEnforcer } from '../demo-cap-enforcer';

jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
}));

function mockHttp() {
  return axios.create({ baseURL: 'https://mock.etoro.com' });
}

function mockAudit() {
  return new AuditLogger('sandbox', '/dev/null');
}

function permissiveCap(): DemoCapEnforcer {
  return new DemoCapEnforcer({
    env: {
      MAX_DEMO_ORDER_NOTIONAL_USD: '1000000',
      MAX_DAILY_DEMO_NOTIONAL_USD: '100000000',
    },
  });
}

describe('TradingModule', () => {
  let http: ReturnType<typeof mockHttp>;
  let audit: ReturnType<typeof mockAudit>;
  let trading: TradingModule;

  beforeEach(() => {
    http = mockHttp();
    audit = mockAudit();
    trading = new TradingModule(http, audit, { mode: 'sandbox', capEnforcer: permissiveCap() });
  });

  describe('openPosition', () => {
    it('sends market order and returns normalized result', async () => {
      http.post = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          orderId: 'ORD-001',
          positionId: 'POS-001',
          symbol: 'AAPL',
          side: 'buy',
          amount: 10,
          executionPrice: 185.50,
          timestamp: 1700000000000,
          status: 'filled',
        },
      });

      const result = await trading.openPosition({
        symbol: 'AAPL',
        instrumentId: 'AAPL-US',
        side: 'buy',
        amount: 10,
      });

      expect(result.orderId).toBe('ORD-001');
      expect(result.symbol).toBe('AAPL');
      expect(result.executionPrice).toBe(185.50);
      expect(result.status).toBe('filled');
      expect(http.post).toHaveBeenCalledWith('/trading/orders', expect.objectContaining({
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
      }));
    });

    it('handles insufficient margin error', async () => {
      const err: Error & { response?: unknown } = new Error('Request failed');
      err.response = { data: { errorCode: 'INSUFFICIENT_MARGIN', message: 'Not enough margin' } };
      http.post = jest.fn().mockRejectedValue(err);

      await expect(trading.openPosition({
        symbol: 'AAPL',
        instrumentId: 'AAPL-US',
        side: 'buy',
        amount: 10,
      })).rejects.toThrow(TradingError);

      try {
        await trading.openPosition({
          symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy', amount: 10,
        });
      } catch (e) {
        expect(e).toBeInstanceOf(TradingError);
        expect((e as TradingError).code).toBe('INSUFFICIENT_MARGIN');
      }
    });

    it('handles market closed error', async () => {
      const err: Error & { response?: unknown } = new Error('Request failed');
      err.response = { data: { errorCode: 'MARKET_CLOSED' } };
      http.post = jest.fn().mockRejectedValue(err);

      await expect(trading.openPosition({
        symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy', amount: 10,
      })).rejects.toThrow('Market closed');
    });
  });

  describe('placeLimitOrder', () => {
    it('sends limit order with price and timeInForce', async () => {
      http.post = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          orderId: 'ORD-002',
          symbol: 'TSLA',
          status: 'pending',
          side: 'sell',
          amount: 5,
        },
      });

      const order: LimitOrderRequest = {
        symbol: 'TSLA',
        instrumentId: 'TSLA-US',
        side: 'sell',
        amount: 5,
        type: 'limit',
        price: 250.00,
        timeInForce: 'DAY',
      };

      const result = await trading.placeLimitOrder(order);
      expect(result.orderId).toBe('ORD-002');
      expect(result.status).toBe('pending');
      expect(http.post).toHaveBeenCalledWith('/trading/orders', expect.objectContaining({
        type: 'limit',
        price: 250.00,
        timeInForce: 'DAY',
      }));
    });
  });

  describe('closePosition', () => {
    it('closes position and returns result', async () => {
      http.post = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          orderId: 'ORD-003',
          positionId: 'POS-001',
          symbol: 'AAPL',
          side: 'sell',
          amount: 10,
          executionPrice: 190.00,
          status: 'completed',
        },
      });

      const result = await trading.closePosition('POS-001');
      expect(result.status).toBe('filled');
      expect(result.executionPrice).toBe(190.00);
      expect(http.post).toHaveBeenCalledWith('/trading/positions/POS-001/close');
    });
  });

  describe('partialClose', () => {
    it('partially closes with amount', async () => {
      http.post = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          orderId: 'ORD-004',
          positionId: 'POS-001',
          symbol: 'AAPL',
          amount: 5,
          status: 'filled',
        },
      });

      const result = await trading.partialClose('POS-001', 5);
      expect(result.amount).toBe(5);
      expect(http.post).toHaveBeenCalledWith('/trading/positions/POS-001/close', { amount: 5 });
    });
  });

  describe('cancelOrder', () => {
    it('cancels order via DELETE', async () => {
      http.delete = jest.fn().mockResolvedValue({ status: 200 });

      await trading.cancelOrder('ORD-002');
      expect(http.delete).toHaveBeenCalledWith('/trading/orders/ORD-002');
    });

    it('throws TradingError when order not found', async () => {
      const err: Error & { response?: unknown } = new Error('Not found');
      err.response = { data: { errorCode: 'ORDER_NOT_FOUND' } };
      http.delete = jest.fn().mockRejectedValue(err);

      await expect(trading.cancelOrder('ORD-999')).rejects.toThrow('Order not found');
    });
  });

  describe('getOrderStatus', () => {
    it('returns order status', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          orderId: 'ORD-001',
          symbol: 'AAPL',
          status: 'executed',
          executionPrice: 186.25,
        },
      });

      const result = await trading.getOrderStatus('ORD-001');
      expect(result.orderId).toBe('ORD-001');
      expect(result.status).toBe('filled');
    });
  });

  describe('getOpenPositions', () => {
    it('returns normalized positions', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          positions: [
            {
              id: 'POS-1',
              symbol: 'AAPL',
              side: 'buy',
              units: 10,
              open_price: 180,
              current_price: 190,
              leverage: 2,
            },
            {
              id: 'POS-2',
              symbol: 'TSLA',
              direction: 'sell',
              quantity: 5,
              entryPrice: 250,
              markPrice: 240,
              leverage: 1,
            },
          ],
        },
      });

      const positions = await trading.getOpenPositions();
      expect(positions).toHaveLength(2);
      expect(positions[0].symbol).toBe('AAPL');
      expect(positions[0].openPrice).toBe(180);
      expect(positions[0].pnl).toBe(100);
      expect(positions[1].symbol).toBe('TSLA');
      expect(positions[1].side).toBe('sell');
      expect(positions[1].pnl).toBe(50);
    });
  });

  describe('getTradeHistory', () => {
    it('returns trade history entries', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          trades: [
            {
              orderId: 'ORD-1',
              symbol: 'NVDA',
              side: 'buy',
              amount: 3,
              execution_price: 450.00,
              commission: 1.5,
              status: 'filled',
            },
          ],
        },
      });

      const trades = await trading.getTradeHistory(10);
      expect(trades).toHaveLength(1);
      expect(trades[0].symbol).toBe('NVDA');
      expect(trades[0].executionPrice).toBe(450.00);
      expect(trades[0].fee).toBe(1.5);
    });
  });
});

describe('TradingModule — demo caps', () => {
  function makeTrading(opts: { capEnv?: Record<string, string>; mode?: 'sandbox' | 'real' } = {}) {
    const http = mockHttp();
    const audit = mockAudit();
    const enforcer = new DemoCapEnforcer({ env: opts.capEnv ?? {} });
    return {
      http,
      audit,
      trading: new TradingModule(http, audit, {
        mode: opts.mode ?? 'sandbox',
        capEnforcer: enforcer,
      }),
    };
  }

  it('rejects openPosition over per-order cap WITHOUT hitting axios', async () => {
    const { http, trading } = makeTrading({ capEnv: { MAX_DEMO_ORDER_NOTIONAL_USD: '100' } });
    const postSpy = jest.spyOn(http, 'post');

    try {
      await trading.openPosition({
        symbol: 'AAPL',
        instrumentId: 'AAPL-US',
        side: 'buy',
        amount: 200,
      });
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(TradingError);
      expect((err as TradingError).code).toBe('DEMO_CAP_EXCEEDED');
    }
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('rejects placeLimitOrder over per-order cap using price * amount', async () => {
    const { http, trading } = makeTrading({ capEnv: { MAX_DEMO_ORDER_NOTIONAL_USD: '100' } });
    const postSpy = jest.spyOn(http, 'post');
    const order: LimitOrderRequest = {
      symbol: 'TSLA',
      instrumentId: 'TSLA-US',
      side: 'buy',
      amount: 1,
      type: 'limit',
      price: 200,
    };
    try {
      await trading.placeLimitOrder(order);
      fail('expected throw');
    } catch (err) {
      expect((err as TradingError).code).toBe('DEMO_CAP_EXCEEDED');
    }
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('rejects after daily cap is consumed across multiple orders', async () => {
    const { http, trading } = makeTrading({
      capEnv: { MAX_DEMO_ORDER_NOTIONAL_USD: '100', MAX_DAILY_DEMO_NOTIONAL_USD: '200' },
    });
    http.post = jest.fn().mockResolvedValue({
      status: 200,
      data: { orderId: 'O', symbol: 'AAPL', side: 'buy', status: 'filled' },
    });

    await trading.openPosition({ symbol: 'AAPL', instrumentId: 'A', side: 'buy', amount: 100 });
    await trading.openPosition({ symbol: 'AAPL', instrumentId: 'A', side: 'buy', amount: 100 });

    try {
      await trading.openPosition({ symbol: 'AAPL', instrumentId: 'A', side: 'buy', amount: 1 });
      fail('expected throw');
    } catch (err) {
      expect((err as TradingError).code).toBe('DEMO_DAILY_CAP_EXCEEDED');
    }
  });

  it('writes audit entry on cap rejection (network never reached)', async () => {
    const { audit, trading } = makeTrading({
      capEnv: { MAX_DEMO_ORDER_NOTIONAL_USD: '50' },
    });
    const logSpy = jest.spyOn(audit, 'log');
    await trading
      .openPosition({ symbol: 'AAPL', instrumentId: 'A', side: 'buy', amount: 100 })
      .catch(() => undefined);
    const calls = logSpy.mock.calls.map((c) => c[0]);
    const rejection = calls.find((c) => typeof c.error === 'string' && c.error.includes('DEMO_CAP'));
    expect(rejection).toBeDefined();
  });

  it('throws RealTradingDisabledError when mode=real even before caps', async () => {
    const { trading } = makeTrading({ mode: 'real' });
    await expect(
      trading.openPosition({ symbol: 'AAPL', instrumentId: 'A', side: 'buy', amount: 10 }),
    ).rejects.toThrow(/REAL_TRADING_ENABLED/);
  });
});
