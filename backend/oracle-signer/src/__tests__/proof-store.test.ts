import { ProofStore } from '../proof-store';

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
