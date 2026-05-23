import { ProofStore, redactProofReason } from '../proof-store';

const baseFailure = {
  reason: 'execution reverted: deviation too high',
  errorClass: 'CALL_EXCEPTION',
  symbols: ['AAPL'],
  attemptedAtMs: 1700000000000,
};

const baseEntry = {
  txHash: '0xabc',
  blockNumber: 100,
  gasUsed: '150000',
  symbols: ['AAPL'],
  roundTripMs: 80,
  submittedAtMs: 1700000000000,
  mids: { AAPL: 191.5 },
};

describe('ProofStore', () => {
  it('snapshot is empty by default', () => {
    const ps = new ProofStore();
    const snap = ps.snapshot();
    expect(snap.stocks).toEqual([]);
    expect(snap.crypto).toEqual([]);
    expect(snap.generatedAt).toBeGreaterThan(0);
  });

  it('records per rail separately', () => {
    const ps = new ProofStore();
    ps.record('stocks', { ...baseEntry, txHash: '0xs1' });
    ps.record('crypto', { ...baseEntry, txHash: '0xc1', symbols: ['WETH'], mids: { WETH: 3500 } });

    const snap = ps.snapshot();
    expect(snap.stocks).toHaveLength(1);
    expect(snap.crypto).toHaveLength(1);
    expect(snap.stocks[0].txHash).toBe('0xs1');
    expect(snap.crypto[0].txHash).toBe('0xc1');
  });

  it('snapshot returns most-recent-first per rail', () => {
    const ps = new ProofStore();
    ps.record('stocks', { ...baseEntry, txHash: '0xs1', submittedAtMs: 1 });
    ps.record('stocks', { ...baseEntry, txHash: '0xs2', submittedAtMs: 2 });
    ps.record('stocks', { ...baseEntry, txHash: '0xs3', submittedAtMs: 3 });

    const snap = ps.snapshot();
    expect(snap.stocks.map(e => e.txHash)).toEqual(['0xs3', '0xs2', '0xs1']);
  });

  it('caps per-rail size at the configured capacity', () => {
    const ps = new ProofStore(3);
    for (let i = 0; i < 7; i++) {
      ps.record('stocks', { ...baseEntry, txHash: `0xs${i}` });
    }
    const snap = ps.snapshot();
    expect(snap.stocks).toHaveLength(3);
    expect(snap.stocks.map(e => e.txHash)).toEqual(['0xs6', '0xs5', '0xs4']);
  });

  it('default capacity is 50', () => {
    const ps = new ProofStore();
    for (let i = 0; i < 60; i++) {
      ps.record('crypto', { ...baseEntry, txHash: `0xc${i}` });
    }
    expect(ps.snapshot().crypto).toHaveLength(50);
  });

  it('snapshot includes rail field on each entry', () => {
    const ps = new ProofStore();
    ps.record('stocks', baseEntry);
    expect(ps.snapshot().stocks[0].rail).toBe('stocks');
  });

  it('returned snapshot arrays are detached copies (mutating them does not affect store)', () => {
    const ps = new ProofStore();
    ps.record('stocks', baseEntry);
    const snap = ps.snapshot();
    snap.stocks.pop();
    expect(ps.snapshot().stocks).toHaveLength(1);
  });
});

