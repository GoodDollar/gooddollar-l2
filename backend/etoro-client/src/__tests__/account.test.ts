import axios from 'axios';
import { AccountModule } from '../account';
import { AuditLogger } from '../audit-logger';
import { AccountUnavailableError } from '../errors';
import { RateLimiter } from '../rate-limiter';
import { AuditLogEntry, EtoroMode } from '../types';

jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
}));

function mockHttp() {
  return axios.create({ baseURL: 'https://mock.etoro.com' });
}

function mockAudit() {
  return new AuditLogger('demo-readonly', '/dev/null');
}

function recordingAudit(mode: EtoroMode = 'mock'): { audit: AuditLogger; entries: AuditLogEntry[] } {
  const entries: AuditLogEntry[] = [];
  const audit = new AuditLogger(mode, {
    logPath: '/dev/null',
    appendImpl: (_p, line) => { entries.push(JSON.parse(line) as AuditLogEntry); },
    mkdirImpl: () => undefined,
    consoleErrorImpl: () => undefined,
  });
  return { audit, entries };
}

describe('AccountModule', () => {
  let http: ReturnType<typeof mockHttp>;
  let audit: ReturnType<typeof mockAudit>;
  let account: AccountModule;

  beforeEach(() => {
    http = mockHttp();
    audit = mockAudit();
    account = new AccountModule(http, audit, { mode: 'demo-readonly' });
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

describe('AccountModule — mode-gate', () => {
  const METHOD_CASES: Array<{
    action: string;
    invoke: (m: AccountModule) => Promise<unknown>;
  }> = [
    { action: 'getBalance',       invoke: (m) => m.getBalance() },
    { action: 'getPositions',     invoke: (m) => m.getPositions() },
    { action: 'getPendingOrders', invoke: (m) => m.getPendingOrders() },
    { action: 'getPortfolioPnl',  invoke: (m) => m.getPortfolioPnl() },
    { action: 'getMarginInfo',    invoke: (m) => m.getMarginInfo('AAPL-US') },
  ];

  it.each(METHOD_CASES)('refuses %s in mock mode without any HTTP call', async ({ action, invoke }) => {
    const get = jest.fn();
    const http = { get } as unknown as ReturnType<typeof mockHttp>;
    const { audit, entries } = recordingAudit('mock');
    const account = new AccountModule(http, audit, { mode: 'mock' });

    await expect(invoke(account)).rejects.toBeInstanceOf(AccountUnavailableError);
    expect(get).not.toHaveBeenCalled();

    const gateLines = entries.filter((e) => e.method === 'PRE-CHECK' && e.path === '/mode-gate');
    expect(gateLines).toHaveLength(1);
    expect(gateLines[0].action).toBe(action);
    expect(gateLines[0].error).toMatch(/^AccountUnavailableError:/);
  });

  it.each(['demo-readonly', 'demo-trading', 'real-disabled'] as const)(
    'lets %s proceed to HTTP (gate is mock-only)',
    async (mode) => {
      const get = jest.fn().mockResolvedValue({
        status: 200,
        data: { totalEquity: 100, availableCash: 50, usedMargin: 0, freeMargin: 50, currency: 'USD' },
      });
      const http = { get } as unknown as ReturnType<typeof mockHttp>;
      const { audit } = recordingAudit(mode);
      const account = new AccountModule(http, audit, { mode });

      const balance = await account.getBalance();
      expect(balance.totalEquity).toBe(100);
      expect(get).toHaveBeenCalledWith('/account/balance');
    },
  );

  it('carries action/mode/reason as readonly fields on the typed error', () => {
    const err = new AccountUnavailableError({ action: 'getBalance', mode: 'mock', reason: 'no demo URL' });
    expect(err.name).toBe('AccountUnavailableError');
    expect(err.action).toBe('getBalance');
    expect(err.mode).toBe('mock');
    expect(err.reason).toBe('no demo URL');
    expect(err.message).toContain('Account API unavailable in mode "mock"');
    expect(err.message).toContain('ETORO_DEMO_KEY');
  });
});

describe('AccountModule — rate-limit dispatcher integration', () => {
  it('absorbs a single 429 and audits attempts: 2', async () => {
    let calls = 0;
    const get = jest.fn(async () => {
      calls++;
      if (calls === 1) {
        const err = new Error('429') as Error & { response: { status: number } };
        err.response = { status: 429 };
        throw err;
      }
      return {
        status: 200,
        data: { totalEquity: 100, availableCash: 50, usedMargin: 0, freeMargin: 50, currency: 'USD' },
      };
    });
    const http = { get } as unknown as ReturnType<typeof mockHttp>;
    const { audit, entries } = recordingAudit('demo-readonly');
    const sleeps: number[] = [];
    const limiter = new RateLimiter({
      minBackoffMs: 1, maxBackoffMs: 10, multiplier: 2, maxRetries: 3,
      sleepImpl: async (ms) => { sleeps.push(ms); },
    });
    const account = new AccountModule(http, audit, {
      mode: 'demo-readonly',
      dispatch: (fn) => limiter.executeWithTelemetry(fn),
    });

    const balance = await account.getBalance();
    expect(balance.totalEquity).toBe(100);
    expect(calls).toBe(2);
    const success = entries.find((e) => e.action === 'getBalance' && e.statusCode === 200);
    expect(success?.attempts).toBe(2);
    expect(success?.totalBackoffMs).toBe(1);
  });

  it('default identity dispatcher records attempts: 1 / totalBackoffMs: 0', async () => {
    const get = jest.fn().mockResolvedValue({
      status: 200,
      data: { totalEquity: 1, availableCash: 1, usedMargin: 0, freeMargin: 1, currency: 'USD' },
    });
    const http = { get } as unknown as ReturnType<typeof mockHttp>;
    const { audit, entries } = recordingAudit('demo-readonly');
    const account = new AccountModule(http, audit, { mode: 'demo-readonly' });

    await account.getBalance();
    const success = entries.find((e) => e.action === 'getBalance' && e.statusCode === 200);
    expect(success?.attempts).toBe(1);
    expect(success?.totalBackoffMs).toBe(0);
  });
});

describe('AccountModule — malformed-list response visibility', () => {
  it('getPositions audits + counts on malformed envelope, returns []', async () => {
    const get = jest.fn().mockResolvedValue({ status: 200, data: { weirdField: 'x' } });
    const http = { get } as unknown as ReturnType<typeof mockHttp>;
    const { audit, entries } = recordingAudit('demo-readonly');
    const account = new AccountModule(http, audit, { mode: 'demo-readonly' });

    const out = await account.getPositions();
    expect(out).toEqual([]);
    expect(account.getMalformedListResponseCount('getPositions')).toBe(1);
    const lines = entries.filter((e) => e.action === 'getPositions-malformed');
    expect(lines).toHaveLength(1);
    expect(lines[0].method).toBe('PARSE');
    expect(lines[0].path).toBe('/account/positions');
    expect(lines[0].error).toBe(
      'MalformedListResponse: object-no-match keys=[weirdField]',
    );
  });

  it('getPositions does NOT audit on a legitimately empty envelope', async () => {
    const get = jest.fn().mockResolvedValue({ status: 200, data: { positions: [] } });
    const http = { get } as unknown as ReturnType<typeof mockHttp>;
    const { audit, entries } = recordingAudit('demo-readonly');
    const account = new AccountModule(http, audit, { mode: 'demo-readonly' });

    const out = await account.getPositions();
    expect(out).toEqual([]);
    expect(account.getMalformedListResponseCount('getPositions')).toBe(0);
    expect(entries.filter((e) => e.action === 'getPositions-malformed')).toHaveLength(0);
  });

  it('getPendingOrders audits + counts on malformed envelope', async () => {
    const get = jest.fn().mockResolvedValue({ status: 200, data: 42 });
    const http = { get } as unknown as ReturnType<typeof mockHttp>;
    const { audit, entries } = recordingAudit('demo-readonly');
    const account = new AccountModule(http, audit, { mode: 'demo-readonly' });

    const out = await account.getPendingOrders();
    expect(out).toEqual([]);
    expect(account.getMalformedListResponseCount('getPendingOrders')).toBe(1);
    expect(entries.filter((e) => e.action === 'getPendingOrders-malformed')).toHaveLength(1);
  });

  it('throws MalformedListResponseError when throwOnMalformedListResponse=true', async () => {
    const get = jest.fn().mockResolvedValue({ status: 200, data: { wrong: 1 } });
    const http = { get } as unknown as ReturnType<typeof mockHttp>;
    const { audit } = recordingAudit('demo-readonly');
    const account = new AccountModule(http, audit, {
      mode: 'demo-readonly',
      throwOnMalformedListResponse: true,
    });

    await expect(account.getPositions()).rejects.toMatchObject({
      name: 'MalformedListResponseError',
      action: 'getPositions',
    });
  });
});
