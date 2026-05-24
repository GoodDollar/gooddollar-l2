import axios from 'axios';
import { TradingModule, TradingError, LimitOrderRequest } from '../trading';
import { AuditLogger } from '../audit-logger';
import { DemoCapEnforcer } from '../cap-enforcer';
import { DemoCapExceededError, RealTradingDisabledError } from '../errors';
import { RateLimiter } from '../rate-limiter';
import { AuditLogEntry, EtoroMode, OrderRequest } from '../types';

jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
}));

function mockHttp() {
  return axios.create({ baseURL: 'https://mock.etoro.com' });
}

function mockAudit(mode: EtoroMode = 'demo-trading') {
  return new AuditLogger(mode, '/dev/null');
}

function tradingFor(
  mode: EtoroMode,
  opts: {
    capEnforcer?: DemoCapEnforcer;
    notionalSizer?: (o: OrderRequest) => number;
    symbolReferencePriceUsd?: (s: string) => number | undefined;
    disableCapsForTestsOnly?: boolean;
  } = {},
) {
  const http = mockHttp();
  const audit = mockAudit(mode);
  // For demo-trading tests that don't care about caps, attach a permissive
  // enforcer by default. Individual tests can override or set
  // `disableCapsForTestsOnly: true` to exercise the escape-hatch path.
  const needsAutoEnforcer = mode === 'demo-trading'
    && !opts.capEnforcer
    && opts.disableCapsForTestsOnly !== true;
  const capEnforcer = opts.capEnforcer ?? (needsAutoEnforcer
    ? new DemoCapEnforcer({
        maxOrderNotionalUsd: Number.MAX_SAFE_INTEGER,
        maxDailyNotionalUsd: Number.MAX_SAFE_INTEGER,
      })
    : undefined);
  const trading = new TradingModule(http, audit, {
    mode,
    capEnforcer,
    notionalSizer: opts.notionalSizer,
    symbolReferencePriceUsd: opts.symbolReferencePriceUsd,
    disableCapsForTestsOnly: opts.disableCapsForTestsOnly,
  });
  return { http, audit, trading };
}

/** Default sizer for tests: treat `amount` as USD-stake (legacy behavior in test setups). */
const amountAsUsd = (o: OrderRequest): number => o.amount;

