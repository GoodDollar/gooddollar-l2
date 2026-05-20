import { ExposureReader } from '../exposure-reader';
import { OnChainExposure } from '../types';

function makeExposure(symbol: string, netDelta: number): OnChainExposure {
  return {
    symbol,
    netDelta,
    absExposure: Math.abs(netDelta),
    blockNumber: 100,
    readTimestamp: Date.now(),
  };
}

describe('ExposureReader.getAllExposures', () => {
  it('returns all exposures when every symbol succeeds', async () => {
    const reader = Object.create(ExposureReader.prototype) as ExposureReader;
    jest.spyOn(reader, 'getExposure')
      .mockResolvedValueOnce(makeExposure('AAPL', 10000))
      .mockResolvedValueOnce(makeExposure('TSLA', -5000));

    const result = await reader.getAllExposures(['AAPL', 'TSLA']);

    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('AAPL');
    expect(result[1].symbol).toBe('TSLA');
  });

  it('returns successful exposures and skips failed ones', async () => {
    const reader = Object.create(ExposureReader.prototype) as ExposureReader;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.spyOn(reader, 'getExposure')
      .mockResolvedValueOnce(makeExposure('AAPL', 10000))
      .mockRejectedValueOnce(new Error('RPC timeout'))
      .mockResolvedValueOnce(makeExposure('NVDA', 3000));

    const result = await reader.getAllExposures(['AAPL', 'TSLA', 'NVDA']);

    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('AAPL');
    expect(result[1].symbol).toBe('NVDA');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('TSLA'),
      expect.stringContaining('RPC timeout'),
    );

    warnSpy.mockRestore();
  });

  it('returns empty array when all symbols fail', async () => {
    const reader = Object.create(ExposureReader.prototype) as ExposureReader;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.spyOn(reader, 'getExposure')
      .mockRejectedValueOnce(new Error('RPC down'))
      .mockRejectedValueOnce(new Error('RPC down'));

    const result = await reader.getAllExposures(['AAPL', 'TSLA']);

    expect(result).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });
});
