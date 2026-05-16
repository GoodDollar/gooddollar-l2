import { describe, it, expect } from 'vitest'
import { computePriceImpactBps, computePriceImpactPct, getPriceImpactSeverity } from '../useOnChainSwap'

describe('computePriceImpactBps', () => {
  it('returns 0 when reference input is zero (avoids divide-by-zero)', () => {
    expect(computePriceImpactBps(0n, 1000n, 100n, 95n)).toBe(0)
  })

  it('returns 0 when actual input is zero (no trade to price)', () => {
    expect(computePriceImpactBps(1n, 1000n, 0n, 0n)).toBe(0)
  })

  it('computes ~5% (500 bps) impact when executed rate is 5% below spot', () => {
    // ref: 1 in -> 1 out  (spot rate = 1.0)
    // actual: 100 in -> 95 out (executed rate = 0.95)
    // impact = (1.0 - 0.95) / 1.0 = 5.00% = 500 bps
    const refIn = 10n ** 18n // 1 token
    const refOut = 10n ** 18n // 1 token (1:1 spot)
    const actualIn = 100n * 10n ** 18n
    const actualOut = 95n * 10n ** 18n
    expect(computePriceImpactBps(refIn, refOut, actualIn, actualOut)).toBe(500)
  })

  it('computes ~50% (5000 bps) impact for half-output drain', () => {
    const refIn = 10n ** 18n
    const refOut = 10n ** 18n
    const actualIn = 100n * 10n ** 18n
    const actualOut = 50n * 10n ** 18n
    expect(computePriceImpactBps(refIn, refOut, actualIn, actualOut)).toBe(5000)
  })

  it('clamps to 0 when executed rate is slightly better than spot (rounding artefact)', () => {
    // executed rate marginally above spot — clamp to 0, not negative
    const refIn = 10n ** 18n
    const refOut = 10n ** 18n
    const actualIn = 100n * 10n ** 18n
    const actualOut = 100n * 10n ** 18n + 1n // +1 wei from rounding
    expect(computePriceImpactBps(refIn, refOut, actualIn, actualOut)).toBe(0)
  })

  it('clamps to 10000 bps (100%) when actualOut is zero (pool drained)', () => {
    const refIn = 10n ** 18n
    const refOut = 10n ** 18n
    const actualIn = 100n * 10n ** 18n
    const actualOut = 0n
    expect(computePriceImpactBps(refIn, refOut, actualIn, actualOut)).toBe(10000)
  })

  it('handles asymmetric decimals (USDC 6dec out for G$ 18dec in)', () => {
    // ref: 1 G$ -> 0.0001 USDC (1e2 in 6 decimals)
    // actual: 1000 G$ -> 0.095 USDC (95000 in 6 decimals — 5% below spot)
    const refIn = 10n ** 18n
    const refOut = 100n // 0.0001 USDC
    const actualIn = 1000n * 10n ** 18n
    const actualOut = 95_000n // 0.095 USDC instead of 0.1
    expect(computePriceImpactBps(refIn, refOut, actualIn, actualOut)).toBe(500)
  })
})

describe('computePriceImpactPct', () => {
  it('returns the bps value as a fractional percent', () => {
    const refIn = 10n ** 18n
    const refOut = 10n ** 18n
    expect(computePriceImpactPct(refIn, refOut, 100n * 10n ** 18n, 95n * 10n ** 18n)).toBe(5)
    expect(computePriceImpactPct(refIn, refOut, 100n * 10n ** 18n, 99n * 10n ** 18n + 5n * 10n ** 17n)).toBeCloseTo(0.5, 1)
  })

  it('returns 0 for the no-trade / divide-by-zero cases', () => {
    expect(computePriceImpactPct(0n, 0n, 0n, 0n)).toBe(0)
    expect(computePriceImpactPct(10n ** 18n, 10n ** 18n, 0n, 0n)).toBe(0)
  })
})

describe('getPriceImpactSeverity', () => {
  it('classifies impact into the tiered severity scale', () => {
    expect(getPriceImpactSeverity(0)).toBe('normal')
    expect(getPriceImpactSeverity(0.5)).toBe('normal')
    expect(getPriceImpactSeverity(1)).toBe('notice')
    expect(getPriceImpactSeverity(2.99)).toBe('notice')
    expect(getPriceImpactSeverity(3)).toBe('warning')
    expect(getPriceImpactSeverity(4.99)).toBe('warning')
    expect(getPriceImpactSeverity(5)).toBe('high')
    expect(getPriceImpactSeverity(14.99)).toBe('high')
    expect(getPriceImpactSeverity(15)).toBe('extreme')
    expect(getPriceImpactSeverity(99)).toBe('extreme')
  })

  it('treats negative or NaN as normal (defensive)', () => {
    expect(getPriceImpactSeverity(-1)).toBe('normal')
    expect(getPriceImpactSeverity(NaN)).toBe('normal')
  })
})