describe('TradingModule — RealTradingDisabledError fence', () => {
  const NON_TRADING_MODES: EtoroMode[] = ['mock', 'demo-readonly', 'real-disabled'];
  const ORDER: OrderRequest = { symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy', amount: 1 };

  for (const mode of NON_TRADING_MODES) {
    describe(`mode=${mode}`, () => {
      it('openPosition throws RealTradingDisabledError', async () => {
        const { trading } = tradingFor(mode);
        await expect(trading.openPosition(ORDER)).rejects.toBeInstanceOf(RealTradingDisabledError);
      });

      it('placeLimitOrder throws RealTradingDisabledError', async () => {
        const { trading } = tradingFor(mode);
        await expect(trading.placeLimitOrder({ ...ORDER, type: 'limit', price: 1 })).rejects.toBeInstanceOf(RealTradingDisabledError);
      });

      it('closePosition throws RealTradingDisabledError', async () => {
        const { trading } = tradingFor(mode);
        await expect(trading.closePosition('POS-1')).rejects.toBeInstanceOf(RealTradingDisabledError);
      });

      it('partialClose throws RealTradingDisabledError', async () => {
        const { trading } = tradingFor(mode);
        await expect(trading.partialClose('POS-1', 1)).rejects.toBeInstanceOf(RealTradingDisabledError);
      });

      it('cancelOrder throws RealTradingDisabledError', async () => {
        const { trading } = tradingFor(mode);
        await expect(trading.cancelOrder('ORD-1')).rejects.toBeInstanceOf(RealTradingDisabledError);
      });

      it('the error mentions the action and the mode', async () => {
        const { trading } = tradingFor(mode);
        try {
          await trading.openPosition(ORDER);
          fail('expected RealTradingDisabledError');
        } catch (e) {
          expect(e).toBeInstanceOf(RealTradingDisabledError);
          const err = e as RealTradingDisabledError;
          expect(err.action).toBe('openPosition');
          expect(err.mode).toBe(mode);
          expect(err.message).toContain('REAL_TRADING_ENABLED');
        }
      });
    });
  }

  it('does NOT throw RealTradingDisabledError in demo-trading happy path', async () => {
    const { http, trading } = tradingFor('demo-trading', { notionalSizer: amountAsUsd });
    http.post = jest.fn().mockResolvedValue({
      status: 200,
      data: { orderId: 'ORD', symbol: 'AAPL', side: 'buy', amount: 1, status: 'filled' },
    });
    await expect(trading.openPosition(ORDER)).resolves.toBeDefined();
  });

  it('read-only methods (getOrderStatus, getOpenPositions, getTradeHistory) do not require trading', async () => {
    const { http, trading } = tradingFor('demo-readonly');
    http.get = jest.fn().mockResolvedValue({ status: 200, data: { positions: [] } });
    await expect(trading.getOpenPositions()).resolves.toEqual([]);
  });
});

describe('TradingModule — DemoCapExceededError', () => {
  it('throws when single order exceeds MAX_DEMO_ORDER_NOTIONAL_USD', async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100, maxDailyNotionalUsd: 10_000 });
    const { http, trading } = tradingFor('demo-trading', {
      capEnforcer: cap,
      notionalSizer: amountAsUsd,
    });
    http.post = jest.fn();

    await expect(trading.openPosition({
      symbol: 'AAPL',
      instrumentId: 'AAPL-US',
      side: 'buy',
      amount: 200, // notionalSizer treats this as USD-as-stake
    })).rejects.toBeInstanceOf(DemoCapExceededError);

    expect(http.post).not.toHaveBeenCalled();
  });

  it('throws when daily total would exceed MAX_DAILY_DEMO_NOTIONAL_USD', async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 1_500 });
    const { http, trading } = tradingFor('demo-trading', {
      capEnforcer: cap,
      notionalSizer: amountAsUsd,
    });
    http.post = jest.fn().mockResolvedValue({
      status: 200,
      data: { orderId: 'ORD', symbol: 'AAPL', side: 'buy', amount: 1, status: 'filled' },
    });

    // First order: 800 — accepted, recorded.
    await trading.openPosition({ symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy', amount: 800 });
    // Second order: 800 — would push daily to 1600 > 1500 → reject.
    await expect(trading.openPosition({
      symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy', amount: 800,
    })).rejects.toBeInstanceOf(DemoCapExceededError);
  });

  it('does not record a cap when the HTTP call fails', async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 10_000 });
    const { http, trading } = tradingFor('demo-trading', {
      capEnforcer: cap,
      notionalSizer: amountAsUsd,
    });
    http.post = jest.fn().mockRejectedValue(new Error('500'));
    await expect(trading.openPosition({
      symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy', amount: 500,
    })).rejects.toBeInstanceOf(Error);
    expect(cap.getDailyTotalUsd()).toBe(0);
  });
});