describe('ProofStore — failures + counts', () => {
  it('snapshot exposes empty failures arrays and zero counts by default', () => {
    const ps = new ProofStore();
    const snap = ps.snapshot();
    expect(snap.failures).toEqual({ stocks: [], crypto: [] });
    expect(snap.counts).toEqual({
      stocks: { ok: 0, failed: 0 },
      crypto: { ok: 0, failed: 0 },
    });
  });

  it('recordFailure appends to the per-rail failures ring most-recent-first', () => {
    const ps = new ProofStore();
    ps.recordFailure('stocks', { ...baseFailure, attemptedAtMs: 1, reason: 'r1' });
    ps.recordFailure('stocks', { ...baseFailure, attemptedAtMs: 2, reason: 'r2' });
    ps.recordFailure('stocks', { ...baseFailure, attemptedAtMs: 3, reason: 'r3' });
    const snap = ps.snapshot();
    expect(snap.failures.stocks.map(f => f.reason)).toEqual(['r3', 'r2', 'r1']);
  });

  it('failures ring caps per-rail at the configured capacity', () => {
    const ps = new ProofStore(3);
    for (let i = 0; i < 7; i++) {
      ps.recordFailure('stocks', { ...baseFailure, reason: `r${i}` });
    }
    const snap = ps.snapshot();
    expect(snap.failures.stocks).toHaveLength(3);
    expect(snap.failures.stocks.map(f => f.reason)).toEqual(['r6', 'r5', 'r4']);
  });

  it('counts.<rail>.failed increments on recordFailure but counts.<rail>.ok does not', () => {
    const ps = new ProofStore();
    ps.recordFailure('stocks', baseFailure);
    ps.recordFailure('stocks', baseFailure);
    expect(ps.snapshot().counts.stocks).toEqual({ ok: 0, failed: 2 });
    expect(ps.snapshot().counts.crypto).toEqual({ ok: 0, failed: 0 });
  });

  it('counts.<rail>.ok increments on record but counts.<rail>.failed does not', () => {
    const ps = new ProofStore();
    ps.record('crypto', baseEntry);
    ps.record('crypto', baseEntry);
    ps.record('crypto', baseEntry);
    expect(ps.snapshot().counts.crypto).toEqual({ ok: 3, failed: 0 });
    expect(ps.snapshot().counts.stocks).toEqual({ ok: 0, failed: 0 });
  });

  it('counts continue climbing after failures ring rolls entries off', () => {
    const ps = new ProofStore(2);
    for (let i = 0; i < 5; i++) {
      ps.recordFailure('stocks', { ...baseFailure, reason: `r${i}` });
    }
    expect(ps.snapshot().counts.stocks).toEqual({ ok: 0, failed: 5 });
    expect(ps.snapshot().failures.stocks).toHaveLength(2);
  });

  it('counts continue climbing across mixed ok and failed events', () => {
    const ps = new ProofStore();
    ps.record('stocks', baseEntry);
    ps.recordFailure('stocks', baseFailure);
    ps.record('stocks', baseEntry);
    ps.recordFailure('stocks', baseFailure);
    ps.record('stocks', baseEntry);
    expect(ps.snapshot().counts.stocks).toEqual({ ok: 3, failed: 2 });
  });

  it('snapshot includes rail field on each failure entry', () => {
    const ps = new ProofStore();
    ps.recordFailure('crypto', baseFailure);
    expect(ps.snapshot().failures.crypto[0].rail).toBe('crypto');
  });

  it('returned failures arrays are detached copies', () => {
    const ps = new ProofStore();
    ps.recordFailure('stocks', baseFailure);
    const snap = ps.snapshot();
    snap.failures.stocks.pop();
    expect(ps.snapshot().failures.stocks).toHaveLength(1);
  });
});

