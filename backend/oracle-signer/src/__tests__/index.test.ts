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

  describe('in-flight guard', () => {
    function primeBuffer(service: OracleSignerService, symbol = 'AAPL'): void {
      service.getBuffer().update({
        source: 'etoro',
        symbol,
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
    }

    it('skips an overlapping tick while a previous submitBatch is still pending', async () => {
      const service = new OracleSignerService(makeConfig());
      let resolveFirst!: (value: unknown) => void;
      const slow = new Promise((res) => { resolveFirst = res; });
      const submit = service.getSubmitter().submitBatch as unknown as jest.Mock;
      submit.mockImplementationOnce(async () => {
        await slow;
        return { txHash: '0xabc', gasUsed: BigInt(1), symbolCount: 1, roundTripMs: 10 };
      });

      primeBuffer(service);
      const first = service.tick();
      // Re-prime so the second tick would have work, isolating the
      // guard as the reason it returns null.
      primeBuffer(service, 'TSLA');
      const second = await service.tick();
      expect(second).toBeNull();
      expect(service.overlappedTicks).toBe(1);
      expect(submit).toHaveBeenCalledTimes(1);

      resolveFirst({});
      await first;
      expect(submit).toHaveBeenCalledTimes(1);
    });

    it('clears the in-flight flag after a tx failure so the next tick can run', async () => {
      const service = new OracleSignerService(makeConfig());
      const submit = service.getSubmitter().submitBatch as unknown as jest.Mock;
      submit.mockRejectedValueOnce(new Error('boom'));

      primeBuffer(service);
      await expect(service.tick()).rejects.toThrow('boom');
      expect(service.inFlight).toBe(false);

      primeBuffer(service, 'TSLA');
      const result = await service.tick();
      expect(result).not.toBeNull();
    });

    it('anchors deviation gate to the submitted mid even when WS pushes arrive during a slow tx', async () => {
      // Slow submitBatch resolves only after we drive several WS quotes
      // onto AAPL. The post-confirm anchor must be the originally
      // submitted mid, not the latest WS push.
      const service = new OracleSignerService(makeConfig({ minDeviationBps: 10 }));
      let resolveSlow!: (value: unknown) => void;
      const slow = new Promise((res) => { resolveSlow = res; });
      const submit = service.getSubmitter().submitBatch as unknown as jest.Mock;
      submit.mockImplementationOnce(async () => {
        await slow;
        return { txHash: '0xslow', gasUsed: BigInt(1), symbolCount: 1, roundTripMs: 5_000 };
      });

      const submittedMid = 191.50;
      service.getBuffer().update({
        source: 'etoro', symbol: 'AAPL', instrumentId: '1',
        bid: submittedMid - 0.01, ask: submittedMid + 0.01,
        mid: submittedMid, last: submittedMid,
        timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false,
      });

      const tickPromise = service.tick();

      // WS pushes arrive while the previous tx is in flight.
      for (const mid of [191.55, 191.62, 191.99]) {
        service.getBuffer().update({
          source: 'etoro', symbol: 'AAPL', instrumentId: '1',
          bid: mid - 0.01, ask: mid + 0.01, mid, last: mid,
          timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false,
        });
      }

      resolveSlow({});
      await tickPromise;

      // 191.65 vs anchor 191.50 = 7.83 bps, below 10 bps threshold.
      // If the buggy behavior had persisted (anchor = 191.99), the
      // symbol would still be emitted at 191.65 (17.7 bps).
      service.getBuffer().update({
        source: 'etoro', symbol: 'AAPL', instrumentId: '1',
        bid: 191.64, ask: 191.66, mid: 191.65, last: 191.65,
        timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false,
      });
      const pending = service.getBuffer().getPendingUpdates();
      expect(pending).toHaveLength(0);
    });

    it('skips markSubmitted on a reverted submitBatch so the next tick retries the same symbols', async () => {
      const service = new OracleSignerService(makeConfig({ minDeviationBps: 10 }));
      const submit = service.getSubmitter().submitBatch as unknown as jest.Mock;
      submit.mockRejectedValueOnce(
        new Error('Transaction reverted on-chain (tx: 0xrev, status: 0, ...)'),
      );

      primeBuffer(service);
      await expect(service.tick()).rejects.toThrow(/reverted on-chain/);

      // After a revert the deviation gate must still consider the
      // symbol pending, because the on-chain price never moved. If
      // markSubmitted had been called, the freshly-anchored mid would
      // make `getPendingUpdates` return [] and the symbol would silently
      // fall behind on chain.
      const stillPending = service.getBuffer().getPendingUpdates();
      expect(stillPending.map((u) => u.symbol)).toContain('AAPL');
    });

    it('overlappedTicks stays at 0 when ticks do not overlap', async () => {
      const service = new OracleSignerService(makeConfig());
      primeBuffer(service);
      await service.tick();
      primeBuffer(service, 'TSLA');
      await service.tick();
      expect(service.overlappedTicks).toBe(0);
    });
  });

  describe('stuck-tick watchdog', () => {
    const origStatus = process.env.SERVICE_HEALTH_STATUS;
    const origReason = process.env.SERVICE_DISABLED_REASON;

    beforeEach(() => {
      delete process.env.SERVICE_HEALTH_STATUS;
      delete process.env.SERVICE_DISABLED_REASON;
    });

    afterEach(() => {
      if (origStatus === undefined) delete process.env.SERVICE_HEALTH_STATUS;
      else process.env.SERVICE_HEALTH_STATUS = origStatus;
      if (origReason === undefined) delete process.env.SERVICE_DISABLED_REASON;
      else process.env.SERVICE_DISABLED_REASON = origReason;
    });

    it('flips SERVICE_HEALTH_STATUS to degraded when a tick exceeds 2x txTimeoutMs', async () => {
      const service = new OracleSignerService(makeConfig({
        txTimeoutMs: 50,
        updateIntervalMs: 1_000_000,
      }));
      let resolveSlow!: (value: unknown) => void;
      const slow = new Promise((res) => { resolveSlow = res; });
      const submit = service.getSubmitter().submitBatch as unknown as jest.Mock;
      submit.mockImplementationOnce(async () => {
        await slow;
        return { txHash: '0x', gasUsed: BigInt(0), symbolCount: 1, roundTripMs: 0 };
      });

      service.getBuffer().update({
        source: 'etoro', symbol: 'AAPL', instrumentId: '1',
        bid: 1, ask: 1.01, mid: 1.005, last: 1.005,
        timestamp: Date.now(), sessionState: 'open', confidence: 90, stale: false,
      });

      await service.start();
      const tickPromise = service.tick();
      await new Promise((r) => setTimeout(r, 250));
      expect(process.env.SERVICE_HEALTH_STATUS).toBe('degraded');
      expect(process.env.SERVICE_DISABLED_REASON).toMatch(/tick stuck >.+ms/);

      resolveSlow({});
      await tickPromise;
      // Watchdog clears its own degrade marker once the tick completes.
      await new Promise((r) => setTimeout(r, 100));
      expect(process.env.SERVICE_HEALTH_STATUS).toBeUndefined();
      expect(process.env.SERVICE_DISABLED_REASON).toBeUndefined();
      service.stop();
    });

    it('does not flip degraded for ticks that complete within the threshold', async () => {
      const service = new OracleSignerService(makeConfig({
        txTimeoutMs: 5_000,
        updateIntervalMs: 1_000_000,
      }));
      service.getBuffer().update({
        source: 'etoro', symbol: 'AAPL', instrumentId: '1',
        bid: 1, ask: 1.01, mid: 1.005, last: 1.005,
        timestamp: Date.now(), sessionState: 'open', confidence: 90, stale: false,
      });

      await service.start();
      await service.tick();
      await new Promise((r) => setTimeout(r, 50));
      expect(process.env.SERVICE_HEALTH_STATUS).toBeUndefined();
      service.stop();
    });

    it('does not clobber a pre-existing non-watchdog degrade reason', async () => {
      process.env.SERVICE_HEALTH_STATUS = 'degraded';
      process.env.SERVICE_DISABLED_REASON = 'Unknown symbols: FOO';

      const service = new OracleSignerService(makeConfig({
        txTimeoutMs: 5_000,
        updateIntervalMs: 1_000_000,
      }));
      service.getBuffer().update({
        source: 'etoro', symbol: 'AAPL', instrumentId: '1',
        bid: 1, ask: 1.01, mid: 1.005, last: 1.005,
        timestamp: Date.now(), sessionState: 'open', confidence: 90, stale: false,
      });

      await service.start();
      await service.tick();
      await new Promise((r) => setTimeout(r, 50));
      expect(process.env.SERVICE_HEALTH_STATUS).toBe('degraded');
      expect(process.env.SERVICE_DISABLED_REASON).toBe('Unknown symbols: FOO');
      service.stop();
    });
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
