import { describe, it, expect } from 'vitest'
import { decodePoolSpotPrice } from '@/lib/useOnChainMarketData'

describe('decodePoolSpotPrice', () => {
  // Realistic devnet ratio: 10M G$ (base, 18d) vs 1k USDC (quote, 6d)
  //   → expected price = 1000 / 10_000_000 = 0.0001 USDC per G$.
  it('decodes a realistic G$/USDC pool ratio with mixed decimals (18/6)', () => {
    const price = decodePoolSpotPrice({
      baseReserve:    10_000_000_000_000_000_000_000_000n, // 1e7 G$ in raw 1e18 units
      quoteReserve:   1_000_000_000n,                       // 1e3 USDC in raw 1e6 units
      baseDecimals:   18,
      quoteDecimals:  6,
    })
    expect(price).not.toBeNull()
    expect(price!).toBeGreaterThan(0)
    expect(price!).toBeLessThan(0.001)
    expect(price!).toBeCloseTo(0.0001, 8)
  })

  // Sanity: when base and quote share decimals the result is just quote/base.
  it('matches naive ratio when both tokens share decimals', () => {
    const price = decodePoolSpotPrice({
      baseReserve:   1_000_000n,
      quoteReserve:  2_000_000n,
      baseDecimals:  18,
      quoteDecimals: 18,
    })
    expect(price).toBe(2)
  })

  // The buggy code path (formatUnits(spotPrice, 18) on a value already scaled
  // by 1e18 from a mixed-decimal pool) was off by ~1e12 for the devnet config.
  // Guard against that regression.
  it('does NOT inflate the price by 1e12 (regression for the explore market-cap bug)', () => {
    const price = decodePoolSpotPrice({
      baseReserve:   10_000_000_000_000_000_000_000_000n,
      quoteReserve:  1_000_000_000n,
      baseDecimals:  18,
      quoteDecimals: 6,
    })
    expect(price!).toBeLessThan(1)
  })

  it('returns null when baseReserve is zero (avoids division by zero / Infinity)', () => {
    const price = decodePoolSpotPrice({
      baseReserve:   0n,
      quoteReserve:  1_000_000n,
      baseDecimals:  18,
      quoteDecimals: 6,
    })
    expect(price).toBeNull()
  })

  it('returns null when quoteReserve is zero (empty pool side)', () => {
    const price = decodePoolSpotPrice({
      baseReserve:   1n,
      quoteReserve:  0n,
      baseDecimals:  18,
      quoteDecimals: 6,
    })
    expect(price).toBeNull()
  })

  it('handles tiny prices without losing precision to zero or Infinity', () => {
    const price = decodePoolSpotPrice({
      baseReserve:   1_000_000_000_000_000_000_000_000n, // 1e6 G$ raw
      quoteReserve:  1n,                                  // 1e-6 USDC raw
      baseDecimals:  18,
      quoteDecimals: 6,
    })
    expect(price).not.toBeNull()
    expect(price!).toBeGreaterThan(0)
    expect(Number.isFinite(price!)).toBe(true)
  })
})
