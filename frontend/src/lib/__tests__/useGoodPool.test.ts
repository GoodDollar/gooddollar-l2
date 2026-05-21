import { describe, it, expect } from 'vitest'
import {
  parsePoolAmount,
  formatPoolAmount,
  getPool,
  POOL_LIST,
  computeSpotPrice,
  classifyPoolHealth,
} from '@/lib/useGoodPool'

describe('parsePoolAmount', () => {
  it('parses 18-decimal amount', () => {
    expect(parsePoolAmount('1', 18)).toBe(BigInt('1000000000000000000'))
  })

  it('parses 6-decimal USDC amount', () => {
    expect(parsePoolAmount('100', 6)).toBe(BigInt('100000000'))
  })

  it('parses fractional amount', () => {
    expect(parsePoolAmount('1.5', 18)).toBe(BigInt('1500000000000000000'))
  })

  it('returns 0 for empty string', () => {
    expect(parsePoolAmount('', 18)).toBe(BigInt(0))
  })

  it('returns 0 for zero string', () => {
    expect(parsePoolAmount('0', 18)).toBe(BigInt(0))
  })

  it('returns 0 for negative value', () => {
    expect(parsePoolAmount('-1', 18)).toBe(BigInt(0))
  })

  it('returns 0 for non-numeric input', () => {
    expect(parsePoolAmount('abc', 18)).toBe(BigInt(0))
  })

  it('handles small USDC amounts', () => {
    expect(parsePoolAmount('0.5', 6)).toBe(BigInt('500000'))
  })
})

describe('formatPoolAmount', () => {
  it('formats 18-decimal bigint', () => {
    const result = formatPoolAmount(BigInt('2000000000000000000'), 18)
    expect(result).toBeCloseTo(2.0)
  })

  it('formats 6-decimal bigint', () => {
    const result = formatPoolAmount(BigInt('50000000'), 6)
    expect(result).toBeCloseTo(50.0)
  })

  it('returns 0 for undefined', () => {
    expect(formatPoolAmount(undefined, 18)).toBe(0)
  })

  it('returns 0 for BigInt(0)', () => {
    expect(formatPoolAmount(BigInt(0), 18)).toBe(0)
  })

  it('roundtrips with parsePoolAmount (18 decimals)', () => {
    const parsed = parsePoolAmount('3.14', 18)
    const formatted = formatPoolAmount(parsed, 18)
    expect(formatted).toBeCloseTo(3.14, 5)
  })

  it('roundtrips with parsePoolAmount (6 decimals)', () => {
    const parsed = parsePoolAmount('99.99', 6)
    const formatted = formatPoolAmount(parsed, 6)
    expect(formatted).toBeCloseTo(99.99, 2)
  })
})

describe('getPool', () => {
  it('returns G$/WETH pool', () => {
    const pool = getPool('G$/WETH')
    expect(pool.tokenASymbol).toBe('G$')
    expect(pool.tokenBSymbol).toBe('WETH')
    expect(pool.tokenADecimals).toBe(18)
    expect(pool.tokenBDecimals).toBe(18)
  })

  it('returns G$/USDC pool', () => {
    const pool = getPool('G$/USDC')
    expect(pool.tokenASymbol).toBe('G$')
    expect(pool.tokenBSymbol).toBe('USDC')
    expect(pool.tokenBDecimals).toBe(6)
  })

  it('returns WETH/USDC pool', () => {
    const pool = getPool('WETH/USDC')
    expect(pool.tokenASymbol).toBe('WETH')
    expect(pool.tokenBSymbol).toBe('USDC')
  })

  it('throws for unknown pool', () => {
    expect(() => getPool('X$/Y' as any)).toThrow()
  })
})

// Task 0066: G$/USDC pool spot-price decimal mismatch.
// The contract returns `spotPrice()` as a 18-decimal ratio of tokenB-raw per
// 1e18 tokenA-raw. For G$ (18 dec) / USDC (6 dec) that ratio is ~1e12, which
// after `formatUnits(_, 18)` collapsed to ~1e-12 and `formatAmount` displayed
// as "0". Fix derives the displayed price from the already-decimal-aware
// reserve totals instead: priceAperB = reserveB / reserveA.
describe('computeSpotPrice', () => {
  it('returns null when reserveA is null', () => {
    expect(computeSpotPrice(null, 100)).toBeNull()
  })

  it('returns null when reserveB is null', () => {
    expect(computeSpotPrice(1000, null)).toBeNull()
  })

  it('returns null when reserveA is zero (avoid divide-by-zero)', () => {
    expect(computeSpotPrice(0, 100)).toBeNull()
  })

  it('returns null when both reserves are null', () => {
    expect(computeSpotPrice(null, null)).toBeNull()
  })

  it('computes the G$/USDC price ratio correctly (the bug case)', () => {
    // 1,000,000 G$ paired with 1 USDC → 1 G$ = 1e-6 USDC.
    // This is the realistic G$/USDC pool shape and the exact case that the
    // raw spotPrice()/1e18 derivation rounded to "0".
    const reserveA = 1_000_000 // G$ side, already formatted with 18 decimals
    const reserveB = 1         // USDC side, already formatted with 6 decimals
    const price = computeSpotPrice(reserveA, reserveB)
    expect(price).not.toBeNull()
    expect(price!).toBeCloseTo(1e-6, 12)
  })

  it('computes the G$/WETH price ratio correctly (regression for equal-decimal pools)', () => {
    // 100 G$ paired with 1 WETH → 1 G$ = 0.01 WETH
    const price = computeSpotPrice(100, 1)
    expect(price).toBeCloseTo(0.01, 6)
  })

  it('computes a 1:1 pool price as 1', () => {
    const price = computeSpotPrice(1, 1)
    expect(price).toBeCloseTo(1, 12)
  })

  it('handles a high-decimal disparity (G$/USDC at heavy liquidity)', () => {
    // 100,000,000 G$ paired with 100 USDC → 1 G$ = 1e-6 USDC
    const price = computeSpotPrice(100_000_000, 100)
    expect(price).not.toBeNull()
    expect(price!).toBeCloseTo(1e-6, 12)
  })

  it('returns 0 if reserveB is 0 and reserveA is positive', () => {
    // Degenerate "no tokenB" liquidity — price is mathematically 0.
    expect(computeSpotPrice(1000, 0)).toBe(0)
  })
})

