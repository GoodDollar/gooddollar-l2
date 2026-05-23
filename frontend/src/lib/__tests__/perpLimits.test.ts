import { describe, it, expect } from 'vitest'
import {
  PER_SYMBOL_MAX_PERP_SIZE,
  getPerpSizeCap,
  isPerpSizeWithinCap,
} from '../perpLimits'

describe('PER_SYMBOL_MAX_PERP_SIZE', () => {
  it('caps every common perp symbol below the absurd-input pathology', () => {
    // The original report had `99,999,999,999,999` BTC pricing as `$8425Q`.
    // Every entry must be many orders of magnitude below that.
    expect(PER_SYMBOL_MAX_PERP_SIZE.BTC).toBeLessThan(1e6)
    expect(PER_SYMBOL_MAX_PERP_SIZE.ETH).toBeLessThan(1e8)
    expect(PER_SYMBOL_MAX_PERP_SIZE.SOL).toBeLessThan(1e9)
    expect(PER_SYMBOL_MAX_PERP_SIZE.BNB).toBeLessThan(1e9)
    expect(PER_SYMBOL_MAX_PERP_SIZE.ARB).toBeLessThan(1e10)
  })
})

describe('getPerpSizeCap', () => {
  it('returns the table value for known symbols', () => {
    expect(getPerpSizeCap('BTC')).toBe(1_000)
    expect(getPerpSizeCap('ETH')).toBe(50_000)
    expect(getPerpSizeCap('SOL')).toBe(5_000_000)
  })

  it('falls back to the default cap for unknown symbols', () => {
    expect(getPerpSizeCap('UNKNOWN')).toBe(1_000)
    expect(getPerpSizeCap('')).toBe(1_000)
  })

  it('is case-sensitive — matches swapLimits behaviour exactly', () => {
    // 'btc' is not 'BTC' — no normalisation here. The Perps page stores
    // symbols as upper-case constants; matching that contract makes the cap
    // table the single source of truth.
    expect(getPerpSizeCap('btc')).toBe(1_000)
  })
})

describe('isPerpSizeWithinCap', () => {
  it('treats empty / non-numeric / zero inputs as within-cap (no violation yet)', () => {
    expect(isPerpSizeWithinCap('BTC', '')).toBe(true)
    expect(isPerpSizeWithinCap('BTC', 'abc')).toBe(true)
    expect(isPerpSizeWithinCap('BTC', '0')).toBe(true)
    expect(isPerpSizeWithinCap('BTC', 0)).toBe(true)
  })

  it('returns true for sizes well under the cap', () => {
    expect(isPerpSizeWithinCap('BTC', '0.5')).toBe(true)
    expect(isPerpSizeWithinCap('BTC', '1.5')).toBe(true)
    expect(isPerpSizeWithinCap('ETH', '49999')).toBe(true)
  })

  it('returns true exactly at the cap (cap is inclusive)', () => {
    expect(isPerpSizeWithinCap('BTC', '1000')).toBe(true)
    expect(isPerpSizeWithinCap('BTC', 1_000)).toBe(true)
    expect(isPerpSizeWithinCap('ETH', 50_000)).toBe(true)
  })

  it('returns false when the size exceeds the cap', () => {
    expect(isPerpSizeWithinCap('BTC', '1001')).toBe(false)
    expect(isPerpSizeWithinCap('BTC', '99999999999999')).toBe(false)
    expect(isPerpSizeWithinCap('ETH', 50_001)).toBe(false)
  })

  it('uses the default cap for unknown symbols (and rejects above it)', () => {
    expect(isPerpSizeWithinCap('NEW_TOKEN', '999')).toBe(true)
    expect(isPerpSizeWithinCap('NEW_TOKEN', '1001')).toBe(false)
  })

  it('treats non-finite and negative numbers as "no real input" (defensive)', () => {
    expect(isPerpSizeWithinCap('BTC', Number.POSITIVE_INFINITY)).toBe(true)
    expect(isPerpSizeWithinCap('BTC', Number.NaN)).toBe(true)
    expect(isPerpSizeWithinCap('BTC', -5)).toBe(true)
  })
})
