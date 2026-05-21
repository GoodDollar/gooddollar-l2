import { describe, expect, it } from 'vitest'
import {
  type MarketHoursState,
  calcDynamicSpread,
  calcInventorySkew,
  calcPriceImpact,
  getMarketHoursState,
  getOracleQuote,
} from '../ammPricing'

describe('calcInventorySkew', () => {
  it('returns 0 when inventory is balanced', () => {
    expect(calcInventorySkew(100, 100)).toBe(0)
  })

  it('returns positive when net long', () => {
    expect(calcInventorySkew(150, 50)).toBeGreaterThan(0)
  })

  it('returns negative when net short', () => {
    expect(calcInventorySkew(50, 150)).toBeLessThan(0)
  })

  it('clamps to [-1, 1] range', () => {
    expect(calcInventorySkew(1000, 0)).toBe(1)
    expect(calcInventorySkew(0, 1000)).toBe(-1)
  })

  it('returns 0 when both sides are 0', () => {
    expect(calcInventorySkew(0, 0)).toBe(0)
  })
})

describe('calcDynamicSpread', () => {
  it('returns base spread when inventory is balanced', () => {
    const spread = calcDynamicSpread(0)
    expect(spread).toBeCloseTo(0.003)
  })

  it('widens spread proportional to skew', () => {
    const balanced = calcDynamicSpread(0)
    const skewed = calcDynamicSpread(0.5)
    expect(skewed).toBeGreaterThan(balanced)
  })

  it('reaches max spread at full skew', () => {
    const maxSpread = calcDynamicSpread(1)
    expect(maxSpread).toBeCloseTo(0.023)
  })

  it('is symmetric for long and short skew', () => {
    expect(calcDynamicSpread(0.5)).toBeCloseTo(calcDynamicSpread(-0.5))
  })
})

describe('getOracleQuote', () => {
  it('produces bid < mid < ask', () => {
    const quote = getOracleQuote(100, 0)
    expect(quote.bid).toBeLessThan(quote.mid)
    expect(quote.ask).toBeGreaterThan(quote.mid)
    expect(quote.mid).toBe(100)
  })

  it('shifts bid/ask when skewed long', () => {
    const balanced = getOracleQuote(100, 0)
    const skewedLong = getOracleQuote(100, 0.5)
    expect(skewedLong.ask).toBeGreaterThan(balanced.ask)
  })
})

describe('calcPriceImpact', () => {
  it('returns 0 for zero-size order', () => {
    expect(calcPriceImpact(0, 1_000_000)).toBe(0)
  })

  it('increases with order size', () => {
    const small = calcPriceImpact(1000, 1_000_000)
    const large = calcPriceImpact(100_000, 1_000_000)
    expect(large).toBeGreaterThan(small)
  })

  it('is capped at max impact', () => {
    const huge = calcPriceImpact(10_000_000, 100)
    expect(huge).toBeLessThanOrEqual(0.05)
  })
})

describe('getMarketHoursState', () => {
  it('returns OPEN during US market hours (M-F 9:30-16:00 ET)', () => {
    const tuesday1030ET = new Date('2026-05-19T14:30:00Z')
    expect(getMarketHoursState(tuesday1030ET)).toBe('OPEN' satisfies MarketHoursState)
  })

  it('returns CLOSED on weekends', () => {
    const saturday = new Date('2026-05-17T14:30:00Z')
    expect(getMarketHoursState(saturday)).toBe('CLOSED' satisfies MarketHoursState)
  })

  it('returns PRE_MARKET before open on weekdays', () => {
    const tuesday0800ET = new Date('2026-05-19T12:00:00Z')
    expect(getMarketHoursState(tuesday0800ET)).toBe('PRE_MARKET' satisfies MarketHoursState)
  })

  it('returns AFTER_HOURS after close on weekdays', () => {
    const tuesday1800ET = new Date('2026-05-19T22:00:00Z')
    expect(getMarketHoursState(tuesday1800ET)).toBe('AFTER_HOURS' satisfies MarketHoursState)
  })

  it('returns CLOSED very late at night', () => {
    const tuesday0200ET = new Date('2026-05-19T06:00:00Z')
    expect(getMarketHoursState(tuesday0200ET)).toBe('CLOSED' satisfies MarketHoursState)
  })
})
