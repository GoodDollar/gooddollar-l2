import { ProofStore, redactProofReason, redactRpcEndpoint } from '../proof-store';

const entry = {
  txHash: '0xabc',
  blockNumber: 100,
  gasUsed: '150000',
  symbols: ['AAPL'],
  roundTripMs: 80,
  submittedAtMs: 1700000000000,
  mids: { AAPL: 191.5 },
};

const failure = {
  reason: 'execution reverted: deviation too high',
  errorClass: 'CALL_EXCEPTION',
  symbols: ['AAPL'],
  attemptedAtMs: 1700000000001,
};

describe('ProofStore', () => {
  it('starts with the canonical empty shape', () => {
    const snap = new ProofStore().snapshot();
    expect(snap.stocks).toEqual([]);
    expect(snap.crypto).toEqual([]);
    expect(snap.failures).toEqual({ stocks: [], crypto: [] });
    expect(snap.counts).toEqual({
      stocks: { ok: 0, failed: 0 },
      crypto: { ok: 0, failed: 0 },
    });
    expect(snap.rails.stocks.enabled).toBe(false);
    expect(snap.chain.oracleAddresses).toEqual({ stocks: null, crypto: null });
  });

  it('records successes, failures, cumulative counts, and freshness independently', () => {
    const store = new ProofStore();
    store.setRailEnabled('stocks', true);
    store.record('stocks', entry);
    store.recordFailure('stocks', failure);

    const snap = store.snapshot();
    expect(snap.stocks[0].rail).toBe('stocks');
    expect(snap.stocks[0].txHash).toBe('0xabc');
    expect(snap.failures.stocks[0].reason).toBe('execution reverted: deviation too high');
    expect(snap.counts.stocks).toEqual({ ok: 1, failed: 1 });
    expect(snap.rails.stocks.enabled).toBe(true);
    expect(snap.rails.stocks.lastSuccessAtMs).toBe(entry.submittedAtMs);
    expect(snap.rails.stocks.lastFailureAtMs).toBe(failure.attemptedAtMs);
  });
});

describe('proof redaction helpers', () => {
  it('redacts long hex strings and collapses newlines in failure reasons', () => {
    const reason = redactProofReason(new Error('bad key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80\nnext'));
    expect(reason).toContain('<redacted-hex>');
    expect(reason).not.toMatch(/\r|\n/);
  });

  it('strips userinfo from RPC endpoint URLs', () => {
    expect(redactRpcEndpoint('https://user:pass@example.com:8545/path')).toBe('https://example.com:8545/path');
  });
});
