import { createEtoroAdapter, EtoroClientLike } from '../etoro-adapter';

function makeClient(mode: 'sandbox' | 'real'): EtoroClientLike {
  const openPosition = jest.fn().mockResolvedValue({ orderId: 'ORD-1', status: 'filled' });
  const closePosition = jest.fn().mockResolvedValue({ orderId: 'ORD-CLOSE-1' });
  const getOpenPositions = jest.fn().mockResolvedValue([
    { positionId: 'P1', symbol: 'AAPL', side: 'buy' as const, amount: 5 },
  ]);
  return {
    getMode: () => mode,
    trading: { openPosition, closePosition, getOpenPositions },
  };
}

describe('createEtoroAdapter', () => {
  it('openPosition forwards args and returns { orderId, status }', async () => {
    const client = makeClient('sandbox');
    const adapter = createEtoroAdapter(client);

    const result = await adapter.openPosition({
      symbol: 'AAPL',
      instrumentId: 'INST-AAPL',
      side: 'buy',
      amount: 7,
    });

    expect(result).toEqual({ orderId: 'ORD-1', status: 'filled' });
    expect(client.trading.openPosition).toHaveBeenCalledWith({
      symbol: 'AAPL',
      instrumentId: 'INST-AAPL',
      side: 'buy',
      amount: 7,
    });
  });

  it('calls assertDemoMode BEFORE openPosition', async () => {
    const client = makeClient('sandbox');
    const assertDemoMode = jest.fn();
    const adapter = createEtoroAdapter(client, { assertDemoMode });
    await adapter.openPosition({ symbol: 'AAPL', instrumentId: 'INST-AAPL', side: 'buy', amount: 1 });
    expect(assertDemoMode).toHaveBeenCalledWith('sandbox');
    expect(assertDemoMode).toHaveBeenCalled();
  });

  it('rejects when assertDemoMode throws (real mode default)', async () => {
    const client = makeClient('real');
    const adapter = createEtoroAdapter(client);

    await expect(
      adapter.openPosition({ symbol: 'AAPL', instrumentId: 'INST-AAPL', side: 'buy', amount: 1 }),
    ).rejects.toThrow(/REAL_TRADING_ENABLED|Refusing real-mode/);

    expect(client.trading.openPosition).not.toHaveBeenCalled();
  });

  it('getPositions maps the underlying shape', async () => {
    const client = makeClient('sandbox');
    const adapter = createEtoroAdapter(client);
    const positions = await adapter.getPositions();
    expect(positions).toEqual([
      { positionId: 'P1', symbol: 'AAPL', side: 'buy', amount: 5 },
    ]);
  });

  it('closePosition forwards positionId', async () => {
    const client = makeClient('sandbox');
    const adapter = createEtoroAdapter(client);
    const r = await adapter.closePosition('P1');
    expect(r.orderId).toBe('ORD-CLOSE-1');
    expect(client.trading.closePosition).toHaveBeenCalledWith('P1');
  });
});
