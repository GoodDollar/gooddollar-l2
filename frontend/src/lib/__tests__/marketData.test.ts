import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatVolume,
  formatMarketCap,
  getTokenBySymbol,
  getTokenMarketData,
  MARKET_DATA_PLACEHOLDER,
} from '@/lib/marketData'

describe('formatPrice', () => {
  it('formats large prices with locale comma separators', () => {
    const result = formatPrice(60125.80)
    expect(result).toMatch(/^\$60,?125/)
  })

  it('formats mid-range prices with 2 decimals', () => {
    expect(formatPrice(3.45)).toBe('$3.45')
  })

  it('formats small prices with 4 decimals', () => {
    expect(formatPrice(0.05)).toBe('$0.0500')
  })

  it('formats very small prices with 6 decimals', () => {
    expect(formatPrice(0.0001)).toBe('$0.000100')
  })
})

describe('formatVolume', () => {
  it('formats trillions', () => {
    expect(formatVolume(1.5e12)).toBe('$1.50T')
  })

  it('formats billions', () => {
    expect(formatVolume(2_450_000_000)).toBe('$2.45B')
  })

  it('formats millions', () => {
    expect(formatVolume(1_200_000)).toBe('$1.2M')
  })

  it('formats thousands', () => {
    expect(formatVolume(8500)).toBe('$9K')
  })

  it('formats sub-thousand values', () => {
    expect(formatVolume(123)).toBe('$123')
  })

  it('returns the unavailable placeholder for null', () => {
    expect(formatVolume(null)).toBe(MARKET_DATA_PLACEHOLDER)
  })

  it('returns the unavailable placeholder for undefined', () => {
    expect(formatVolume(undefined)).toBe(MARKET_DATA_PLACEHOLDER)
  })

  it('still formats zero as a real value (not unavailable)', () => {
    // 0 is a legitimate value (e.g. literally no trading), distinct from
    // "we don't know" which is represented by null / undefined.
    expect(formatVolume(0)).toBe('$0')
  })
})

describe('formatMarketCap', () => {
  it('mirrors formatVolume for numeric values', () => {
    expect(formatMarketCap(2_450_000_000)).toBe('$2.45B')
    expect(formatMarketCap(0)).toBe('$0')
  })

  it('returns the unavailable placeholder for null / undefined', () => {
    expect(formatMarketCap(null)).toBe(MARKET_DATA_PLACEHOLDER)
    expect(formatMarketCap(undefined)).toBe(MARKET_DATA_PLACEHOLDER)
  })
})

describe('getTokenMarketData (deprecated — returns empty, use hooks)', () => {
  it('returns an empty array (data now comes from useOnChainMarketData hook)', () => {
    const data = getTokenMarketData()
    expect(data).toEqual([])
  })
})

describe('getTokenBySymbol (deprecated — returns undefined, use hooks)', () => {
  it('returns undefined (data now comes from useOnChainMarketData hook)', () => {
    expect(getTokenBySymbol('ETH')).toBeUndefined()
  })

  it('returns undefined for unknown symbol', () => {
    expect(getTokenBySymbol('NOTREAL')).toBeUndefined()
  })
})