describe('ProofStore — per-rail status', () => {
  it('default snapshot has rails block with disabled/null defaults', () => {
    const ps = new ProofStore();
    const snap = ps.snapshot();
    expect(snap.rails.stocks).toEqual({
      enabled: false,
      lastSuccessAtMs: null,
      lastSuccessAgeMs: null,
      lastFailureAtMs: null,
      lastFailureAgeMs: null,
    });
    expect(snap.rails.crypto).toEqual({
      enabled: false,
      lastSuccessAtMs: null,
      lastSuccessAgeMs: null,
      lastFailureAtMs: null,
      lastFailureAgeMs: null,
    });
  });

  it('setRailEnabled flips the enabled flag in the next snapshot', () => {
    const ps = new ProofStore();
    ps.setRailEnabled('stocks', true);
    const snap = ps.snapshot();
    expect(snap.rails.stocks.enabled).toBe(true);
    expect(snap.rails.crypto.enabled).toBe(false);
  });

  it('record sets lastSuccessAtMs and derives lastSuccessAgeMs from generatedAt', () => {
    const ps = new ProofStore();
    const t = Date.now() - 1500;
    ps.record('stocks', { ...baseEntry, submittedAtMs: t });
    const snap = ps.snapshot();
    expect(snap.rails.stocks.lastSuccessAtMs).toBe(t);
    expect(snap.rails.stocks.lastSuccessAgeMs).toBe(snap.generatedAt - t);
    expect(snap.rails.stocks.lastSuccessAgeMs).toBeGreaterThanOrEqual(0);
    expect(snap.rails.stocks.lastFailureAtMs).toBeNull();
    expect(snap.rails.stocks.lastFailureAgeMs).toBeNull();
  });

  it('lastSuccessAtMs survives ring rollover (independent of bounded entry ring)', () => {
    const ps = new ProofStore(3);
    let last = 0;
    for (let i = 0; i < 7; i++) {
      last = 1700000000000 + i;
      ps.record('stocks', { ...baseEntry, txHash: `0xs${i}`, submittedAtMs: last });
    }
    const snap = ps.snapshot();
    expect(snap.stocks).toHaveLength(3);
    expect(snap.rails.stocks.lastSuccessAtMs).toBe(last);
  });

  it('recordFailure sets lastFailureAtMs and derives lastFailureAgeMs', () => {
    const ps = new ProofStore();
    const t = Date.now() - 800;
    ps.recordFailure('crypto', { ...baseFailure, attemptedAtMs: t });
    const snap = ps.snapshot();
    expect(snap.rails.crypto.lastFailureAtMs).toBe(t);
    expect(snap.rails.crypto.lastFailureAgeMs).toBe(snap.generatedAt - t);
    expect(snap.rails.crypto.lastSuccessAtMs).toBeNull();
    expect(snap.rails.crypto.lastSuccessAgeMs).toBeNull();
  });

  it('lastFailureAtMs survives ring rollover', () => {
    const ps = new ProofStore(2);
    let last = 0;
    for (let i = 0; i < 5; i++) {
      last = 1700000000000 + i;
      ps.recordFailure('crypto', { ...baseFailure, reason: `r${i}`, attemptedAtMs: last });
    }
    const snap = ps.snapshot();
    expect(snap.failures.crypto).toHaveLength(2);
    expect(snap.rails.crypto.lastFailureAtMs).toBe(last);
  });

  it('mixed record + recordFailure populates both independently', () => {
    const ps = new ProofStore();
    const tSuccess = Date.now() - 2000;
    const tFailure = Date.now() - 500;
    ps.record('stocks', { ...baseEntry, submittedAtMs: tSuccess });
    ps.recordFailure('stocks', { ...baseFailure, attemptedAtMs: tFailure });
    const snap = ps.snapshot();
    expect(snap.rails.stocks.lastSuccessAtMs).toBe(tSuccess);
    expect(snap.rails.stocks.lastFailureAtMs).toBe(tFailure);
    expect(snap.rails.stocks.lastSuccessAgeMs).toBe(snap.generatedAt - tSuccess);
    expect(snap.rails.stocks.lastFailureAgeMs).toBe(snap.generatedAt - tFailure);
  });

  it('per-rail status is independent across rails', () => {
    const ps = new ProofStore();
    ps.setRailEnabled('stocks', true);
    ps.record('stocks', { ...baseEntry, submittedAtMs: 1700000001000 });
    const snap = ps.snapshot();
    expect(snap.rails.stocks.enabled).toBe(true);
    expect(snap.rails.stocks.lastSuccessAtMs).toBe(1700000001000);
    expect(snap.rails.crypto.enabled).toBe(false);
    expect(snap.rails.crypto.lastSuccessAtMs).toBeNull();
  });
});

describe('redactProofReason', () => {
  it('strips long hex sequences (signer keys, addresses)', () => {
    const r = redactProofReason(
      new Error('rpc error using key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 — bad'),
    );
    expect(r).not.toContain('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    expect(r).toContain('<redacted-hex>');
  });

  it('strips contract addresses (40-char hex)', () => {
    const r = redactProofReason(new Error('reverted at 0x5FbDB2315678afecb367f032d93F642f64180aa3 line 1'));
    expect(r).toContain('<redacted-hex>');
  });

  it('replaces newlines with spaces', () => {
    const r = redactProofReason(new Error('line 1\nline 2\r\nline 3'));
    expect(r).not.toMatch(/\r|\n/);
    expect(r).toContain('line 1 line 2 line 3');
  });

  it('clamps to 200 chars', () => {
    const long = 'x'.repeat(1000);
    const r = redactProofReason(new Error(long));
    expect(r.length).toBeLessThanOrEqual(200);
  });

  it('handles non-Error throws (string, undefined)', () => {
    expect(redactProofReason('plain string')).toBe('plain string');
    expect(redactProofReason(undefined)).toBe('undefined');
    expect(redactProofReason(null)).toBe('null');
  });
});
