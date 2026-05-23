/**
 * Crypto-rail integration tests:
 * - submit is called with (address[], uint256[]) only — no timestamps
 * - missing symbol map disables the crypto rail
 */
import { OracleSignerService, OracleSignerDeps } from '../index';
import { OracleSignerConfig, NormalizedQuote } from '../types';
import { AuditLog } from '../audit-log';

class NoopAuditLog extends AuditLog {
  constructor() { super({ dir: '/tmp/__never__' }); }
  async append(): Promise<void> { return; }
}
function deps(extra: Partial<OracleSignerDeps> = {}): OracleSignerDeps {
  return { auditLog: new NoopAuditLog(), ...extra };
}

const WETH = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const cryptoSubmitMock = jest.fn().mockResolvedValue({
  txHash: '0xcryptoTx',
  gasUsed: 100n,
  symbolCount: 1,
  roundTripMs: 5,
  blockNumber: 42,
});
const stockSubmitMock = jest.fn().mockResolvedValue({
  txHash: '0xstockTx',
  gasUsed: 100n,
  symbolCount: 1,
  roundTripMs: 5,
  blockNumber: 42,
});

jest.mock('../oracle-submitter', () => ({
  OracleSubmitter: jest.fn().mockImplementation(() => ({
    signerAddress: '0x1111111111111111111111111111111111111111',
    provider: { getNetwork: jest.fn().mockResolvedValue({ chainId: 31337n }) },
    submitBatch: stockSubmitMock,
    getPrice: jest.fn().mockResolvedValue(0n),
  })),
}));

jest.mock('../crypto-oracle-submitter', () => ({
  CryptoOracleSubmitter: jest.fn().mockImplementation(() => ({
    signerAddress: '0x2222222222222222222222222222222222222222',
    provider: { getNetwork: jest.fn().mockResolvedValue({ chainId: 31337n }) },
    submitBatch: cryptoSubmitMock,
    getPriceUnsafe: jest.fn().mockResolvedValue([0n, 0n]),
  })),
}));

jest.mock('../price-ws-client', () => ({
  PriceWsClient: jest.fn().mockImplementation((_url: string, onQuote: (q: unknown) => void) => ({
    connect: jest.fn(), close: jest.fn(), _onQuote: onQuote,
  })),
}));

function makeQuote(o: Partial<NormalizedQuote> = {}): NormalizedQuote {
  return {
    source: 'etoro', symbol: 'WETH', instrumentId: '1',
    bid: 3499, ask: 3501, mid: 3500, last: 3500,
    timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false, ...o,
  };
}

function makeConfig(o: Partial<OracleSignerConfig> = {}): OracleSignerConfig {
  return {
    priceServiceUrl: 'ws://localhost:4001',
    rpcUrl: 'http://localhost:8545',
    oracleAddress: '0x0000000000000000000000000000000000000001',
    signerKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    updateIntervalMs: 60000, minDeviationBps: 0, txTimeoutMs: 60000,
    symbols: ['AAPL'],
    allowedChainIds: [31337],
    swapPriceOracleAddress: '0x0000000000000000000000000000000000000099',
    cryptoSymbolMap: `WETH=${WETH}`,
    ...o,
  };
}

describe('crypto route', () => {
  beforeEach(() => {
    cryptoSubmitMock.mockClear();
    stockSubmitMock.mockClear();
  });

  it('crypto quote populates crypto buffer, not stocks buffer', () => {
    const svc = new OracleSignerService(makeConfig(), deps());
    const ws = (svc as any).wsClient;
    ws._onQuote(makeQuote({ symbol: 'WETH', assetClass: 'crypto' }));

    expect(svc.getCryptoBuffer()?.symbolCount).toBe(1);
    expect(svc.getBuffer().symbolCount).toBe(0);
  });

  it('tickCrypto calls SwapPriceOracle submitter with (address[], uint256[]) shape only', async () => {
    const svc = new OracleSignerService(makeConfig(), deps());
    const ws = (svc as any).wsClient;
    ws._onQuote(makeQuote({ symbol: 'WETH', assetClass: 'crypto', mid: 3500 }));

    const result = await svc.tickCrypto();
    expect(result).not.toBeNull();
    expect(cryptoSubmitMock).toHaveBeenCalledTimes(1);
    const call = cryptoSubmitMock.mock.calls[0][0];
    expect(Array.isArray(call)).toBe(true);
    expect(call[0]).toEqual({
      symbol: 'WETH',
      address: WETH,
      price8: BigInt(3500 * 1e8),
      timestamp: expect.any(Number),
    });
  });

  it('crypto rail is disabled when CRYPTO_SYMBOL_MAP is empty even if SWAP_PRICE_ORACLE_ADDRESS is set', () => {
    const svc = new OracleSignerService(makeConfig({ cryptoSymbolMap: '' }), deps());
    expect(svc.getCryptoBuffer()).toBeNull();
    expect(svc.getCryptoSubmitter()).toBeNull();
  });

  it('crypto rail is disabled when SWAP_PRICE_ORACLE_ADDRESS is empty', () => {
    const svc = new OracleSignerService(makeConfig({ swapPriceOracleAddress: '' }), deps());
    expect(svc.getCryptoBuffer()).toBeNull();
  });

  it('stocks rail is disabled when STOCK_ORACLE_V2_ADDRESS is empty', () => {
    const svc = new OracleSignerService(makeConfig({ oracleAddress: '' }), deps());
    expect((svc as any).submitter).toBeNull();
    expect((svc as any).buffer).toBeNull();
  });

  it('with both rails disabled, start() degrades the service without scheduling intervals', async () => {
    const svc = new OracleSignerService(
      makeConfig({ oracleAddress: '', swapPriceOracleAddress: '' }),
      deps({ getChainId: async () => 31337 }),
    );
    await svc.start();
    expect(svc.isRunning).toBe(false);
    expect(svc.isRefused).toBe(true);
    expect(process.env.SERVICE_HEALTH_STATUS).toBe('degraded');
    delete process.env.SERVICE_HEALTH_STATUS;
    delete process.env.SERVICE_DISABLED_REASON;
  });

  it('getStats reports per-rail counters', async () => {
    const svc = new OracleSignerService(makeConfig(), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'WETH', assetClass: 'crypto' }));
    await svc.tickCrypto();

    const stats = svc.getStats();
    expect(stats.stocks.updateCount).toBe(0);
    expect(stats.crypto.updateCount).toBe(1);
    expect(stats.crypto.enabled).toBe(true);
  });
});
