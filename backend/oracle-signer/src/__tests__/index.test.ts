import { OracleSignerService } from '../index';
import { OracleSignerConfig } from '../types';

jest.mock('../oracle-submitter', () => {
  return {
    OracleSubmitter: jest.fn().mockImplementation(() => ({
      signerAddress: '0x1111111111111111111111111111111111111111',
      submitBatch: jest.fn().mockImplementation((updates: unknown[]) => Promise.resolve({
        txHash: '0xabc123',
        gasUsed: BigInt(150000),
        symbolCount: Array.isArray(updates) ? updates.length : 0,
        roundTripMs: 100,
      })),
      getPrice: jest.fn().mockResolvedValue(BigInt(19_150_000_000)),
    })),
  };
});

jest.mock('../price-ws-client', () => {
  return {
    PriceWsClient: jest.fn().mockImplementation((_url: string, onQuote: (q: unknown) => void) => {
      return {
        connect: jest.fn(),
        close: jest.fn(),
        connected: true,
        _onQuote: onQuote,
      };
    }),
  };
});

function makeConfig(overrides: Partial<OracleSignerConfig> = {}): OracleSignerConfig {
  return {
    priceServiceUrl: 'ws://localhost:4001',
    rpcUrl: 'http://localhost:8545',
    oracleAddress: '0x0000000000000000000000000000000000000001',
    signerKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    updateIntervalMs: 60000,
    minDeviationBps: 0,
    txTimeoutMs: 60000,
    symbols: ['AAPL', 'TSLA'],
    ...overrides,
  };
}

describe('OracleSignerService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('starts and stops cleanly', async () => {
    const service = new OracleSignerService(makeConfig());
    await service.start();
    expect(service.isRunning).toBe(true);

    service.stop();
    expect(service.isRunning).toBe(false);
  });

  it('tick returns null when no quotes buffered', async () => {
    const service = new OracleSignerService(makeConfig());
    const result = await service.tick();
    expect(result).toBeNull();
  });

  it('tick submits buffered quotes', async () => {
    const service = new OracleSignerService(makeConfig());

    service.getBuffer().update({
      source: 'etoro',
      symbol: 'AAPL',
      instrumentId: '1',
      bid: 191.49,
      ask: 191.51,
      mid: 191.50,
      last: 191.50,
      timestamp: Date.now(),
      sessionState: 'open',
      confidence: 95,
      stale: false,
    });

    const result = await service.tick();
    expect(result).not.toBeNull();
    expect(result?.txHash).toBe('0xabc123');
    expect(result?.symbolCount).toBe(1);
    expect(service.totalUpdates).toBe(1);
  });

  it('filters symbols not in config', async () => {
    const config = makeConfig({ symbols: ['AAPL'] });
    const service = new OracleSignerService(config);
    await service.start();

    // Simulate WS quote for a non-configured symbol
    const wsClient = (service as any).wsClient;
    wsClient._onQuote({
      source: 'etoro',
      symbol: 'GOOGL',
      instrumentId: '2',
      bid: 175.79,
      ask: 175.81,
      mid: 175.80,
      last: 175.80,
      timestamp: Date.now(),
      sessionState: 'open',
      confidence: 90,
      stale: false,
    });

    expect(service.getBuffer().getLatestQuote('GOOGL')).toBeUndefined();

    wsClient._onQuote({
      source: 'etoro',
      symbol: 'AAPL',
      instrumentId: '1',
      bid: 191.49,
      ask: 191.51,
      mid: 191.50,
      last: 191.50,
      timestamp: Date.now(),
      sessionState: 'open',
      confidence: 95,
      stale: false,
    });

    expect(service.getBuffer().getLatestQuote('AAPL')).toBeDefined();

    service.stop();
  });

  it('accepts all symbols when config list is empty', async () => {
    const config = makeConfig({ symbols: [] });
    const service = new OracleSignerService(config);
    await service.start();

    const wsClient = (service as any).wsClient;
    wsClient._onQuote({
      source: 'etoro',
      symbol: 'GOOGL',
      instrumentId: '2',
      bid: 175.79,
      ask: 175.81,
      mid: 175.80,
      last: 175.80,
      timestamp: Date.now(),
      sessionState: 'open',
      confidence: 90,
      stale: false,
    });

    expect(service.getBuffer().getLatestQuote('GOOGL')).toBeDefined();
    service.stop();
  });
});
