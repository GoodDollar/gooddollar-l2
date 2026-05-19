import { hasDeviatedEnough, lastPrices, resetLastPrices } from '../index';

beforeEach(() => {
  resetLastPrices();
});

describe('hasDeviatedEnough', () => {
  const ADDR = '0x0000000000000000000000000000000000000001';

  it('returns true for first price (no previous)', () => {
    expect(hasDeviatedEnough(ADDR, 100_000_000n)).toBe(true);
  });

  it('returns false when price has not changed', () => {
    lastPrices.set(ADDR, 100_000_000n);
    expect(hasDeviatedEnough(ADDR, 100_000_000n, 10)).toBe(false);
  });

  it('returns false when deviation is below threshold', () => {
    lastPrices.set(ADDR, 100_000_000n); // $1.00
    // 0.05% increase — below 10 bps (0.1%) threshold
    expect(hasDeviatedEnough(ADDR, 100_050_000n, 10)).toBe(false);
  });

  it('returns true when deviation equals threshold', () => {
    lastPrices.set(ADDR, 100_000_000n); // $1.00
    // Exactly 10 bps = 0.1% = $0.001 → 100_100_000
    expect(hasDeviatedEnough(ADDR, 100_100_000n, 10)).toBe(true);
  });

  it('returns true when deviation exceeds threshold', () => {
    lastPrices.set(ADDR, 100_000_000n); // $1.00
    // 1% increase → 101_000_000 (100 bps >> 10 bps threshold)
    expect(hasDeviatedEnough(ADDR, 101_000_000n, 10)).toBe(true);
  });

  it('detects negative deviations', () => {
    lastPrices.set(ADDR, 100_000_000n); // $1.00
    // 0.2% decrease
    expect(hasDeviatedEnough(ADDR, 99_800_000n, 10)).toBe(true);
  });

  it('handles large price values', () => {
    lastPrices.set(ADDR, 300_000_000_000n); // $3000 (ETH-scale)
    // 0.05% change — below threshold
    const belowThreshold = 300_000_000_000n + 150_000_000n;
    expect(hasDeviatedEnough(ADDR, belowThreshold, 10)).toBe(false);

    // 0.2% change — above threshold
    const aboveThreshold = 300_000_000_000n + 600_000_000n;
    expect(hasDeviatedEnough(ADDR, aboveThreshold, 10)).toBe(true);
  });

  it('works with custom threshold', () => {
    lastPrices.set(ADDR, 100_000_000n);
    // 0.5% change with 100 bps (1%) threshold → below
    expect(hasDeviatedEnough(ADDR, 100_500_000n, 100)).toBe(false);
    // 1.5% change with 100 bps (1%) threshold → above
    expect(hasDeviatedEnough(ADDR, 101_500_000n, 100)).toBe(true);
  });
});
