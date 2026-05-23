import { EtoroClientAdapter } from '../etoro-adapter';

interface MinimalEtoroClient {
  trading: {
    openPosition: jest.Mock;
    closePosition: jest.Mock;
    getOpenPositions: jest.Mock;
  };
  getMode: () => string;
}

function mockClient(overrides?: Partial<MinimalEtoroClient>): MinimalEtoroClient {
  return {
    trading: {
      openPosition: jest.fn().mockResolvedValue({
        orderId: 'etoro-order-1',
        positionId: 'pos-1',
        symbol: 'AAPL',
        side: 'buy',
        amount: 50,
        executionPrice: 200,
        timestamp: 1700000000000,
        status: 'filled',
      }),
      closePosition: jest.fn().mockResolvedValue({
        orderId: 'etoro-order-close-1',
      }),
      getOpenPositions: jest.fn().mockResolvedValue([
        {
          positionId: 'pos-1',
          instrumentId: '1001',
          symbol: 'AAPL',
          side: 'buy',
          amount: 50,
          openPrice: 195,
          currentPrice: 200,
          pnl: 250,
          leverage: 1,
          openTimestamp: 1700000000000,
        },
      ]),
    },
    getMode: () => 'demo',
    ...overrides,
  };
}

describe('EtoroClientAdapter', () => {
  it('exposes the wrapped client mode', () => {
    const client = mockClient();
    const adapter = new EtoroClientAdapter(client as unknown as never);
    expect(adapter.getMode()).toBe('demo');
  });

  it('openPosition forwards { symbol, instrumentId, side, amount } unchanged', async () => {
    const client = mockClient();
    const adapter = new EtoroClientAdapter(client as unknown as never);

    const result = await adapter.openPosition({
      symbol: 'AAPL',
      instrumentId: '1001',
      side: 'buy',
      amount: 50,
    });

    expect(client.trading.openPosition).toHaveBeenCalledWith({
      symbol: 'AAPL',
      instrumentId: '1001',
      side: 'buy',
      amount: 50,
    });
    expect(result.orderId).toBe('etoro-order-1');
    expect(result.status).toBe('filled');
  });

  it('getPositions maps Position[] to adapter shape { positionId, symbol, side, amount }', async () => {
    const client = mockClient();
    const adapter = new EtoroClientAdapter(client as unknown as never);

    const positions = await adapter.getPositions();
    expect(positions).toEqual([
      { positionId: 'pos-1', symbol: 'AAPL', side: 'buy', amount: 50 },
    ]);
  });

  it('closePosition forwards positionId and surfaces orderId', async () => {
    const client = mockClient();
    const adapter = new EtoroClientAdapter(client as unknown as never);

    const result = await adapter.closePosition('pos-1');
    expect(client.trading.closePosition).toHaveBeenCalledWith('pos-1');
    expect(result.orderId).toBe('etoro-order-close-1');
  });
});
