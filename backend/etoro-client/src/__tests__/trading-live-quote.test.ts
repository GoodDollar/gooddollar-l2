import axios from 'axios';
import { AuditLogger } from '../audit-logger';
import { DemoCapEnforcer } from '../cap-enforcer';
import { DemoCapExceededError } from '../errors';
import { TradingModule, NotionalSource } from '../trading';

jest.mock('fs', () => ({
  appendFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const REFERENCE_BTC = 60_000;

function mockHttp() {
  const http = axios.create({ baseURL: 'https://mock.etoro.com' });
  http.post = jest.fn().mockResolvedValue({
    status: 200,
    data: { orderId: 'O', symbol: 'BTC', side: 'buy', amount: 0.01, status: 'filled' },
  });
  return http;
}

interface BuildOpts {
  liveQuoteSource?: (symbol: string) => { mid: number; timestamp: number } | undefined;
  maxQuoteAgeMs?: number;
  maxReferenceDriftRatio?: number;
  reference?: number | undefined;
}

function buildTrading(opts: BuildOpts = {}) {
  const writes: string[] = [];
  const fsMock = jest.requireMock('fs') as { appendFileSync: jest.Mock };
  fsMock.appendFileSync.mockClear();
  fsMock.appendFileSync.mockImplementation((_p: string, line: string) => {
    writes.push(line);
  });

  const http = mockHttp();
  const audit = new AuditLogger('demo-trading', '/dev/null');
  const cap = new DemoCapEnforcer({
    maxOrderNotionalUsd: 100_000,
    maxDailyNotionalUsd: 1_000_000,
  });
  const trading = new TradingModule(http, audit, {
    mode: 'demo-trading',
    capEnforcer: cap,
    symbolReferencePriceUsd: () =>
      'reference' in opts ? opts.reference : REFERENCE_BTC,
    liveQuoteSource: opts.liveQuoteSource,
    maxQuoteAgeMs: opts.maxQuoteAgeMs,
    maxReferenceDriftRatio: opts.maxReferenceDriftRatio,
  });
  return { trading, writes, http };
}

function lastOpenLine(writes: string[]): Record<string, unknown> | undefined {
  return writes
    .map((l) => JSON.parse(l) as Record<string, unknown>)
    .find((e) => e.action === 'openPosition' && e.method === 'POST');
}

describe('NotionalSource union shape', () => {
  it('lists the four canonical members in priority order', () => {
    const all: NotionalSource[] = ['sizer', 'limit-price', 'live-quote', 'reference-fallback'];
    expect(all).toHaveLength(4);
    // @ts-expect-error — the legacy 'reference' literal must no longer be assignable.
    const legacy: NotionalSource = 'reference';
    expect(legacy).toBe('reference');
  });
});

describe('TradingModule.computeNotional — live-quote tier', () => {
  it('sizes a market order against a fresh live quote and records source=live-quote', async () => {
    const now = Date.now();
    const { trading, writes } = buildTrading({
      liveQuoteSource: () => ({ mid: 80_000, timestamp: now }),
      maxQuoteAgeMs: 60_000,
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    const line = lastOpenLine(writes);
    expect(line?.resolvedNotionalUsd).toBeCloseTo(800, 5);
    expect(line?.notionalSource).toBe('live-quote');
    expect(typeof line?.quoteAgeMs).toBe('number');
    expect(line?.quoteAgeMs as number).toBeLessThan(1_000);
  });

  it('falls through to reference-fallback when the live quote is stale', async () => {
    const now = Date.now();
    const { trading, writes } = buildTrading({
      liveQuoteSource: () => ({ mid: 80_000, timestamp: now - 90_000 }),
      maxQuoteAgeMs: 60_000,
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    const line = lastOpenLine(writes);
    expect(line?.resolvedNotionalUsd).toBeCloseTo(600, 5);
    expect(line?.notionalSource).toBe('reference-fallback');
    expect(line?.quoteAgeMs).toBeUndefined();
  });

  it('falls through to reference-fallback when liveQuoteSource returns undefined', async () => {
    const { trading, writes } = buildTrading({
      liveQuoteSource: () => undefined,
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    const line = lastOpenLine(writes);
    expect(line?.resolvedNotionalUsd).toBeCloseTo(600, 5);
    expect(line?.notionalSource).toBe('reference-fallback');
  });

  it('ignores live quotes with non-positive mid', async () => {
    const { trading, writes } = buildTrading({
      liveQuoteSource: () => ({ mid: 0, timestamp: Date.now() }),
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    expect(lastOpenLine(writes)?.notionalSource).toBe('reference-fallback');
  });
});

describe('TradingModule.computeNotional — reference-drift guard', () => {
  it('rejects with cap=reference-drift when divergence exceeds maxReferenceDriftRatio', async () => {
    const { trading } = buildTrading({
      liveQuoteSource: () => ({ mid: 80_000, timestamp: Date.now() }),
      maxReferenceDriftRatio: 0.2, // 20% — 33% drift exceeds
    });

    await expect(
      trading.openPosition({
        symbol: 'BTC',
        instrumentId: 'ETORO-BTC',
        side: 'buy',
        amount: 0.01,
      }),
    ).rejects.toBeInstanceOf(DemoCapExceededError);

    await expect(
      trading.openPosition({
        symbol: 'BTC',
        instrumentId: 'ETORO-BTC',
        side: 'buy',
        amount: 0.01,
      }),
    ).rejects.toMatchObject({ cap: 'reference-drift' });
  });

  it('allows the order when divergence is within the ratio', async () => {
    const { trading, writes } = buildTrading({
      liveQuoteSource: () => ({ mid: 62_000, timestamp: Date.now() }),
      maxReferenceDriftRatio: 0.1, // ~3.3% drift, well under 10%
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    expect(lastOpenLine(writes)?.notionalSource).toBe('live-quote');
  });

  it('skips the drift check entirely when maxReferenceDriftRatio is unset', async () => {
    const { trading, writes } = buildTrading({
      liveQuoteSource: () => ({ mid: 200_000, timestamp: Date.now() }),
      // maxReferenceDriftRatio intentionally omitted
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    expect(lastOpenLine(writes)?.notionalSource).toBe('live-quote');
  });

  it('skips the drift check when there is no reference price to compare', async () => {
    const { trading, writes } = buildTrading({
      liveQuoteSource: () => ({ mid: 200_000, timestamp: Date.now() }),
      maxReferenceDriftRatio: 0.1,
      reference: undefined,
    });

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    expect(lastOpenLine(writes)?.notionalSource).toBe('live-quote');
  });
});

describe('Audit log carries quoteAgeMs only for live-quote sizing', () => {
  it('omits quoteAgeMs on reference-fallback lines', async () => {
    const { trading, writes } = buildTrading({});

    await trading.openPosition({
      symbol: 'BTC',
      instrumentId: 'ETORO-BTC',
      side: 'buy',
      amount: 0.01,
    });

    expect(lastOpenLine(writes)?.quoteAgeMs).toBeUndefined();
  });
});
