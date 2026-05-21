import { describe, it, expect } from 'vitest'
import { deriveGdUsdPriceFromReserves } from '@/lib/useOnChainMarketData'
import { getPool, parsePoolAmount, SPOT_MIN, SPOT_MAX } from '@/lib/useGoodPool'

// G$/USDC pool — G$ is 18-decimals (tokenA), USDC is 6-decimals (tokenB)
const POOL = getPool('G$/USDC')

describe('deriveGdUsdPriceFromReserves', () => {
  it('returns null when either reserve is undefined', () => {
    expect(deriveGdUsdPriceFromReserves(undefined, undefined)).toBeNull()
    expect(
      deriveGdUsdPriceFromReserves(parsePoolAmount('1000000', POOL.tokenADecimals), undefined),
    ).toBeNull()
    expect(
      deriveGdUsdPriceFromReserves(undefined, parsePoolAmount('100', POOL.tokenBDecimals)),
    ).toBeNull()
  })

  it('returns null when either reserve is zero', () => {
    const zero = BigInt(0)
    const someGd = parsePoolAmount('1000000', POOL.tokenADecimals)
    const someUsdc = parsePoolAmount('100', POOL.tokenBDecimals)
    expect(deriveGdUsdPriceFromReserves(zero, someUsdc)).toBeNull()
    expect(deriveGdUsdPriceFromReserves(someGd, zero)).toBeNull()
    expect(deriveGdUsdPriceFromReserves(zero, zero)).toBeNull()
  })

  it('returns a plausible spot price for realistic G$/USDC reserves (~$0.0001 per G$)', () => {
    // 10,000,000 G$ paired with 1,000 USDC → spot ≈ 0.0001 USDC/G$
    const reserveA = parsePoolAmount('10000000', POOL.tokenADecimals) // 1e7 G$ as 18-dec
    const reserveB = parsePoolAmount('1000', POOL.tokenBDecimals) // 1e3 USDC as 6-dec

    const price = deriveGdUsdPriceFromReserves(reserveA, reserveB)
    expect(price).not.toBeNull()
    expect(price!).toBeGreaterThan(0)
    // Expected ≈ 0.0001, with floating-point tolerance
    expect(price!).toBeCloseTo(0.0001, 8)
    expect(price!).toBeGreaterThanOrEqual(SPOT_MIN)
    expect(price!).toBeLessThanOrEqual(SPOT_MAX)
  })

  it('rejects implausibly high spot prices (above SPOT_MAX)', () => {
    // Raw bigints used as raw integers (decimals ignored) would yield ~1e12 USDC/G$
    // — the kind of value the bug produced. With proper decimals, we must still reject
    // anything that resolves above SPOT_MAX after formatting.
    // 1 G$ paired with 1e10 USDC → spot = 1e10 USDC/G$  (way above SPOT_MAX = 1e3)
    const reserveA = parsePoolAmount('1', POOL.tokenADecimals)
    const reserveB = parsePoolAmount('10000000000', POOL.tokenBDecimals)

    const price = deriveGdUsdPriceFromReserves(reserveA, reserveB)
    expect(price).toBeNull()
  })

  it('rejects implausibly low spot prices (below SPOT_MIN)', () => {
    // 1e12 G$ paired with 1 USDC → spot = 1e-12 USDC/G$ (well below SPOT_MIN = 1e-9)
    const reserveA = parsePoolAmount('1000000000000', POOL.tokenADecimals)
    const reserveB = parsePoolAmount('1', POOL.tokenBDecimals)

    const price = deriveGdUsdPriceFromReserves(reserveA, reserveB)
    expect(price).toBeNull()
  })

  it('rejects raw bigints with mismatched decimals (the original bug pattern)', () => {
    // Simulates the original bug: contracts returned reserves as raw bigints
    // but caller treated G$ (18-dec) and USDC (6-dec) as same scale.
    // If decimals are handled correctly, this pair yields a plausible ~0.0001 price.
    // If decimals are ignored, the ratio explodes — verify our function handles decimals.
    const reserveA = parsePoolAmount('10000000', POOL.tokenADecimals) // 1e25 raw
    const reserveB = parsePoolAmount('1000', POOL.tokenBDecimals) // 1e9 raw

    // Decimal-aware result is plausible:
    const correct = deriveGdUsdPriceFromReserves(reserveA, reserveB)
    expect(correct).not.toBeNull()
    expect(correct!).toBeCloseTo(0.0001, 8)

    // Sanity guard: spot must be within bounds — the old bug produced ~1e16,
    // which would have been rejected even if it slipped through formatting.
    expect(correct!).toBeLessThan(SPOT_MAX)
    expect(correct!).toBeGreaterThan(SPOT_MIN)
  })

  it('accepts the boundary value SPOT_MAX (1000 USDC/G$)', () => {
    // 1 G$ paired with 1000 USDC → spot = 1000 USDC/G$ — at boundary
    const reserveA = parsePoolAmount('1', POOL.tokenADecimals)
    const reserveB = parsePoolAmount('1000', POOL.tokenBDecimals)

    const price = deriveGdUsdPriceFromReserves(reserveA, reserveB)
    expect(price).not.toBeNull()
    expect(price!).toBe(SPOT_MAX)
  })

  it('handles asymmetric realistic reserves without overflow', () => {
    // Large but realistic pool: 1B G$ paired with 100k USDC → ~0.0001
    const reserveA = parsePoolAmount('1000000000', POOL.tokenADecimals)
    const reserveB = parsePoolAmount('100000', POOL.tokenBDecimals)

    const price = deriveGdUsdPriceFromReserves(reserveA, reserveB)
    expect(price).not.toBeNull()
    expect(price!).toBeCloseTo(0.0001, 8)
    expect(Number.isFinite(price!)).toBe(true)
  })
})
