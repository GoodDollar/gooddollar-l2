import { loadConfig, OracleSignerService } from '../index';
import { OracleSignerConfig } from '../types';
import { DEFAULT_LANE_SYMBOLS } from '@goodchain/etoro-client';

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
    priceServiceUrl: 'ws://localhost:9301',
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

  it('loadConfig defaults symbols to DEFAULT_LANE_SYMBOLS when ORACLE_SYMBOLS unset', () => {
    const env: NodeJS.ProcessEnv = {
      ORACLE_SIGNER_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      RPC_URL: 'https://rpc.example.com',
    };
    const config = loadConfig(env);
    expect(config.symbols).toEqual([...DEFAULT_LANE_SYMBOLS]);
    expect(env.SERVICE_HEALTH_STATUS).toBeUndefined();
  });

  // Anchors the default URL to the producer's canonical WS port
  // (backend/price-service src/types.ts DEFAULT_CONFIG.wsPort).
  // Regression guard against drift back to a port nothing listens on.
  it('loadConfig defaults priceServiceUrl to the price-service WS broadcaster port', () => {
    const env: NodeJS.ProcessEnv = {
      ORACLE_SIGNER_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    };
    const config = loadConfig(env);
    expect(config.priceServiceUrl).toBe('ws://localhost:9301');
  });

  it('loadConfig prefers PRICE_SERVICE_URL when set', () => {
    const env: NodeJS.ProcessEnv = {
      ORACLE_SIGNER_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      PRICE_SERVICE_URL: 'ws://upstream.example.com:1234',
    };
    const config = loadConfig(env);
    expect(config.priceServiceUrl).toBe('ws://upstream.example.com:1234');
  });

  it('loadConfig degrades + filters out unknown symbols passed via ORACLE_SYMBOLS', () => {
    const env: NodeJS.ProcessEnv = {
      ORACLE_SIGNER_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      RPC_URL: 'https://rpc.example.com',
      ORACLE_SYMBOLS: 'MSFT,BTC,AAPL',
    };
    const config = loadConfig(env);
    expect(config.symbols).toEqual(['BTC', 'AAPL']);
    expect(env.SERVICE_HEALTH_STATUS).toBe('degraded');
    expect(env.SERVICE_DISABLED_REASON).toBe('Unknown symbols: MSFT');
  });

  it('loadConfig honors RPC_URL alias for parity with hedge-engine + .env.example', () => {
    const env: NodeJS.ProcessEnv = {
      ORACLE_SIGNER_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      RPC_URL: 'https://goerli.example.com',
    };
    const config = loadConfig(env);
    expect(config.rpcUrl).toBe('https://goerli.example.com');
    expect(env.SERVICE_HEALTH_STATUS).toBeUndefined();
  });

  it('loadConfig prefers L2_RPC_URL over RPC_URL (documented precedence)', () => {
    const env: NodeJS.ProcessEnv = {
      ORACLE_SIGNER_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      L2_RPC_URL: 'https://l2.example.com',
      RPC_URL: 'https://l1.example.com',
    };
    expect(loadConfig(env).rpcUrl).toBe('https://l2.example.com');
  });

  it('loadConfig degrades when both L2_RPC_URL and RPC_URL are unset', () => {
    const env: NodeJS.ProcessEnv = {
      ORACLE_SIGNER_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    };
    const config = loadConfig(env);
    expect(config.rpcUrl).toBe('http://localhost:8545');
    expect(env.SERVICE_HEALTH_STATUS).toBe('degraded');
    expect(env.SERVICE_DISABLED_REASON).toMatch(/L2_RPC_URL\/RPC_URL/);
  });

  it('loadConfig ignores the legacy `RPC` typo (alias dropped)', () => {
    const env: NodeJS.ProcessEnv = {
      ORACLE_SIGNER_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      RPC: 'https://typo.example.com',
    };
    const config = loadConfig(env);
    expect(config.rpcUrl).toBe('http://localhost:8545');
    expect(env.SERVICE_HEALTH_STATUS).toBe('degraded');
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
