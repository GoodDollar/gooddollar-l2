import { describe, it, expect } from 'vitest'
import { PER_SYMBOL_MAX_INPUT, getSwapInputCap, isAmountWithinCap } from '../swapLimits'

describe('PER_SYMBOL_MAX_INPUT', () => {
  it('caps every common protocol symbol below the absurd-input pathology', () => {
    expect(PER_SYMBOL_MAX_INPUT.ETH).toBeLessThan(1e10)
    expect(PER_SYMBOL_MAX_INPUT.WETH).toBeLessThan(1e10)
    expect(PER_SYMBOL_MAX_INPUT.WBTC).toBeLessThan(1e10)
    expect(PER_SYMBOL_MAX_INPUT.USDC).toBeLessThan(1e12)
    expect(PER_SYMBOL_MAX_INPUT['G$']).toBeLessThan(1e12)
  })
})

describe('getSwapInputCap', () => {
  it('returns the table value for known symbols', () => {
    expect(getSwapInputCap('ETH')).toBe(1_000_000)
    expect(getSwapInputCap('USDC')).toBe(100_000_000)
    expect(getSwapInputCap('G$')).toBe(1_000_000_000)
  })

  it('falls back to the default cap for unknown symbols', () => {
    expect(getSwapInputCap('UNKNOWN_TOKEN')).toBe(1_000_000)
    expect(getSwapInputCap('')).toBe(1_000_000)
  })
})

describe('isAmountWithinCap', () => {
  it('treats empty / non-numeric / zero inputs as within-cap (no violation yet)', () => {
    expect(isAmountWithinCap('ETH', '')).toBe(true)
    expect(isAmountWithinCap('ETH', 'abc')).toBe(true)
    expect(isAmountWithinCap('ETH', '0')).toBe(true)
    expect(isAmountWithinCap('ETH', 0)).toBe(true)
  })

  it('returns true for amounts well under the cap', () => {
    expect(isAmountWithinCap('ETH', '0.5')).toBe(true)
    expect(isAmountWithinCap('ETH', '1.5')).toBe(true)
    expect(isAmountWithinCap('ETH', '999999')).toBe(true)
    expect(isAmountWithinCap('USDC', '1000')).toBe(true)
  })

  it('returns true exactly at the cap', () => {
    expect(isAmountWithinCap('ETH', '1000000')).toBe(true)
    expect(isAmountWithinCap('ETH', 1_000_000)).toBe(true)
  })

  it('returns false when amount exceeds the cap', () => {
    expect(isAmountWithinCap('ETH', '1000001')).toBe(false)
    expect(isAmountWithinCap('ETH', '99999999999')).toBe(false)
    expect(isAmountWithinCap('ETH', '99999999999999')).toBe(false)
  })

  it('uses the default cap for unknown symbols (and rejects above it)', () => {
    expect(isAmountWithinCap('NEW_TOKEN', '999999')).toBe(true)
    expect(isAmountWithinCap('NEW_TOKEN', '1000001')).toBe(false)
  })

  it('treats non-finite and negative numbers as "no real input" (defensive)', () => {
    // The cap fires on parseable positive numbers only; defensive callers
    // sending Infinity or negatives are not "over cap", they are "no input".
    expect(isAmountWithinCap('ETH', Number.POSITIVE_INFINITY)).toBe(true)
    expect(isAmountWithinCap('ETH', Number.NaN)).toBe(true)
    expect(isAmountWithinCap('ETH', -5)).toBe(true)
  })
})
