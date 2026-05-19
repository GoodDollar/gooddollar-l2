import { fetchPrices, TokenMapping } from '../index';

const TOKENS: TokenMapping[] = [
  { address: '0xaaa', coingeckoId: 'gooddollar', symbol: 'G$' },
  { address: '0xbbb', coingeckoId: 'ethereum', symbol: 'WETH' },
  { address: '0xccc', coingeckoId: 'usd-coin', symbol: 'USDC' },
];

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('fetchPrices', () => {
  it('returns prices for all tokens on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        gooddollar: { usd: 0.00015 },
        ethereum: { usd: 3200.50 },
        'usd-coin': { usd: 1.0001 },
      }),
    });

    const results = await fetchPrices(TOKENS);

    expect(results).toHaveLength(3);
    expect(results[0].token.symbol).toBe('G$');
    expect(results[0].priceUsd).toBe(0.00015);
    expect(results[0].priceChainlink).toBe(BigInt(Math.round(0.00015 * 1e8)));

    expect(results[1].token.symbol).toBe('WETH');
    expect(results[1].priceUsd).toBe(3200.50);
    expect(results[1].priceChainlink).toBe(BigInt(Math.round(3200.50 * 1e8)));

    expect(results[2].token.symbol).toBe('USDC');
    expect(results[2].priceUsd).toBe(1.0001);
  });

  it('builds the correct CoinGecko URL', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await fetchPrices(TOKENS);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.coingecko.com/api/v3/simple/price?ids=gooddollar,ethereum,usd-coin&vs_currencies=usd',
    );
  });

  it('skips tokens missing from the API response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ethereum: { usd: 3200 },
        // gooddollar and usd-coin missing
      }),
    });

    const results = await fetchPrices(TOKENS);
    expect(results).toHaveLength(1);
    expect(results[0].token.symbol).toBe('WETH');
  });

  it('returns empty array on HTTP error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    const results = await fetchPrices(TOKENS);
    expect(results).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const results = await fetchPrices(TOKENS);
    expect(results).toEqual([]);
  });

  it('handles empty token list', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const results = await fetchPrices([]);
    expect(results).toEqual([]);
  });
});
