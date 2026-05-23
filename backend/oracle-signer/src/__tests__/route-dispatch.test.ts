/**
 * Dispatch behaviour for dual-rail oracle-signer:
 *
 *   - assetClass: 'equity' | 'etf' | 'index'   → stocks rail
 *   - assetClass: 'crypto'                      → crypto rail (via symbol map)
 *   - assetClass: undefined/other → fallback to stocks rail if the symbol
 *                                   is in the stocks allowlist, otherwise drop
 *                                   with a warn-once log.
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
const USDC = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

jest.mock('../oracle-submitter', () => {
  return {
    OracleSubmitter: jest.fn().mockImplementation(() => ({
      signerAddress: '0x1111111111111111111111111111111111111111',
      provider: { getNetwork: jest.fn().mockResolvedValue({ chainId: 31337n }) },
      submitBatch: jest.fn().mockResolvedValue({ txHash: '0xstocks', gasUsed: 1n, symbolCount: 0, roundTripMs: 1, blockNumber: 1 }),
      getPrice: jest.fn().mockResolvedValue(0n),
    })),
  };
});

jest.mock('../crypto-oracle-submitter', () => {
  return {
    CryptoOracleSubmitter: jest.fn().mockImplementation(() => ({
      signerAddress: '0x2222222222222222222222222222222222222222',
      provider: { getNetwork: jest.fn().mockResolvedValue({ chainId: 31337n }) },
      submitBatch: jest.fn().mockResolvedValue({ txHash: '0xcrypto', gasUsed: 1n, symbolCount: 0, roundTripMs: 1, blockNumber: 1 }),
      getPriceUnsafe: jest.fn().mockResolvedValue([0n, 0n]),
    })),
  };
});

jest.mock('../price-ws-client', () => {
  const ZERO = {
    accepted: 0, droppedJsonParse: 0, droppedShape: 0,
    droppedInvalidMid: 0, droppedMissingSymbol: 0,
  };
  return {
    PriceWsClient: jest.fn().mockImplementation((_url: string, onQuote: (q: unknown) => void) => ({
      connect: jest.fn(),
      close: jest.fn(),
      _onQuote: onQuote,
      getStats: jest.fn(() => ({ ...ZERO })),
    })),
    emptyIngestStats: () => ({ ...ZERO }),
  };
});

function makeQuote(overrides: Partial<NormalizedQuote> = {}): NormalizedQuote {
  return {
    source: 'etoro',
    symbol: 'AAPL',
    instrumentId: '1',
    bid: 100, ask: 101, mid: 100.5, last: 100.5,
    timestamp: Date.now(),
    sessionState: 'open',
    confidence: 95,
    stale: false,
    ...overrides,
  };
}

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
    allowedChainIds: [31337],
    swapPriceOracleAddress: '0x0000000000000000000000000000000000000099',
    cryptoSymbolMap: `WETH=${WETH},USDC=${USDC}`,
    ...overrides,
  };
}

describe('route dispatch', () => {
  it('equities go to the stocks buffer only', () => {
    const svc = new OracleSignerService(makeConfig(), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'AAPL', assetClass: 'equity' }));

    expect(svc.getBuffer().getLatestQuote('AAPL')).toBeDefined();
    expect(svc.getCryptoBuffer()?.getLatestQuote('AAPL')).toBeUndefined();
  });

  it('crypto goes to the crypto buffer only when symbol resolves', () => {
    const svc = new OracleSignerService(makeConfig(), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'WETH', assetClass: 'crypto', mid: 3500 }));

    expect(svc.getCryptoBuffer()?.getLatestQuote('WETH')).toBeDefined();
    expect(svc.getBuffer().getLatestQuote('WETH')).toBeUndefined();
  });

  it('crypto with unresolvable symbol is dropped (no buffer entry)', () => {
    const svc = new OracleSignerService(makeConfig(), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'FOOBAR', assetClass: 'crypto' }));

    expect(svc.getCryptoBuffer()?.getLatestQuote('FOOBAR')).toBeUndefined();
    expect(svc.getBuffer().getLatestQuote('FOOBAR')).toBeUndefined();
  });

  it('etf / index map to stocks rail', () => {
    const svc = new OracleSignerService(makeConfig({ symbols: ['SPY', 'QQQ', 'NDX'] }), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'SPY', assetClass: 'etf' }));
    ws._onQuote(makeQuote({ symbol: 'NDX', assetClass: 'index' }));

    expect(svc.getBuffer().getLatestQuote('SPY')).toBeDefined();
    expect(svc.getBuffer().getLatestQuote('NDX')).toBeDefined();
  });

  it('unknown assetClass falls back to stocks rail when symbol is in stocks allowlist', () => {
    const svc = new OracleSignerService(makeConfig({ symbols: ['AAPL'] }), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'AAPL', assetClass: undefined }));

    expect(svc.getBuffer().getLatestQuote('AAPL')).toBeDefined();
  });

  it('unknown assetClass not in stocks allowlist is dropped', () => {
    const svc = new OracleSignerService(makeConfig({ symbols: ['AAPL'] }), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'XYZ', assetClass: undefined }));

    expect(svc.getBuffer().getLatestQuote('XYZ')).toBeUndefined();
    expect(svc.getCryptoBuffer()?.getLatestQuote('XYZ')).toBeUndefined();
  });

  it('symbol-not-in-stocks-allowlist filtering still works for equities', () => {
    const svc = new OracleSignerService(makeConfig({ symbols: ['AAPL'] }), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'GOOGL', assetClass: 'equity' }));

    expect(svc.getBuffer().getLatestQuote('GOOGL')).toBeUndefined();
  });

  it('warns once per missing crypto symbol', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const svc = new OracleSignerService(makeConfig(), deps());
    const ws = (svc as any).wsClient;

    ws._onQuote(makeQuote({ symbol: 'NOPE', assetClass: 'crypto' }));
    ws._onQuote(makeQuote({ symbol: 'NOPE', assetClass: 'crypto' }));
    ws._onQuote(makeQuote({ symbol: 'NOPE', assetClass: 'crypto' }));

    const noteCalls = warnSpy.mock.calls.filter(c => String(c[0]).includes('NOPE'));
    expect(noteCalls.length).toBe(1);

    warnSpy.mockRestore();
  });
});
