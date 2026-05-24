/**
 * tickStocks / tickCrypto catch paths must:
 *   1. Call proofStore.recordFailure(...) with the redacted reason, the
 *      ethers error code (when present), the symbol batch, and an
 *      attemptedAtMs timestamp;
 *   2. Still write to the audit log (existing behaviour);
 *   3. Still re-throw so the setInterval handler logs the tick error.
 *
 * The recordFailure call must land BEFORE the audit-log append per the PRD.
 */

import { OracleSignerService, OracleSignerDeps } from '../index';
import { OracleSignerConfig } from '../types';
import { AuditLog, AuditEntry } from '../audit-log';
import { ProofStore } from '../proof-store';

class CapturingAuditLog extends AuditLog {
  public events: AuditEntry[] = [];
  constructor() { super({ dir: '/tmp/__never__' }); }
  async append(ev: AuditEntry): Promise<void> { this.events.push(ev); }
}

const WETH = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const stocksSubmitMock = jest.fn();
const cryptoSubmitMock = jest.fn();

jest.mock('../oracle-submitter', () => ({
  OracleSubmitter: jest.fn().mockImplementation(() => ({
    signerAddress: '0x1111111111111111111111111111111111111111',
    provider: { getNetwork: jest.fn().mockResolvedValue({ chainId: 31337n }) },
    submitBatch: stocksSubmitMock,
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
jest.mock('../price-ws-client', () => {
  const ZERO = {
    accepted: 0, droppedJsonParse: 0, droppedShape: 0,
    droppedInvalidMid: 0, droppedMissingSymbol: 0,
  };
  return {
    PriceWsClient: jest.fn().mockImplementation((_u: string, onQuote: (q: unknown) => void) => ({
      connect: jest.fn(), close: jest.fn(), _onQuote: onQuote,
      getStats: jest.fn(() => ({ ...ZERO })),
    })),
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
    symbols: ['AAPL'],
    allowedChainIds: [31337],
    swapPriceOracleAddress: '0x0000000000000000000000000000000000000099',
    cryptoSymbolMap: `WETH=${WETH}`,
    ...overrides,
  };
}

function deps(): OracleSignerDeps & { audit: CapturingAuditLog; store: ProofStore } {
  const audit = new CapturingAuditLog();
  const store = new ProofStore();
  return { auditLog: audit, proofStore: store, audit, store };
}

describe('tickStocks / tickCrypto catch paths', () => {
  beforeEach(() => {
    stocksSubmitMock.mockReset();
    cryptoSubmitMock.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tickStocks failure records the failure on the proof store before re-throwing', async () => {
    const err = Object.assign(new Error('execution reverted: deviation too high'), { code: 'CALL_EXCEPTION' });
    stocksSubmitMock.mockRejectedValueOnce(err);

    const d = deps();
    const svc = new OracleSignerService(makeConfig(), d);
    svc.getBuffer().update({
      source: 'etoro', symbol: 'AAPL', instrumentId: '1',
      bid: 100, ask: 101, mid: 100.5, last: 100.5,
      timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false,
    });

    await expect(svc.tickStocks()).rejects.toBe(err);

    const snap = d.store.snapshot();
    expect(snap.failures.stocks).toHaveLength(1);
    expect(snap.failures.stocks[0]).toMatchObject({
      reason: expect.stringContaining('execution reverted'),
      errorClass: 'CALL_EXCEPTION',
      symbols: ['AAPL'],
      rail: 'stocks',
    });
    expect(typeof snap.failures.stocks[0].attemptedAtMs).toBe('number');
    expect(snap.counts.stocks).toEqual({ ok: 0, failed: 1 });

    // audit log still wrote a submit_fail entry
    const failEvents = d.audit.events.filter(e => e.event === 'submit_fail');
    expect(failEvents).toHaveLength(1);
  });

  it('tickCrypto failure records the failure on the proof store before re-throwing', async () => {
    const err = Object.assign(new Error('replacement transaction underpriced'), { code: 'REPLACEMENT_UNDERPRICED' });
    cryptoSubmitMock.mockRejectedValueOnce(err);

    const d = deps();
    const svc = new OracleSignerService(makeConfig(), d);
    svc.getCryptoBuffer()!.update({
      source: 'etoro', symbol: 'WETH', instrumentId: '1', assetClass: 'crypto',
      bid: 3499, ask: 3501, mid: 3500, last: 3500,
      timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false,
    });

    await expect(svc.tickCrypto()).rejects.toBe(err);

    const snap = d.store.snapshot();
    expect(snap.failures.crypto).toHaveLength(1);
    expect(snap.failures.crypto[0]).toMatchObject({
      reason: expect.stringContaining('replacement transaction underpriced'),
      errorClass: 'REPLACEMENT_UNDERPRICED',
      symbols: ['WETH'],
      rail: 'crypto',
    });
    expect(snap.counts.crypto).toEqual({ ok: 0, failed: 1 });
  });

  it('errorClass is undefined when the thrown value carries no code', async () => {
    stocksSubmitMock.mockRejectedValueOnce(new Error('plain failure'));

    const d = deps();
    const svc = new OracleSignerService(makeConfig(), d);
    svc.getBuffer().update({
      source: 'etoro', symbol: 'AAPL', instrumentId: '1',
      bid: 100, ask: 101, mid: 100.5, last: 100.5,
      timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false,
    });

    await expect(svc.tickStocks()).rejects.toThrow();
    const snap = d.store.snapshot();
    expect(snap.failures.stocks[0].errorClass).toBeUndefined();
  });

  it('reason redacts long hex sequences and clamps to ≤200 chars', async () => {
    stocksSubmitMock.mockRejectedValueOnce(
      new Error('rpc using key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 failed: ' + 'x'.repeat(500)),
    );

    const d = deps();
    const svc = new OracleSignerService(makeConfig(), d);
    svc.getBuffer().update({
      source: 'etoro', symbol: 'AAPL', instrumentId: '1',
      bid: 100, ask: 101, mid: 100.5, last: 100.5,
      timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false,
    });

    await expect(svc.tickStocks()).rejects.toThrow();
    const reason = d.store.snapshot().failures.stocks[0].reason;
    expect(reason.length).toBeLessThanOrEqual(200);
    expect(reason).not.toContain('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  });

  it('successful submissions still bump counts.<rail>.ok (no regression)', async () => {
    stocksSubmitMock.mockResolvedValueOnce({
      txHash: '0xok', gasUsed: 100n, symbolCount: 1, roundTripMs: 5, blockNumber: 1,
    });

    const d = deps();
    const svc = new OracleSignerService(makeConfig(), d);
    svc.getBuffer().update({
      source: 'etoro', symbol: 'AAPL', instrumentId: '1',
      bid: 100, ask: 101, mid: 100.5, last: 100.5,
      timestamp: Date.now(), sessionState: 'open', confidence: 95, stale: false,
    });

    await svc.tickStocks();
    expect(d.store.snapshot().counts.stocks).toEqual({ ok: 1, failed: 0 });
  });
});
