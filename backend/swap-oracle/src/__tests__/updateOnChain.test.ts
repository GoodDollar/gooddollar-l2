import { updateOnChain, resetLastPrices, lastPrices, PriceResult, TokenMapping } from '../index';

beforeEach(() => {
  resetLastPrices();
});

function makeResult(symbol: string, address: string, priceUsd: number): PriceResult {
  return {
    token: { address, coingeckoId: symbol.toLowerCase(), symbol } as TokenMapping,
    priceUsd,
    priceChainlink: BigInt(Math.round(priceUsd * 1e8)),
  };
}

function mockOracle() {
  return {
    batchUpdatePrices: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({ hash: '0xabc', gasUsed: 50000n }),
    }),
    updatePrice: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({ hash: '0xdef', gasUsed: 30000n }),
    }),
  };
}

describe('updateOnChain', () => {
  it('calls batchUpdatePrices for deviated tokens', async () => {
    const oracle = mockOracle();
    const results = [
      makeResult('WETH', '0xaaa', 3200),
      makeResult('USDC', '0xbbb', 1.0),
    ];

    await updateOnChain(oracle as any, results);

    expect(oracle.batchUpdatePrices).toHaveBeenCalledTimes(1);
    const [addresses, prices] = oracle.batchUpdatePrices.mock.calls[0];
    expect(addresses).toEqual(['0xaaa', '0xbbb']);
    expect(prices).toEqual([320000000000n, 100000000n]);
  });

  it('updates lastPrices after successful batch', async () => {
    const oracle = mockOracle();
    const results = [makeResult('WETH', '0xaaa', 3200)];

    await updateOnChain(oracle as any, results);

    expect(lastPrices.get('0xaaa')).toBe(320000000000n);
  });

  it('skips update when no tokens have deviated enough', async () => {
    lastPrices.set('0xaaa', 320000000000n);
    const oracle = mockOracle();
    const results = [makeResult('WETH', '0xaaa', 3200)]; // same price

    await updateOnChain(oracle as any, results);

    expect(oracle.batchUpdatePrices).not.toHaveBeenCalled();
  });

  it('falls back to individual updates when batch fails', async () => {
    const oracle = mockOracle();
    oracle.batchUpdatePrices.mockRejectedValue(new Error('batch reverted'));

    const results = [
      makeResult('WETH', '0xaaa', 3200),
      makeResult('USDC', '0xbbb', 1.0),
    ];

    await updateOnChain(oracle as any, results);

    expect(oracle.batchUpdatePrices).toHaveBeenCalledTimes(1);
    expect(oracle.updatePrice).toHaveBeenCalledTimes(2);
    expect(oracle.updatePrice).toHaveBeenCalledWith('0xaaa', 320000000000n);
    expect(oracle.updatePrice).toHaveBeenCalledWith('0xbbb', 100000000n);
  });

  it('updates lastPrices for successful individual updates', async () => {
    const oracle = mockOracle();
    oracle.batchUpdatePrices.mockRejectedValue(new Error('batch reverted'));

    const results = [makeResult('WETH', '0xaaa', 3200)];
    await updateOnChain(oracle as any, results);

    expect(lastPrices.get('0xaaa')).toBe(320000000000n);
  });

  it('handles individual update failures gracefully', async () => {
    const oracle = mockOracle();
    oracle.batchUpdatePrices.mockRejectedValue(new Error('batch reverted'));
    oracle.updatePrice.mockRejectedValue(new Error('individual reverted'));

    const results = [makeResult('WETH', '0xaaa', 3200)];
    await updateOnChain(oracle as any, results);

    expect(lastPrices.has('0xaaa')).toBe(false);
  });

  it('handles empty results array', async () => {
    const oracle = mockOracle();
    await updateOnChain(oracle as any, []);
    expect(oracle.batchUpdatePrices).not.toHaveBeenCalled();
  });
});
