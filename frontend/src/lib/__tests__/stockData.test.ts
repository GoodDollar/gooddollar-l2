import { describe, it, expect } from 'vitest'
import {
  formatStockPrice,
  formatLargeNumber,
  formatLargeCount,
  formatStockShares,
  MAX_STOCK_ORDER_USD,
  getStockData,
  getStockByTicker,
  getAllTickers,
} from '@/lib/stockData'

describe('formatStockPrice', () => {
  it('formats a price with 2 decimal places', () => {
    expect(formatStockPrice(178.72)).toBe('$178.72')
  })

  it('formats a round price', () => {
    expect(formatStockPrice(100)).toBe('$100.00')
  })

  it('formats a large price with commas', () => {
    const result = formatStockPrice(1234.56)
    expect(result).toBe('$1,234.56')
  })

  it('formats a negative price', () => {
    const result = formatStockPrice(-50.25)
    expect(result).toMatch(/-?\$?50\.25|\$-50\.25/)
  })
})

describe('formatLargeNumber', () => {
  it('formats trillions', () => {
    expect(formatLargeNumber(2.5e12)).toBe('$2.50T')
  })

  it('formats billions', () => {
    expect(formatLargeNumber(1_500_000_000)).toBe('$1.5B')
  })

  it('formats millions', () => {
    expect(formatLargeNumber(3_200_000)).toBe('$3.2M')
  })

  it('formats thousands', () => {
    expect(formatLargeNumber(5000)).toBe('$5K')
  })

  it('formats values under 1000', () => {
    expect(formatLargeNumber(250)).toBe('$250')
  })
})

describe('formatLargeCount', () => {
  it('does NOT prefix with a dollar sign', () => {
    expect(formatLargeCount(1_500_000_000)).toBe('1.5B')
    expect(formatLargeCount(1_500_000_000)).not.toContain('$')
  })

  it('formats trillions without dollar sign', () => {
    expect(formatLargeCount(2.5e12)).toBe('2.50T')
  })

  it('formats millions without dollar sign', () => {
    expect(formatLargeCount(3_200_000)).toBe('3.2M')
  })

  it('formats thousands without dollar sign', () => {
    expect(formatLargeCount(5000)).toBe('5K')
  })

  it('formats values under 1000 without dollar sign', () => {
    expect(formatLargeCount(250)).toBe('250')
  })
})

describe('formatStockShares', () => {
  it('renders zero as four-decimal zero', () => {
    expect(formatStockShares(0)).toBe('0.0000')
  })

  it('renders a small fractional share with four decimals', () => {
    expect(formatStockShares(1.5)).toBe('1.5000')
  })

  it('renders thousands with the K suffix', () => {
    expect(formatStockShares(1_500)).toBe('1.5K')
  })

  it('renders millions with the M suffix', () => {
    expect(formatStockShares(1_500_000)).toBe('1.50M')
  })

  it('renders billions with the B suffix', () => {
    expect(formatStockShares(1_500_000_000)).toBe('1.50B')
  })

  it('renders trillions with the T suffix', () => {
    expect(formatStockShares(1.5e12)).toBe('1.50T')
  })

  it('renders Infinity as 0 rather than leaking "Infinity" into the UI', () => {
    expect(formatStockShares(Number.POSITIVE_INFINITY)).toBe('0')
  })

  it('renders NaN as 0 rather than leaking "NaN" into the UI', () => {
    expect(formatStockShares(Number.NaN)).toBe('0')
  })

  it('preserves the sign for negative share counts', () => {
    expect(formatStockShares(-1_500_000)).toBe('-1.50M')
  })
})

describe('MAX_STOCK_ORDER_USD', () => {
  it('is a finite positive number', () => {
    expect(Number.isFinite(MAX_STOCK_ORDER_USD)).toBe(true)
    expect(MAX_STOCK_ORDER_USD).toBeGreaterThan(0)
  })

  it('is comfortably below 2^53 (no JS-number drift on parseFloat round-trip)', () => {
    expect(MAX_STOCK_ORDER_USD).toBeLessThan(Number.MAX_SAFE_INTEGER)
  })
})

describe('getStockData (deprecated — returns empty, use hooks)', () => {
  it('returns an empty array (data now comes from useOnChainStocks hook)', () => {
    const stocks = getStockData()
    expect(stocks).toEqual([])
  })
})

describe('getStockByTicker (deprecated — returns undefined, use hooks)', () => {
  it('returns undefined (data now comes from useOnChainStocks hook)', () => {
    expect(getStockByTicker('AAPL')).toBeUndefined()
  })

  it('returns undefined for unknown ticker', () => {
    expect(getStockByTicker('XXXX')).toBeUndefined()
  })
})

describe('getAllTickers', () => {
  it('returns an array of ticker strings', () => {
    const tickers = getAllTickers()
    expect(tickers.length).toBeGreaterThan(0)
    expect(tickers.every(t => typeof t === 'string')).toBe(true)
  })

  it('includes AAPL', () => {
    expect(getAllTickers()).toContain('AAPL')
  })
})
