import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatVolume,
  formatMarketCap,
  getTokenBySymbol,
  getTokenMarketData,
  MARKET_DATA_PLACEHOLDER,
  selectTopGainers,
  MIN_VISIBLE_GAINER_PCT,
  type TokenMarketData,
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

// ─── selectTopGainers (task 0052) ────────────────────────────────────────────
//
// The Explore "Top Gainers" card was rendering DAI as a ▲0.0% gainer because
// the inline `change24h > 0` filter let through any positive value, including
// values that round to 0.0% under `.toFixed(1)`. We tighten the floor to
// match the display rounding (0.05%) and extract the selection to a pure
// helper so it can be unit-tested deterministically.

function mockToken(
  symbol: string,
  change24h: number | null,
  overrides: Partial<TokenMarketData> = {},
): TokenMarketData {
  return {
    symbol,
    name: symbol,
    decimals: 18,
    category: 'DeFi',
    price: 1,
    change1h: null,
    change24h,
    change7d: null,
    volume24h: null,
    marketCap: 0,
    sparkline7d: null,
    description: '',
    ...overrides,
  }
}

describe('MIN_VISIBLE_GAINER_PCT', () => {
  it('is 0.05 — the smallest value that does NOT round to 0.0% under toFixed(1)', () => {
    // Display formula in explore/page.tsx: `change24h.toFixed(1)`.
    // 0.04 → "0.0", 0.05 → "0.1". Anything below the floor is invisible.
    expect(MIN_VISIBLE_GAINER_PCT).toBe(0.05)
    expect((0.04).toFixed(1)).toBe('0.0')
    expect((0.05).toFixed(1)).toBe('0.1')
  })
})

describe('selectTopGainers', () => {
  it('excludes tokens whose change24h rounds to 0.0% (the original DAI bug)', () => {
    const tokens = [
      mockToken('DAI', 0.02),     // would display as "0.0%" — must be excluded
      mockToken('USDC', 0.5),     // legitimate gainer
      mockToken('USDT', -1.0),    // not a gainer
    ]
    const gainers = selectTopGainers(tokens, 3)
    expect(gainers.map(t => t.symbol)).toEqual(['USDC'])
  })

  it('returns empty array when all changes round to zero or are negative', () => {
    const tokens = [
      mockToken('A', 0),
      mockToken('B', 0.01),
      mockToken('C', -0.5),
      mockToken('D', 0.049),  // just under the floor
    ]
    expect(selectTopGainers(tokens, 3)).toEqual([])
  })

  it('excludes tokens with null change24h (unknown is not a gainer)', () => {
    const tokens = [
      mockToken('A', null),
      mockToken('B', 0.10),
    ]
    const gainers = selectTopGainers(tokens, 3)
    expect(gainers.map(t => t.symbol)).toEqual(['B'])
  })

  it('sorts by change24h descending and slices to the requested length', () => {
    const tokens = [
      mockToken('LOW', 0.10),
      mockToken('HIGH', 5.0),
      mockToken('MID', 1.2),
      mockToken('EXTRA', 0.30),
    ]
    const gainers = selectTopGainers(tokens, 3)
    expect(gainers.map(t => t.symbol)).toEqual(['HIGH', 'MID', 'EXTRA'])
  })

  it('respects a custom n', () => {
    const tokens = [
      mockToken('A', 1.0),
      mockToken('B', 2.0),
      mockToken('C', 3.0),
    ]
    expect(selectTopGainers(tokens, 1).map(t => t.symbol)).toEqual(['C'])
    expect(selectTopGainers(tokens, 5).map(t => t.symbol)).toEqual(['C', 'B', 'A'])
  })

  it('does not mutate the input array', () => {
    const tokens = [
      mockToken('A', 0.10),
      mockToken('B', 0.20),
    ]
    const snapshot = tokens.map(t => t.symbol)
    selectTopGainers(tokens, 3)
    expect(tokens.map(t => t.symbol)).toEqual(snapshot)
  })

  it('returns an empty array for an empty input', () => {
    expect(selectTopGainers([], 3)).toEqual([])
  })
})
