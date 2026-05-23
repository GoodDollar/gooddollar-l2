import { createMockAdapter } from '../mock-adapter';

describe('createMockAdapter', () => {
  it('returns deterministic mock-<SYMBOL>-<n> order IDs per symbol', async () => {
    const adapter = createMockAdapter();
    const a = await adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    });
    const b = await adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'sell', amount: 50,
    });
    const c = await adapter.openPosition({
      symbol: 'BTC', instrumentId: 'INST-100100', side: 'buy', amount: 200,
    });

    expect(a.orderId).toBe('mock-AAPL-1');
    expect(a.status).toBe('filled');
    expect(b.orderId).toBe('mock-AAPL-2');
    expect(c.orderId).toBe('mock-BTC-1');
  });

  it('never returns a sim-<Date.now()> style ID', async () => {
    const adapter = createMockAdapter();
    const result = await adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    });
    expect(result.orderId.startsWith('sim-')).toBe(false);
    expect(/^mock-[A-Z]+-\d+$/.test(result.orderId)).toBe(true);
  });

  it('exposes opened positions via getPositions and removes them on close', async () => {
    const adapter = createMockAdapter();
    await adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    });
    await adapter.openPosition({
      symbol: 'BTC', instrumentId: 'INST-100100', side: 'sell', amount: 200,
    });
    const before = await adapter.getPositions();
    expect(before).toHaveLength(2);
    expect(before.map((p) => p.symbol).sort()).toEqual(['AAPL', 'BTC']);

    await adapter.closePosition(before[0].positionId);
    const after = await adapter.getPositions();
    expect(after).toHaveLength(1);
    expect(after[0].positionId).toBe(before[1].positionId);
  });

  it('tracks open and close counts for test introspection', async () => {
    const adapter = createMockAdapter();
    expect(adapter.openCount()).toBe(0);
    expect(adapter.closeCount()).toBe(0);

    await adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    });
    const pos = (await adapter.getPositions())[0];
    await adapter.closePosition(pos.positionId);

    expect(adapter.openCount()).toBe(1);
    expect(adapter.closeCount()).toBe(1);
  });

  it('reset clears positions and resequences IDs from 1', async () => {
    const adapter = createMockAdapter();
    await adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    });
    adapter.reset();
    expect(await adapter.getPositions()).toEqual([]);
    expect(adapter.openCount()).toBe(0);

    const post = await adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    });
    expect(post.orderId).toBe('mock-AAPL-1');
  });
});
