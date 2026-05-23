import axios from 'axios';
import { AccountModule } from '../account';
import { AuditLogger } from '../audit-logger';

jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
}));

function mockHttp() {
  return axios.create({ baseURL: 'https://mock.etoro.com' });
}

function mockAudit() {
  return new AuditLogger('demo-readonly', '/dev/null');
}

describe('AccountModule', () => {
  let http: ReturnType<typeof mockHttp>;
  let audit: ReturnType<typeof mockAudit>;
  let account: AccountModule;

  beforeEach(() => {
    http = mockHttp();
    audit = mockAudit();
    account = new AccountModule(http, audit);
  });

  describe('getBalance', () => {
    it('returns normalized balance', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          totalEquity: 50000,
          availableCash: 30000,
          usedMargin: 15000,
          freeMargin: 35000,
          currency: 'USD',
        },
      });

      const balance = await account.getBalance();
      expect(balance.totalEquity).toBe(50000);
      expect(balance.availableCash).toBe(30000);
      expect(balance.usedMargin).toBe(15000);
      expect(balance.freeMargin).toBe(35000);
      expect(balance.currency).toBe('USD');
    });

    it('computes freeMargin when API omits it', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          equity: 50000,
          cash: 30000,
          margin: 15000,
          currency: 'USD',
        },
      });

      const balance = await account.getBalance();
      expect(balance.totalEquity).toBe(50000);
      expect(balance.freeMargin).toBe(35000);
    });

    it('handles API error gracefully', async () => {
      http.get = jest.fn().mockRejectedValue(new Error('Network error'));
      await expect(account.getBalance()).rejects.toThrow('Network error');
    });
  });

  describe('getPositions', () => {
    it('returns normalized positions', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          positions: [
            {
              id: 'POS-100',
              instrumentId: 'AAPL-US',
              symbol: 'AAPL',
              side: 'buy',
              units: 10,
              open_price: 180.00,
              current_price: 195.00,
              leverage: 2,
              openDate: '2026-01-15T10:30:00Z',
            },
          ],
        },
      });

      const positions = await account.getPositions();
      expect(positions).toHaveLength(1);
      expect(positions[0].positionId).toBe('POS-100');
      expect(positions[0].symbol).toBe('AAPL');
      expect(positions[0].openPrice).toBe(180.00);
      expect(positions[0].pnl).toBe(150);
    });
  });

  describe('getPendingOrders', () => {
    it('returns normalized pending orders', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          orders: [
            {
              orderId: 'ORD-50',
              symbol: 'MSFT',
              side: 'buy',
              type: 'limit',
              amount: 20,
              limitPrice: 400.00,
              createdAt: '2026-05-19T14:00:00Z',
            },
          ],
        },
      });

      const orders = await account.getPendingOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0].orderId).toBe('ORD-50');
      expect(orders[0].symbol).toBe('MSFT');
      expect(orders[0].type).toBe('limit');
      expect(orders[0].price).toBe(400.00);
    });
  });

  describe('getPortfolioPnl', () => {
    it('returns PnL summary', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          realizedPnl: 1200.00,
          unrealizedPnl: 2500.00,
          totalFees: 45.50,
          overnight_fees: 12.30,
          dividends: 80.00,
        },
      });

      const pnl = await account.getPortfolioPnl();
      expect(pnl.realized).toBe(1200);
      expect(pnl.unrealized).toBe(2500);
      expect(pnl.fees).toBe(45.5);
      expect(pnl.overnightFees).toBe(12.3);
      expect(pnl.dividends).toBe(80);
    });
  });

  describe('getMarginInfo', () => {
    it('returns margin details for instrument', async () => {
      http.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          instrumentId: 'AAPL-US',
          symbol: 'AAPL',
          maxLeverage: 5,
          marginRequired: 4000,
          maintenanceMargin: 2000,
        },
      });

      const margin = await account.getMarginInfo('AAPL-US');
      expect(margin.instrumentId).toBe('AAPL-US');
      expect(margin.maxLeverage).toBe(5);
      expect(margin.marginRequired).toBe(4000);
      expect(margin.maintenanceMargin).toBe(2000);
    });
  });
});