describe('TradingModule — market-order notional resolution (cap-bypass fix)', () => {
  const BTC_REF = 60_000;
  const refs: Record<string, number> = { BTC: BTC_REF, AAPL: 190 };
  const symbolRef = (s: string) => refs[s];

  it('blocks a 0.1 BTC market order via symbolReferencePriceUsd (≈ $6,000 > $1,000 cap)', async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 10_000 });
    const { http, trading } = tradingFor('demo-trading', {
      capEnforcer: cap,
      symbolReferencePriceUsd: symbolRef,
    });
    http.post = jest.fn();

    await expect(trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.1,
    })).rejects.toBeInstanceOf(DemoCapExceededError);
    expect(http.post).not.toHaveBeenCalled();
  });

  it('accepts a 0.01 BTC market order (≈ $600) and records ≈ $600 against the daily total', async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 10_000 });
    const { http, trading } = tradingFor('demo-trading', {
      capEnforcer: cap,
      symbolReferencePriceUsd: symbolRef,
    });
    http.post = jest.fn().mockResolvedValue({
      status: 200,
      data: { orderId: 'ORD-X', symbol: 'BTC', side: 'buy', amount: 0.01, status: 'filled' },
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    expect(cap.getDailyTotalUsd()).toBeCloseTo(600, 5);
  });

  it('placeLimitOrder unchanged: price * amount = $2,000 for AAPL', async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 5_000, maxDailyNotionalUsd: 10_000 });
    const { http, trading } = tradingFor('demo-trading', {
      capEnforcer: cap,
      symbolReferencePriceUsd: symbolRef,
    });
    http.post = jest.fn().mockResolvedValue({
      status: 200,
      data: { orderId: 'ORD-LIM', symbol: 'AAPL', side: 'buy', amount: 10, status: 'pending' },
    });

    await trading.placeLimitOrder({
      symbol: 'AAPL',
      instrumentId: 'AAPL-US',
      side: 'buy',
      amount: 10,
      price: 200,
      type: 'limit',
    });

    expect(cap.getDailyTotalUsd()).toBe(2_000);
  });

  it('throws MissingNotionalError for unknown symbols with no sizer or reference price', async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 10_000 });
    const { http, trading } = tradingFor('demo-trading', { capEnforcer: cap });
    http.post = jest.fn();

    const { MissingNotionalError } = await import('../errors');
    await expect(trading.openPosition({
      symbol: 'UNKNOWN-XYZ',
      instrumentId: 'XYZ',
      side: 'buy',
      amount: 1,
    })).rejects.toBeInstanceOf(MissingNotionalError);
    expect(http.post).not.toHaveBeenCalled();
  });

  it('notionalSizer wins over reference price when both available', async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
    const { http, trading } = tradingFor('demo-trading', {
      capEnforcer: cap,
      notionalSizer: () => 42,
      symbolReferencePriceUsd: symbolRef,
    });
    http.post = jest.fn().mockResolvedValue({
      status: 200,
      data: { orderId: 'ORD-S', symbol: 'BTC', side: 'buy', amount: 0.01, status: 'filled' },
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    expect(cap.getDailyTotalUsd()).toBe(42);
  });
});

describe('MissingNotionalError export', () => {
  it('is exported from @goodchain/etoro-client', async () => {
    const mod = await import('../index');
    expect(mod.MissingNotionalError).toBeDefined();
    const err = new mod.MissingNotionalError({ symbol: 'BTC', attemptedAmount: 1, reason: 'test' });
    expect(err.name).toBe('MissingNotionalError');
    expect(err.symbol).toBe('BTC');
  });
});

