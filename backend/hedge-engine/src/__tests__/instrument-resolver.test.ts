import { InstrumentResolver } from '../instrument-resolver';

describe('InstrumentResolver', () => {
  it('resolves a symbol present in the env map without hitting marketData', async () => {
    const marketData = { getInstrument: jest.fn() };
    const resolver = new InstrumentResolver(
      new Map([['AAPL', '1001']]),
      marketData,
    );
    expect(await resolver.resolve('AAPL')).toBe('1001');
    expect(marketData.getInstrument).not.toHaveBeenCalled();
  });

  it('falls back to marketData when symbol is missing from env map', async () => {
    const marketData = {
      getInstrument: jest.fn().mockResolvedValue({
        instrumentId: '9999',
        symbol: 'TSLA',
      }),
    };
    const resolver = new InstrumentResolver(new Map(), marketData);
    expect(await resolver.resolve('TSLA')).toBe('9999');
    expect(marketData.getInstrument).toHaveBeenCalledWith('TSLA');
  });

  it('returns null when both env map and marketData fail to resolve', async () => {
    const marketData = { getInstrument: jest.fn().mockResolvedValue(null) };
    const resolver = new InstrumentResolver(new Map(), marketData);
    expect(await resolver.resolve('UNKNOWN')).toBeNull();
  });

  it('returns null when env map empty and no marketData provided', async () => {
    const resolver = new InstrumentResolver(new Map(), null);
    expect(await resolver.resolve('TSLA')).toBeNull();
  });

  it('env map takes precedence over marketData (operator override)', async () => {
    const marketData = {
      getInstrument: jest.fn().mockResolvedValue({ instrumentId: 'live-9999', symbol: 'AAPL' }),
    };
    const resolver = new InstrumentResolver(
      new Map([['AAPL', 'env-1001']]),
      marketData,
    );
    expect(await resolver.resolve('AAPL')).toBe('env-1001');
    expect(marketData.getInstrument).not.toHaveBeenCalled();
  });

  it('caches per-symbol: second resolve does not hit marketData', async () => {
    const marketData = {
      getInstrument: jest.fn().mockResolvedValue({ instrumentId: '42', symbol: 'TSLA' }),
    };
    const resolver = new InstrumentResolver(new Map(), marketData);
    await resolver.resolve('TSLA');
    await resolver.resolve('TSLA');
    expect(marketData.getInstrument).toHaveBeenCalledTimes(1);
  });

  it('tolerates a marketData throw and returns null instead of propagating', async () => {
    const marketData = {
      getInstrument: jest.fn().mockRejectedValue(new Error('network down')),
    };
    const resolver = new InstrumentResolver(new Map(), marketData);
    expect(await resolver.resolve('TSLA')).toBeNull();
  });
});
