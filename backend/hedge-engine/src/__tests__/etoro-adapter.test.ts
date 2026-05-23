import { EtoroClient } from '@goodchain/etoro-client';
import {
  ReadOnlyAdapterError,
  createEtoroBackedAdapter,
  createReadOnlyAdapter,
} from '../etoro-adapter';

/**
 * Minimal stand-in for `EtoroClient` shaped against the only fields the
 * adapter actually invokes. Lets the test pin the wire-up contract
 * without spinning up axios.
 */
function stubClient(): EtoroClient {
  const trading = {
    openPosition: jest.fn().mockResolvedValue({
      orderId: 'ORD-42',
      positionId: 'POS-42',
      status: 'filled',
      symbol: 'AAPL',
      side: 'buy',
      amount: 100,
      executionPrice: 185.5,
      timestamp: 1700000000000,
    }),
    closePosition: jest.fn().mockResolvedValue({
      orderId: 'ORD-close-42',
      positionId: 'POS-42',
      status: 'filled',
      symbol: 'AAPL',
      side: 'sell',
      amount: 100,
      executionPrice: 187.0,
      timestamp: 1700000000001,
    }),
    getOpenPositions: jest.fn().mockResolvedValue([
      {
        positionId: 'POS-1',
        symbol: 'AAPL',
        side: 'buy',
        amount: 50,
        instrumentId: 'INST-1001',
        openPrice: 180,
        currentPrice: 185,
        pnl: 250,
        leverage: 1,
        openTimestamp: 1700000000000,
      },
      {
        positionId: 'POS-2',
        symbol: 'BTC',
        side: 'sell',
        amount: 0.5,
        instrumentId: 'INST-100100',
        openPrice: 60000,
        currentPrice: 59000,
        pnl: 500,
        leverage: 1,
        openTimestamp: 1700000001000,
      },
    ]),
  };
  return { trading } as unknown as EtoroClient;
}

describe('createEtoroBackedAdapter', () => {
  it('forwards openPosition arguments to client.trading.openPosition and surfaces orderId/status', async () => {
    const client = stubClient();
    const adapter = createEtoroBackedAdapter(client);

    const result = await adapter.openPosition({
      symbol: 'AAPL',
      instrumentId: 'INST-1001',
      side: 'buy',
      amount: 100,
      leverage: 2,
    });

    expect(client.trading.openPosition).toHaveBeenCalledWith({
      symbol: 'AAPL',
      instrumentId: 'INST-1001',
      side: 'buy',
      amount: 100,
      leverage: 2,
    });
    expect(result).toEqual({ orderId: 'ORD-42', status: 'filled' });
  });

  it('defaults leverage to 1 when the caller omits it', async () => {
    const client = stubClient();
    const adapter = createEtoroBackedAdapter(client);
    await adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    });
    expect(client.trading.openPosition).toHaveBeenCalledWith(
      expect.objectContaining({ leverage: 1 }),
    );
  });

  it('forwards closePosition and returns the SDK orderId unchanged', async () => {
    const client = stubClient();
    const adapter = createEtoroBackedAdapter(client);
    const result = await adapter.closePosition('POS-42');
    expect(client.trading.closePosition).toHaveBeenCalledWith('POS-42');
    expect(result).toEqual({ orderId: 'ORD-close-42' });
  });

  it('projects getOpenPositions onto the executor-shaped Position record', async () => {
    const client = stubClient();
    const adapter = createEtoroBackedAdapter(client);
    const positions = await adapter.getPositions();
    expect(positions).toEqual([
      { positionId: 'POS-1', symbol: 'AAPL', side: 'buy', amount: 50 },
      { positionId: 'POS-2', symbol: 'BTC', side: 'sell', amount: 0.5 },
    ]);
  });
});

describe('createReadOnlyAdapter', () => {
  it('throws ReadOnlyAdapterError on openPosition', async () => {
    const adapter = createReadOnlyAdapter();
    await expect(adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    })).rejects.toBeInstanceOf(ReadOnlyAdapterError);
  });

  it('throws ReadOnlyAdapterError on closePosition', async () => {
    const adapter = createReadOnlyAdapter();
    await expect(adapter.closePosition('POS-42')).rejects.toBeInstanceOf(ReadOnlyAdapterError);
  });

  it('returns an empty position book from getPositions', async () => {
    const adapter = createReadOnlyAdapter();
    expect(await adapter.getPositions()).toEqual([]);
  });

  it('error message names the lane invariants the operator violated', async () => {
    const adapter = createReadOnlyAdapter();
    try {
      await adapter.openPosition({
        symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
      });
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ReadOnlyAdapterError);
      const msg = (err as Error).message;
      expect(msg).toMatch(/openPosition/);
      expect(msg).toMatch(/demo-trading/);
      expect(msg).toMatch(/HEDGE_TRADING_ENABLED/);
    }
  });
});