describe('TradingModule — input validation (InvalidOrderError)', () => {
  const VALID_LIMIT: LimitOrderRequest = {
    symbol: 'AAPL',
    instrumentId: 'AAPL-US',
    side: 'buy',
    amount: 1,
    price: 100,
    type: 'limit',
  };

  const cases: Array<[
    string,
    Partial<OrderRequest>,
    string,
    'market' | 'limit',
  ]> = [
    ["symbol: ''", { symbol: '' }, 'symbol', 'market'],
    ['symbol: "   "', { symbol: '   ' }, 'symbol', 'market'],
    ["instrumentId: ''", { instrumentId: '' }, 'instrumentId', 'market'],
    ['side: "sideways"', { side: 'sideways' as 'buy' }, 'side', 'market'],
    ['amount: NaN', { amount: NaN }, 'amount', 'market'],
    ['amount: -1', { amount: -1 }, 'amount', 'market'],
    ['amount: 0', { amount: 0 }, 'amount', 'market'],
    ['amount: Infinity', { amount: Infinity }, 'amount', 'market'],
    ['leverage: 0', { leverage: 0 }, 'leverage', 'market'],
    ['stopLoss: -1', { stopLoss: -1 }, 'stopLoss', 'market'],
    ['takeProfit: NaN', { takeProfit: NaN }, 'takeProfit', 'market'],
  ];

  for (const [label, patch, field, kind] of cases) {
    it(`${kind} ${label} → InvalidOrderError({ field: '${field}' })`, async () => {
      const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
      const { http, trading } = tradingFor('demo-trading', {
        capEnforcer: cap,
        notionalSizer: amountAsUsd,
      });
      http.post = jest.fn();
      const { InvalidOrderError } = await import('../errors');
      const base = kind === 'limit'
        ? { ...VALID_LIMIT }
        : { symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy' as const, amount: 1 };
      const order = { ...base, ...patch } as OrderRequest & Partial<LimitOrderRequest>;
      const action = kind === 'limit'
        ? trading.placeLimitOrder(order as LimitOrderRequest)
        : trading.openPosition(order);
      try {
        await action;
        fail('expected InvalidOrderError');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidOrderError);
        expect((e as InstanceType<typeof InvalidOrderError>).field).toBe(field);
      }
      expect(http.post).not.toHaveBeenCalled();
    });
  }

  it("limit price: 0 → field 'price'", async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
    const { http, trading } = tradingFor('demo-trading', { capEnforcer: cap });
    http.post = jest.fn();
    const { InvalidOrderError } = await import('../errors');
    await expect(trading.placeLimitOrder({ ...VALID_LIMIT, price: 0 }))
      .rejects.toBeInstanceOf(InvalidOrderError);
  });

  it("limit type: 'wrong' → field 'type'", async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
    const { trading } = tradingFor('demo-trading', { capEnforcer: cap });
    const { InvalidOrderError } = await import('../errors');
    try {
      await trading.placeLimitOrder({ ...VALID_LIMIT, type: 'wrong' as 'limit' });
      fail('expected InvalidOrderError');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidOrderError);
      expect((e as InstanceType<typeof InvalidOrderError>).field).toBe('type');
    }
  });

  it("timeInForce: 'FOO' → field 'timeInForce'", async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
    const { trading } = tradingFor('demo-trading', { capEnforcer: cap });
    const { InvalidOrderError } = await import('../errors');
    try {
      await trading.placeLimitOrder({ ...VALID_LIMIT, timeInForce: 'FOO' as 'GTC' });
      fail('expected InvalidOrderError');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidOrderError);
      expect((e as InstanceType<typeof InvalidOrderError>).field).toBe('timeInForce');
    }
  });

  it("closePosition('') → field 'positionId'", async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
    const { http, trading } = tradingFor('demo-trading', { capEnforcer: cap });
    http.post = jest.fn();
    const { InvalidOrderError } = await import('../errors');
    await expect(trading.closePosition('')).rejects.toBeInstanceOf(InvalidOrderError);
    expect(http.post).not.toHaveBeenCalled();
  });

  it("cancelOrder('   ') → field 'orderId'", async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
    const { http, trading } = tradingFor('demo-trading', { capEnforcer: cap });
    http.delete = jest.fn();
    const { InvalidOrderError } = await import('../errors');
    await expect(trading.cancelOrder('   ')).rejects.toBeInstanceOf(InvalidOrderError);
    expect(http.delete).not.toHaveBeenCalled();
  });

  it("partialClose('pos-1', -1) → field 'amount'", async () => {
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
    const { http, trading } = tradingFor('demo-trading', { capEnforcer: cap });
    http.post = jest.fn();
    const { InvalidOrderError } = await import('../errors');
    try {
      await trading.partialClose('pos-1', -1);
      fail('expected InvalidOrderError');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidOrderError);
      expect((e as InstanceType<typeof InvalidOrderError>).field).toBe('amount');
    }
    expect(http.post).not.toHaveBeenCalled();
  });

  it('validation runs BEFORE the trading fence (most actionable error wins)', async () => {
    const { http, trading } = tradingFor('mock');
    http.post = jest.fn();
    const { InvalidOrderError } = await import('../errors');
    await expect(trading.openPosition({
      symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'sideways' as 'buy', amount: 1,
    })).rejects.toBeInstanceOf(InvalidOrderError);
  });

  it('audit-log PRE-CHECK entry contains field name + reason but NOT the offending raw value', async () => {
    const writes: string[] = [];
    const fsMock = jest.requireMock('fs') as { appendFileSync: jest.Mock };
    fsMock.appendFileSync.mockClear();
    fsMock.appendFileSync.mockImplementation((_p: string, line: string) => { writes.push(line); });

    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 1_000, maxDailyNotionalUsd: 10_000 });
    const { http, trading } = tradingFor('demo-trading', { capEnforcer: cap });
    http.post = jest.fn();

    try {
      await trading.openPosition({
        symbol: 'SECRETSYM', instrumentId: 'X', side: 'sideways' as 'buy', amount: 7,
      });
    } catch {
      // expected
    }

    const preCheck = writes
      .map((l) => JSON.parse(l) as Record<string, unknown>)
      .filter((e) => e.method === 'PRE-CHECK' && e.path === '/validation');
    expect(preCheck.length).toBe(1);
    const err = String(preCheck[0].error ?? '');
    expect(err).toContain('field=side');
    expect(err).toContain('reason=');
    // raw values must not leak
    expect(err).not.toContain('SECRETSYM');
    expect(err).not.toContain('sideways');
  });
});

