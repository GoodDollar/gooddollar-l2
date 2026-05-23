import { OracleSignerService, OracleSignerDeps } from '../index';
import { OracleSignerConfig } from '../types';
import { AuditLog } from '../audit-log';

class NoopAuditLog extends AuditLog {
  constructor() { super({ dir: '/tmp/__never__' }); }
  async append(): Promise<void> { return; }
}
const noopDeps: OracleSignerDeps = { auditLog: new NoopAuditLog() };
function withDeps(extra: Partial<OracleSignerDeps> = {}): OracleSignerDeps {
  return { ...noopDeps, ...extra };
}

jest.mock('../oracle-submitter', () => {
  return {
    OracleSubmitter: jest.fn().mockImplementation(() => ({
      signerAddress: '0x1111111111111111111111111111111111111111',
      provider: { getNetwork: jest.fn().mockResolvedValue({ chainId: 31337n }) },
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
  const ZERO = {
    accepted: 0, droppedJsonParse: 0, droppedShape: 0,
    droppedInvalidMid: 0, droppedMissingSymbol: 0,
  };
  return {
    PriceWsClient: jest.fn().mockImplementation((_url: string, onQuote: (q: unknown) => void) => {
      return {
        connect: jest.fn(),
        close: jest.fn(),
        connected: true,
        _onQuote: onQuote,
        getStats: jest.fn(() => ({ ...ZERO })),
      };
    }),
    emptyIngestStats: () => ({ ...ZERO }),
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
    allowedChainIds: [31337, 1337],
    ...overrides,
  };
}

const ALLOWED_DEVNET = async () => 31337;

describe('OracleSignerService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('starts and stops cleanly', async () => {
    const service = new OracleSignerService(makeConfig(), withDeps({ getChainId: ALLOWED_DEVNET }));
    await service.start();
    expect(service.isRunning).toBe(true);

    service.stop();
    expect(service.isRunning).toBe(false);
  });

  it('tick returns null when no quotes buffered', async () => {
    const service = new OracleSignerService(makeConfig(), withDeps({ getChainId: ALLOWED_DEVNET }));
    const result = await service.tick();
    expect(result).toBeNull();
  });

  it('tick submits buffered quotes', async () => {
    const service = new OracleSignerService(makeConfig(), withDeps({ getChainId: ALLOWED_DEVNET }));

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
    const service = new OracleSignerService(config, withDeps({ getChainId: ALLOWED_DEVNET }));
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

  it('getProofSnapshot includes ingest counters merged from the WS client', () => {
    const service = new OracleSignerService(makeConfig(), withDeps({ getChainId: ALLOWED_DEVNET }));
    const snap = service.getProofSnapshot();
    expect(snap.ingest).toBeDefined();
    expect(snap.ingest!.accepted).toBe(0);
    expect(snap.ingest!.droppedJsonParse).toBe(0);
    expect(snap.ingest!.droppedShape).toBe(0);
    expect(snap.ingest!.droppedInvalidMid).toBe(0);
    expect(snap.ingest!.droppedMissingSymbol).toBe(0);
  });

  it('populates proof.chain with chainId + signerAddress + oracleAddresses after start()', async () => {
    const service = new OracleSignerService(
      makeConfig({ oracleAddress: '0xAA00000000000000000000000000000000000001' }),
      withDeps({ getChainId: ALLOWED_DEVNET }),
    );
    expect(service.getProofSnapshot().chain.chainId).toBeNull();

    await service.start();

    const snap = service.getProofSnapshot();
    expect(snap.chain.chainId).toBe(31337);
    expect(snap.chain.signerAddress).toBe('0x1111111111111111111111111111111111111111');
    expect(snap.chain.oracleAddresses.stocks).toBe('0xAA00000000000000000000000000000000000001');
    expect(snap.chain.oracleAddresses.crypto).toBeNull();
    expect(snap.chain.rpcEndpoint).toBe('http://localhost:8545/');

    service.stop();
  });

  it('chain.oracleAddresses.crypto is null when crypto rail not configured', async () => {
    const service = new OracleSignerService(makeConfig(), withDeps({ getChainId: ALLOWED_DEVNET }));
    await service.start();
    expect(service.getProofSnapshot().chain.oracleAddresses.crypto).toBeNull();
    service.stop();
  });

  it('chain.rpcEndpoint strips userinfo when rpcUrl contains credentials', async () => {
    const cfg = makeConfig({ rpcUrl: 'https://u:p@rpc.example.com/path' });
    const service = new OracleSignerService(cfg, withDeps({ getChainId: ALLOWED_DEVNET }));
    await service.start();
    const snap = service.getProofSnapshot();
    expect(snap.chain.rpcEndpoint).toBe('https://rpc.example.com/path');
    expect(JSON.stringify(snap)).not.toContain('u:p@');
    service.stop();
  });

  it('accepts all symbols when config list is empty', async () => {
    const config = makeConfig({ symbols: [] });
    const service = new OracleSignerService(config, withDeps({ getChainId: ALLOWED_DEVNET }));
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

  describe('chain-guard integration', () => {
    const origEnv = { ...process.env };
    afterEach(() => {
      delete process.env.SERVICE_HEALTH_STATUS;
      delete process.env.SERVICE_DISABLED_REASON;
      process.env = { ...origEnv };
    });

    it('refuses to start when chain id is not in allowlist', async () => {
      const service = new OracleSignerService(makeConfig(), withDeps({ getChainId: async () => 1 }));
      await service.start();
      expect(service.isRunning).toBe(false);
      expect(service.isRefused).toBe(true);
      expect(service.getRefusalReason()).toMatch(/non-devnet chain id 1/);
      expect(process.env.SERVICE_HEALTH_STATUS).toBe('degraded');
      expect(process.env.SERVICE_DISABLED_REASON).toContain('1');
    });

    it('does not connect WS or schedule interval when refused', async () => {
      const service = new OracleSignerService(makeConfig(), withDeps({ getChainId: async () => 1 }));
      await service.start();
      const wsClient = (service as any).wsClient;
      expect(wsClient.connect).not.toHaveBeenCalled();
      expect((service as any).stocksIntervalHandle).toBeNull();
      expect((service as any).cryptoIntervalHandle).toBeNull();
    });

    it('starts normally when chain id matches allowlist override', async () => {
      const service = new OracleSignerService(
        makeConfig({ allowedChainIds: [9999] }),
        withDeps({ getChainId: async () => 9999 }),
      );
      await service.start();
      expect(service.isRunning).toBe(true);
      expect(service.isRefused).toBe(false);
      service.stop();
    });

    it('refuses repeatedly: start() is idempotent on refusal', async () => {
      const service = new OracleSignerService(makeConfig(), withDeps({ getChainId: async () => 1 }));
      await service.start();
      await service.start();
      expect(service.isRefused).toBe(true);
      expect(service.isRunning).toBe(false);
    });

    it('marks degraded when getChainId throws (e.g. RPC unreachable)', async () => {
      const service = new OracleSignerService(makeConfig(), withDeps({
        getChainId: async () => { throw new Error('econnrefused'); },
      }));
      await service.start();
      expect(service.isRunning).toBe(false);
      expect(service.isRefused).toBe(true);
      expect(process.env.SERVICE_HEALTH_STATUS).toBe('degraded');
      expect(service.getRefusalReason()).toMatch(/chain-guard probe failed/);
    });
  });
});
