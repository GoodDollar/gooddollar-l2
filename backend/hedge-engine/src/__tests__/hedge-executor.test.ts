import { HedgeExecutor, EtoroAdapter, HEDGE_REAL_TRADING_ENABLED } from '../hedge-executor';
import { HedgeOrder } from '../types';

function makeMockAdapter(overrides?: Partial<EtoroAdapter>): EtoroAdapter {
  return {
    openPosition: jest.fn().mockResolvedValue({ orderId: 'ORD-1', status: 'filled' }),
    closePosition: jest.fn().mockResolvedValue({ orderId: 'ORD-CLOSE-1' }),
    getPositions: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('HedgeExecutor', () => {
  const instruments = new Map([
    ['AAPL', 'INST-AAPL'],
    ['TSLA', 'INST-TSLA'],
  ]);

  it('fetches and normalizes eToro positions', async () => {
    const adapter = makeMockAdapter({
      getPositions: jest.fn().mockResolvedValue([
        { positionId: 'P1', symbol: 'AAPL', side: 'buy', amount: 100 },
        { positionId: 'P2', symbol: 'TSLA', side: 'sell', amount: 50 },
      ]),
    });
    const exec = new HedgeExecutor(adapter, instruments);

    const positions = await exec.fetchPositions();
    expect(positions).toEqual([
      { symbol: 'AAPL', quantity: 100, positionId: 'P1' },
      { symbol: 'TSLA', quantity: -50, positionId: 'P2' },
    ]);
  });

  it('places a buy order for positive deltaToHedge', async () => {
    const adapter = makeMockAdapter();
    const exec = new HedgeExecutor(adapter, instruments);

    const order: HedgeOrder = { symbol: 'AAPL', deltaToHedge: 5000, reason: 'threshold_breach' };
    const result = await exec.execute(order);

    expect(result.success).toBe(true);
    expect(result.etoroOrderId).toBe('ORD-1');
    expect(adapter.openPosition).toHaveBeenCalledWith({
      symbol: 'AAPL',
      instrumentId: 'INST-AAPL',
      side: 'buy',
      amount: 5000,
    });
  });

  it('places a sell order for negative deltaToHedge', async () => {
    const adapter = makeMockAdapter();
    const exec = new HedgeExecutor(adapter, instruments);

    const order: HedgeOrder = { symbol: 'TSLA', deltaToHedge: -3000, reason: 'new_symbol' };
    const result = await exec.execute(order);

    expect(result.success).toBe(true);
    expect(adapter.openPosition).toHaveBeenCalledWith({
      symbol: 'TSLA',
      instrumentId: 'INST-TSLA',
      side: 'sell',
      amount: 3000,
    });
  });

  it('returns error when instrument ID not found', async () => {
    const adapter = makeMockAdapter();
    const exec = new HedgeExecutor(adapter, instruments);

    const order: HedgeOrder = { symbol: 'UNKNOWN', deltaToHedge: 1000, reason: 'reconciliation' };
    const result = await exec.execute(order);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No instrument ID');
  });

  it('returns error on adapter failure', async () => {
    const adapter = makeMockAdapter({
      openPosition: jest.fn().mockRejectedValue(new Error('API down')),
    });
    const exec = new HedgeExecutor(adapter, instruments);

    const order: HedgeOrder = { symbol: 'AAPL', deltaToHedge: 1000, reason: 'threshold_breach' };
    const result = await exec.execute(order);

    expect(result.success).toBe(false);
    expect(result.error).toBe('API down');
  });

  it('dry-run mode does not call adapter', async () => {
    const adapter = makeMockAdapter();
    const exec = new HedgeExecutor(adapter, instruments, true);

    const order: HedgeOrder = { symbol: 'AAPL', deltaToHedge: 5000, reason: 'threshold_breach' };
    const result = await exec.execute(order);

    expect(result.success).toBe(true);
    expect(result.etoroOrderId).toBe('dry-run');
    expect(adapter.openPosition).not.toHaveBeenCalled();
  });

  it('executeAll processes all orders in sequence', async () => {
    const adapter = makeMockAdapter();
    const exec = new HedgeExecutor(adapter, instruments);

    const orders: HedgeOrder[] = [
      { symbol: 'AAPL', deltaToHedge: 1000, reason: 'threshold_breach' },
      { symbol: 'TSLA', deltaToHedge: -2000, reason: 'new_symbol' },
    ];

    const results = await exec.executeAll(orders);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  describe('safety fence', () => {
    it('exposes a literal-false HEDGE_REAL_TRADING_ENABLED constant', () => {
      expect(HEDGE_REAL_TRADING_ENABLED).toBe(false);
    });

    it('sandbox mode lets non-dry-run orders through', async () => {
      const adapter = makeMockAdapter();
      const exec = new HedgeExecutor(adapter, instruments, {
        dryRun: false,
        safetyMode: 'sandbox',
      });
      const order: HedgeOrder = { symbol: 'AAPL', deltaToHedge: 100, reason: 'reconciliation' };
      const result = await exec.execute(order);
      expect(result.success).toBe(true);
      expect(adapter.openPosition).toHaveBeenCalled();
    });

    it('real mode rejects non-dry-run orders without calling adapter', async () => {
      const adapter = makeMockAdapter();
      const exec = new HedgeExecutor(adapter, instruments, {
        dryRun: false,
        safetyMode: 'real',
      });
      const order: HedgeOrder = { symbol: 'AAPL', deltaToHedge: 100, reason: 'reconciliation' };
      const result = await exec.execute(order);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/HEDGE_REAL_TRADING_ENABLED|Refusing real-mode/);
      expect(adapter.openPosition).not.toHaveBeenCalled();
    });

    it('real mode still allows dry-run (safety fence skipped in dry-run)', async () => {
      const adapter = makeMockAdapter();
      const exec = new HedgeExecutor(adapter, instruments, {
        dryRun: true,
        safetyMode: 'real',
      });
      const order: HedgeOrder = { symbol: 'AAPL', deltaToHedge: 100, reason: 'reconciliation' };
      const result = await exec.execute(order);
      expect(result.success).toBe(true);
      expect(result.etoroOrderId).toBe('dry-run');
      expect(adapter.openPosition).not.toHaveBeenCalled();
    });

    it('custom assertDemoModeOrThrow injection is invoked', async () => {
      const adapter = makeMockAdapter();
      const assertFn = jest.fn();
      const exec = new HedgeExecutor(adapter, instruments, {
        dryRun: false,
        safetyMode: 'sandbox',
        assertDemoModeOrThrow: assertFn,
      });
      await exec.execute({ symbol: 'AAPL', deltaToHedge: 100, reason: 'reconciliation' });
      expect(assertFn).toHaveBeenCalledWith('sandbox');
    });
  });
});