// Task 0024: Pool-health classifier guarding the /pool page against
// on-chain miscalibration on testnet. The contract returns reserves that
// imply an absurd spot price (e.g. 1e12 USDC per G$) for some pools, which
// previously rendered as `0 G$` / `$NaN` and let users sign self-griefing
// swaps. The classifier is a pure helper consumed by usePoolReserves and
// the pool page UI; thresholds are intentionally loose to avoid false
// positives on heavy-liquidity pools like (100M G$, 100 USDC) where the
// realistic spot is 1e-6.
describe('classifyPoolHealth', () => {
  it("returns 'unknown' when reserveA is undefined", () => {
    expect(classifyPoolHealth(undefined, '1000')).toBe('unknown')
  })

  it("returns 'unknown' when reserveB is undefined", () => {
    expect(classifyPoolHealth('1000', undefined)).toBe('unknown')
  })

  it("returns 'unknown' when both reserves are undefined", () => {
    expect(classifyPoolHealth(undefined, undefined)).toBe('unknown')
  })

  it("returns 'unknown' when reserveA is zero (no liquidity to assess)", () => {
    expect(classifyPoolHealth('0', '0')).toBe('unknown')
  })

  it("returns 'unknown' when reserveA is zero but reserveB is positive", () => {
    expect(classifyPoolHealth('0', '1000')).toBe('unknown')
  })

  it("returns 'unknown' when inputs are non-numeric", () => {
    expect(classifyPoolHealth('abc', 'def')).toBe('unknown')
  })

  it("returns 'unknown' when reserveA is negative", () => {
    expect(classifyPoolHealth('-1000', '1000')).toBe('unknown')
  })

  it("returns 'ok' for balanced 1:1 reserves", () => {
    expect(classifyPoolHealth('1000', '1000')).toBe('ok')
  })

  it("returns 'ok' for realistic G$/USDC heavy liquidity (100M G$, 100 USDC, spot=1e-6)", () => {
    // Mirrors the documented healthy shape in the computeSpotPrice suite
    // above. MUST NOT be flagged, or every realistic G$/USDC pool gets
    // a MISCONFIGURED badge and disabled trade actions.
    expect(classifyPoolHealth('100000000', '100')).toBe('ok')
  })

  it("returns 'ok' for realistic G$/WETH (100 G$, 1 WETH, spot=0.01)", () => {
    expect(classifyPoolHealth('100', '1')).toBe('ok')
  })

  it("returns 'misconfigured' for observed G$/USDC bug (1e-6 G$ vs 1e18 USDC)", () => {
    // On-chain miscalibration: spot collapses to ~1e24, far above any
    // plausible USDC-per-G$ rate.
    expect(classifyPoolHealth('0.000001', '1e18')).toBe('misconfigured')
  })

  it("returns 'misconfigured' for observed G$/WETH bug (1000 G$ vs 3M WETH, spot=3000)", () => {
    // Spot of 3000 WETH per G$ is physically nonsensical (≥ $1e10 per G$).
    expect(classifyPoolHealth('1000', '3000000')).toBe('misconfigured')
  })

  it("returns 'misconfigured' for observed WETH/USDC bug (3e-6 WETH vs 1e18 USDC)", () => {
    expect(classifyPoolHealth('0.000003', '1e18')).toBe('misconfigured')
  })

  it("accepts number inputs (matches formatPoolAmount's return type)", () => {
    expect(classifyPoolHealth(1000, 1000)).toBe('ok')
    expect(classifyPoolHealth(1000, 3_000_000)).toBe('misconfigured')
    expect(classifyPoolHealth(100_000_000, 100)).toBe('ok')
  })

  it("returns 'misconfigured' for dust tokenA (1e-9 G$, 1000 USDC, spot=1e12)", () => {
    expect(classifyPoolHealth('1e-9', '1000')).toBe('misconfigured')
  })

  it("returns 'misconfigured' for absurd tokenB (1 token, 1e15 token, spot=1e15)", () => {
    expect(classifyPoolHealth('1', '1e15')).toBe('misconfigured')
  })

  it("returns 'unknown' when reserveA is NaN", () => {
    expect(classifyPoolHealth(NaN, 1000)).toBe('unknown')
  })

  it("returns 'unknown' when reserveA is Infinity", () => {
    expect(classifyPoolHealth(Infinity, 1000)).toBe('unknown')
  })
})

describe('POOL_LIST', () => {
  it('contains 3 pools', () => {
    expect(POOL_LIST).toHaveLength(3)
  })

  it('all pools have 30 bps fee', () => {
    for (const pool of POOL_LIST) {
      expect(pool.feeBps).toBe(30)
    }
  })

  it('all pools have valid addresses', () => {
    for (const pool of POOL_LIST) {
      expect(pool.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(pool.tokenAAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(pool.tokenBAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
    }
  })

  it('each pool key matches tokenA/tokenB symbols', () => {
    for (const pool of POOL_LIST) {
      expect(pool.key).toBe(`${pool.tokenASymbol}/${pool.tokenBSymbol}`)
    }
  })
})