describe('TradingModule — constructor cap-enforcer requirement', () => {
  it('throws when constructed in demo-trading mode without a capEnforcer', () => {
    const http = mockHttp();
    const audit = mockAudit('demo-trading');
    expect(() => new TradingModule(http, audit, { mode: 'demo-trading' }))
      .toThrow(/DemoCapEnforcer required for demo-trading mode/);
  });

  it("constructs successfully in 'demo-readonly' without a capEnforcer", () => {
    expect(() => new TradingModule(mockHttp(), mockAudit('demo-readonly'), { mode: 'demo-readonly' }))
      .not.toThrow();
  });

  it("constructs successfully in 'mock' without a capEnforcer", () => {
    expect(() => new TradingModule(mockHttp(), mockAudit('mock'), { mode: 'mock' }))
      .not.toThrow();
  });

  it("constructs successfully in 'real-disabled' without a capEnforcer", () => {
    expect(() => new TradingModule(mockHttp(), mockAudit('real-disabled'), { mode: 'real-disabled' }))
      .not.toThrow();
  });

  it('constructs in demo-trading with the disableCapsForTestsOnly escape hatch', () => {
    expect(() => new TradingModule(mockHttp(), mockAudit('demo-trading'), {
      mode: 'demo-trading',
      disableCapsForTestsOnly: true,
    })).not.toThrow();
  });

  it('emits one caps-disabled audit line per mutating call when the escape hatch is active', async () => {
    const writes: string[] = [];
    const fsMock = jest.requireMock('fs') as { appendFileSync: jest.Mock };
    fsMock.appendFileSync.mockClear();
    fsMock.appendFileSync.mockImplementation((_p: string, line: string) => { writes.push(line); });

    const http = mockHttp();
    const audit = new AuditLogger('demo-trading', '/dev/null');
    const trading = new TradingModule(http, audit, {
      mode: 'demo-trading',
      disableCapsForTestsOnly: true,
      notionalSizer: amountAsUsd,
    });
    http.post = jest.fn().mockResolvedValue({
      status: 200,
      data: { orderId: 'O', symbol: 'AAPL', side: 'buy', amount: 1, status: 'filled' },
    });
    http.delete = jest.fn().mockResolvedValue({ status: 200 });

    await trading.openPosition({ symbol: 'AAPL', instrumentId: 'A', side: 'buy', amount: 1 });
    await trading.placeLimitOrder({
      symbol: 'AAPL', instrumentId: 'A', side: 'buy', amount: 1, price: 1, type: 'limit',
    });
    await trading.closePosition('POS-1');
    await trading.partialClose('POS-1', 1);
    await trading.cancelOrder('ORD-1');

    const capsDisabledLines = writes
      .map((l) => JSON.parse(l) as Record<string, unknown>)
      .filter((e) => typeof e.error === 'string' && (e.error as string).startsWith('caps-disabled'));
    expect(capsDisabledLines).toHaveLength(5);
    for (const line of capsDisabledLines) {
      expect(line.method).toBe('PRE-CHECK');
      expect(line.path).toBe('/cap-enforcer');
    }
    const actions = new Set(capsDisabledLines.map((e) => e.action));
    expect(actions).toEqual(new Set([
      'openPosition', 'placeLimitOrder', 'closePosition', 'partialClose', 'cancelOrder',
    ]));
  });

  it('runtime guard in assertCapOk catches a future regression that strips the enforcer', async () => {
    // Construct via the escape hatch, then mutate private fields to simulate
    // a future refactor that re-allows construction without an enforcer.
    const http = mockHttp();
    const audit = mockAudit('demo-trading');
    const trading = new TradingModule(http, audit, {
      mode: 'demo-trading',
      disableCapsForTestsOnly: true,
      notionalSizer: amountAsUsd,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (trading as any).disableCapsForTestsOnly = false;
    http.post = jest.fn();

    await expect(trading.openPosition({
      symbol: 'AAPL', instrumentId: 'A', side: 'buy', amount: 1,
    })).rejects.toThrow(/DemoCapEnforcer required for demo-trading mode/);
    expect(http.post).not.toHaveBeenCalled();
  });
});

describe('InvalidOrderError export', () => {
  it('is exported from @goodchain/etoro-client', async () => {
    const mod = await import('../index');
    expect(mod.InvalidOrderError).toBeDefined();
    const err = new mod.InvalidOrderError({ field: 'amount', reason: 'NaN' });
    expect(err.name).toBe('InvalidOrderError');
    expect(err.field).toBe('amount');
    expect(err.reason).toBe('NaN');
  });
});

describe('TradingModule — audit-log resolvedNotionalUsd + notionalSource', () => {
  it('records resolved USD notional and source on successful openPosition', async () => {
    const writes: string[] = [];
    const fsMock = jest.requireMock('fs') as { appendFileSync: jest.Mock };
    fsMock.appendFileSync.mockImplementation((_p: string, line: string) => { writes.push(line); });

    const http = mockHttp();
    const audit = new AuditLogger('demo-trading', '/dev/null');
    const cap = new DemoCapEnforcer({ maxOrderNotionalUsd: 100_000, maxDailyNotionalUsd: 1_000_000 });
    const trading = new TradingModule(http, audit, {
      mode: 'demo-trading',
      capEnforcer: cap,
      symbolReferencePriceUsd: () => 60_000,
    });
    http.post = jest.fn().mockResolvedValue({
      status: 200,
      data: { orderId: 'O', symbol: 'BTC', side: 'buy', amount: 0.01, status: 'filled' },
    });

    await trading.openPosition({
      symbol: 'BTC', instrumentId: 'ETORO-BTC', side: 'buy', amount: 0.01,
    });

    const openLine = writes
      .map((l) => JSON.parse(l) as Record<string, unknown>)
      .find((e) => e.action === 'openPosition' && e.method === 'POST');
    expect(openLine).toBeDefined();
    expect(openLine?.resolvedNotionalUsd).toBeCloseTo(600, 5);
    expect(openLine?.notionalSource).toBe('reference-fallback');
  });
});

describe('TradingModule — happy paths (demo-trading)', () => {
  let http: ReturnType<typeof mockHttp>;
  let trading: TradingModule;

  beforeEach(() => {
    const built = tradingFor('demo-trading', { notionalSizer: amountAsUsd });
    http = built.http;
    trading = built.trading;
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
      expect(http.post).toHaveBeenCalledWith(
        '/trading/execution/demo/market-open-orders/by-amount',
        expect.objectContaining({
          symbol: 'AAPL',
          side: 'buy',
          amount: 10,
        }),
      );
    });

    it('routes to by-units endpoint when order.units is provided', async () => {
      http.post = jest.fn().mockResolvedValue({
        status: 200,
        data: { orderId: 'ORD-U', symbol: 'AAPL', side: 'buy', amount: 10, status: 'filled' },
      });

      await trading.openPosition({
        symbol: 'AAPL',
        instrumentId: 'AAPL-US',
        side: 'buy',
        amount: 10,
        units: 3,
      });

      expect(http.post).toHaveBeenCalledWith(
        '/trading/execution/demo/market-open-orders/by-units',
        expect.objectContaining({
          symbol: 'AAPL',
          side: 'buy',
          units: 3,
        }),
      );
      const body = (http.post as jest.Mock).mock.calls[0][1] as Record<string, unknown>;
      expect(body.amount).toBeUndefined();
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
      expect(http.post).toHaveBeenCalledWith(
        '/trading/execution/demo/limit-orders',
        expect.objectContaining({
          type: 'limit',
          price: 250.00,
          timeInForce: 'DAY',
        }),
      );
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
      expect(http.post).toHaveBeenCalledWith(
        '/trading/execution/demo/market-close-orders/by-amount',
        { positionId: 'POS-001' },
      );
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
      expect(http.post).toHaveBeenCalledWith(
        '/trading/execution/demo/market-close-orders/by-amount',
        { positionId: 'POS-001', amount: 5 },
      );
    });

    it('routes by-units when called with { units }', async () => {
      http.post = jest.fn().mockResolvedValue({
        status: 200,
        data: { orderId: 'ORD-005', positionId: 'POS-001', symbol: 'AAPL', amount: 3, status: 'filled' },
      });
      await trading.partialClose('POS-001', { units: 3 });
      expect(http.post).toHaveBeenCalledWith(
        '/trading/execution/demo/market-close-orders/by-units',
        { positionId: 'POS-001', units: 3 },
      );
    });
  });

  describe('cancelOrder', () => {
    it('cancels order via DELETE', async () => {
      http.delete = jest.fn().mockResolvedValue({ status: 200 });

      await trading.cancelOrder('ORD-002');
      expect(http.delete).toHaveBeenCalledWith('/trading/info/demo/orders/ORD-002');
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

describe('TradingModule — malformed-list response visibility', () => {
  function recordingAudit(mode: EtoroMode = 'demo-readonly'): {
    audit: AuditLogger;
    entries: AuditLogEntry[];
  } {
    const entries: AuditLogEntry[] = [];
    const audit = new AuditLogger(mode, {
      logPath: '/dev/null',
      appendImpl: (_p, line) => { entries.push(JSON.parse(line) as AuditLogEntry); },
      mkdirImpl: () => undefined,
      consoleErrorImpl: () => undefined,
    });
    return { audit, entries };
  }

  it('getOpenPositions audits + counts on malformed envelope, returns []', async () => {
    const { audit, entries } = recordingAudit();
    const http = mockHttp();
    http.get = jest.fn().mockResolvedValue({ status: 200, data: { weirdField: 'x' } });
    const trading = new TradingModule(http, audit, { mode: 'demo-readonly' });

    const out = await trading.getOpenPositions();
    expect(out).toEqual([]);
    expect(trading.getMalformedListResponseCount('getOpenPositions')).toBe(1);
    const lines = entries.filter((e) => e.action === 'getOpenPositions-malformed');
    expect(lines).toHaveLength(1);
    expect(lines[0].method).toBe('PARSE');
    expect(lines[0].path).toBe('/trading/info/demo/positions');
    expect(lines[0].error).toBe(
      'MalformedListResponse: object-no-match keys=[weirdField]',
    );
  });

  it('getOpenPositions does NOT audit on a legitimately empty envelope', async () => {
    const { audit, entries } = recordingAudit();
    const http = mockHttp();
    http.get = jest.fn().mockResolvedValue({ status: 200, data: { positions: [] } });
    const trading = new TradingModule(http, audit, { mode: 'demo-readonly' });

    const out = await trading.getOpenPositions();
    expect(out).toEqual([]);
    expect(trading.getMalformedListResponseCount('getOpenPositions')).toBe(0);
    expect(entries.filter((e) => e.action === 'getOpenPositions-malformed')).toHaveLength(0);
  });

  it('getTradeHistory audits + counts on malformed envelope', async () => {
    const { audit, entries } = recordingAudit();
    const http = mockHttp();
    http.get = jest.fn().mockResolvedValue({ status: 200, data: null });
    const trading = new TradingModule(http, audit, { mode: 'demo-readonly' });

    const out = await trading.getTradeHistory(10);
    expect(out).toEqual([]);
    expect(trading.getMalformedListResponseCount('getTradeHistory')).toBe(1);
    expect(entries.filter((e) => e.action === 'getTradeHistory-malformed')).toHaveLength(1);
  });

  it('throws MalformedListResponseError when throwOnMalformedListResponse=true', async () => {
    const { audit } = recordingAudit();
    const http = mockHttp();
    http.get = jest.fn().mockResolvedValue({ status: 200, data: { weird: 1 } });
    const trading = new TradingModule(http, audit, {
      mode: 'demo-readonly',
      throwOnMalformedListResponse: true,
    });

    await expect(trading.getOpenPositions()).rejects.toMatchObject({
      name: 'MalformedListResponseError',
      action: 'getOpenPositions',
    });
  });
});

describe('TradingModule — rate-limit dispatcher integration', () => {
  function recordingAudit(mode: EtoroMode = 'demo-trading'): {
    audit: AuditLogger;
    entries: AuditLogEntry[];
  } {
    const entries: AuditLogEntry[] = [];
    const audit = new AuditLogger(mode, {
      logPath: '/dev/null',
      appendImpl: (_p, line) => { entries.push(JSON.parse(line) as AuditLogEntry); },
      mkdirImpl: () => undefined,
      consoleErrorImpl: () => undefined,
    });
    return { audit, entries };
  }

  it('openPosition absorbs one 429 and audits attempts: 2', async () => {
    let calls = 0;
    const post = jest.fn(async () => {
      calls++;
      if (calls === 1) {
        const err = new Error('429') as Error & { response: { status: number } };
        err.response = { status: 429 };
        throw err;
      }
      return {
        status: 200,
        data: { orderId: 'O-1', positionId: 'P-1', symbol: 'AAPL', side: 'buy', amount: 1, executionPrice: 100, status: 'filled' },
      };
    });
    const http = { post, get: jest.fn(), delete: jest.fn() } as unknown as ReturnType<typeof mockHttp>;
    const { audit, entries } = recordingAudit('demo-trading');
    const limiter = new RateLimiter({
      minBackoffMs: 1, maxBackoffMs: 5, multiplier: 2, maxRetries: 3,
      sleepImpl: async () => undefined,
    });
    const trading = new TradingModule(http, audit, {
      mode: 'demo-trading',
      capEnforcer: new DemoCapEnforcer({
        maxOrderNotionalUsd: Number.MAX_SAFE_INTEGER,
        maxDailyNotionalUsd: Number.MAX_SAFE_INTEGER,
      }),
      notionalSizer: () => 100,
      dispatch: (fn) => limiter.executeWithTelemetry(fn),
    });

    const result = await trading.openPosition({ symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy', amount: 1 });
    expect(result.orderId).toBe('O-1');
    expect(calls).toBe(2);
    const success = entries.find((e) => e.action === 'openPosition' && e.statusCode === 200);
    expect(success?.attempts).toBe(2);
    expect(success?.totalBackoffMs).toBe(1);
  });

  it('exhausting retries surfaces the 429 to the caller and consecutiveThrottles tracks pressure', async () => {
    const post = jest.fn(async () => {
      const err = new Error('429') as Error & { response: { status: number } };
      err.response = { status: 429 };
      throw err;
    });
    const http = { post, get: jest.fn(), delete: jest.fn() } as unknown as ReturnType<typeof mockHttp>;
    const { audit } = recordingAudit('demo-trading');
    const limiter = new RateLimiter({
      minBackoffMs: 1, maxBackoffMs: 5, multiplier: 2, maxRetries: 2,
      sleepImpl: async () => undefined,
    });
    const trading = new TradingModule(http, audit, {
      mode: 'demo-trading',
      capEnforcer: new DemoCapEnforcer({
        maxOrderNotionalUsd: Number.MAX_SAFE_INTEGER,
        maxDailyNotionalUsd: Number.MAX_SAFE_INTEGER,
      }),
      notionalSizer: () => 100,
      dispatch: (fn) => limiter.executeWithTelemetry(fn),
    });

    await expect(
      trading.openPosition({ symbol: 'AAPL', instrumentId: 'AAPL-US', side: 'buy', amount: 1 }),
    ).rejects.toBeInstanceOf(TradingError);
    expect(post).toHaveBeenCalledTimes(3);
    expect(limiter.getConsecutiveThrottles()).toBe(3);
  });
});
