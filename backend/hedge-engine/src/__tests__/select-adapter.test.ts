import { EtoroClient, EtoroMode } from '@goodchain/etoro-client';
import { selectAdapter } from '../select-adapter';
import { ReadOnlyAdapterError } from '../etoro-adapter';

function stubClient(): EtoroClient {
  const trading = {
    openPosition: jest.fn().mockResolvedValue({ orderId: 'X', status: 'filled' }),
    closePosition: jest.fn().mockResolvedValue({ orderId: 'X' }),
    getOpenPositions: jest.fn().mockResolvedValue([]),
  };
  return { trading } as unknown as EtoroClient;
}

describe('selectAdapter', () => {
  it('mock mode returns a non-readonly MockAdapter', async () => {
    const calls: number[] = [];
    const sel = selectAdapter({
      mode: 'mock',
      tradingEnabled: false,
      clientFactory: () => { calls.push(1); return stubClient(); },
    });

    expect(sel.readOnly).toBe(false);
    expect(sel.reason).toBeUndefined();
    expect(calls).toHaveLength(0);

    const result = await sel.adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    });
    expect(result.orderId).toBe('mock-AAPL-1');
  });

  it('demo-trading + tradingEnabled returns an EtoroClient-backed adapter and invokes the factory once', async () => {
    const client = stubClient();
    let factoryCalls = 0;
    const sel = selectAdapter({
      mode: 'demo-trading',
      tradingEnabled: true,
      clientFactory: () => { factoryCalls++; return client; },
    });

    expect(sel.readOnly).toBe(false);
    expect(factoryCalls).toBe(1);

    await sel.adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100, leverage: 2,
    });
    expect(client.trading.openPosition).toHaveBeenCalledTimes(1);
  });

  it('demo-trading + !tradingEnabled returns the read-only sentinel + degradation reason', async () => {
    const sel = selectAdapter({
      mode: 'demo-trading',
      tradingEnabled: false,
      clientFactory: () => { throw new Error('factory must not run in read-only branch'); },
    });

    expect(sel.readOnly).toBe(true);
    expect(sel.reason).toMatch(/HEDGE_TRADING_ENABLED/);
    await expect(sel.adapter.openPosition({
      symbol: 'AAPL', instrumentId: 'INST-1001', side: 'buy', amount: 100,
    })).rejects.toBeInstanceOf(ReadOnlyAdapterError);
  });

  it.each<EtoroMode>(['demo-readonly', 'real-disabled'])(
    '%s returns the read-only sentinel and never invokes the client factory',
    async (mode) => {
      let factoryCalls = 0;
      const sel = selectAdapter({
        mode,
        tradingEnabled: false,
        clientFactory: () => { factoryCalls++; return stubClient(); },
      });

      expect(sel.readOnly).toBe(true);
      expect(sel.reason).toBeDefined();
      expect(factoryCalls).toBe(0);
      await expect(sel.adapter.closePosition('POS-1'))
        .rejects.toBeInstanceOf(ReadOnlyAdapterError);
      expect(await sel.adapter.getPositions()).toEqual([]);
    },
  );

  it('does not allow ignoring tradingEnabled in non-demo-trading modes', () => {
    // tradingEnabled=true on the wrong mode must not magically promote it.
    const sel = selectAdapter({
      mode: 'demo-readonly',
      tradingEnabled: true,
      clientFactory: () => stubClient(),
    });
    expect(sel.readOnly).toBe(true);
  });
});
