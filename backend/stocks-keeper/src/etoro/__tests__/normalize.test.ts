import { normalizeInstrument, normalizeQuote, toOraclePriceUpdate, toPriceE8 } from '../normalize';

describe('eToro GoodChain normalization', () => {
  it('normalizes instruments into stable GoodChain identifiers', () => {
    const instrument = normalizeInstrument({
      instrumentId: 1001,
      symbol: 'aapl',
      displayName: 'Apple Inc.',
      exchange: 'NASDAQ',
      currency: 'usd',
      instrumentType: 'Stocks',
    });

    expect(instrument).toMatchObject({
      instrumentId: '1001',
      symbol: 'AAPL',
      ticker: 'AAPL',
      exchange: 'NASDAQ',
      currency: 'USD',
      assetClass: 'equity',
      source: 'etoro',
    });
  });

  it('normalizes bid/ask quotes into 8-decimal oracle-ready prices', () => {
    const quote = normalizeQuote(
      {
        instrumentId: 1001,
        symbol: 'AAPL',
        bid: '199.10',
        ask: 199.30,
        timestamp: 1779196800000,
      },
      { exchange: 'NASDAQ', currency: 'USD', assetClass: 'equity' },
      { now: 1779196810000 },
    );

    expect(quote.goodChainKey).toBe('ETORO:NASDAQ:AAPL');
    expect(quote.price).toBeCloseTo(199.2);
    expect(quote.priceE8).toBe(19_920_000_000n);
    expect(quote.stale).toBe(false);

    const oracleUpdate = toOraclePriceUpdate(quote);
    expect(oracleUpdate).toMatchObject({ ticker: 'AAPL', source: 'etoro', instrumentId: '1001' });
    expect(oracleUpdate.priceChainlink).toBe(19_920_000_000n);
  });

  it('rejects invalid or missing prices', () => {
    expect(() => toPriceE8(0)).toThrow('Invalid market price');
    expect(() => normalizeQuote({ symbol: 'TSLA' })).toThrow('Missing valid eToro price');
  });
});
