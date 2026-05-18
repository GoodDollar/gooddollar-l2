import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getMarketStatus,
  getDaysLeftLabel,
  filterAndSortMarkets,
  selectFeaturedMarket,
  generateProbabilityHistory,
  type PredictionMarket,
} from '../predictData'

// Test fixture helper for selectFeaturedMarket / generateProbabilityHistory
// tests (task 0074). Defaults to non-degenerate values so each test only has
// to override the fields it cares about.
function mkMarket(overrides: Partial<PredictionMarket> = {}): PredictionMarket {
  return {
    id: overrides.id ?? '0',
    question: 'Will X happen?',
    category: 'Crypto',
    yesPrice: 0.5,
    volume: 1000,
    liquidity: 500,
    endDate: '2030-12-31',
    resolved: false,
    resolutionSource: 'test',
    createdAt: '2026-01-01',
    totalShares: 100,
    ...overrides,
  }
}

describe('getMarketStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "expired" for past dates', () => {
    expect(getMarketStatus('2025-12-31')).toBe('expired')
    expect(getMarketStatus('2026-04-01')).toBe('expired')
  })

  it('returns "ending-today" for dates within 24 hours', () => {
    expect(getMarketStatus('2026-04-03')).toBe('ending-today')
  })

  it('returns "active" for future dates', () => {
    expect(getMarketStatus('2026-04-10')).toBe('active')
    expect(getMarketStatus('2027-01-01')).toBe('active')
  })
})

describe('getDaysLeftLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Expired" for past dates', () => {
    expect(getDaysLeftLabel('2025-12-31')).toBe('Expired')
  })

  it('returns "Ending today" for dates within 24h', () => {
    expect(getDaysLeftLabel('2026-04-03')).toBe('Ending today')
  })

  it('returns "Xd left" for future dates', () => {
    expect(getDaysLeftLabel('2026-04-10')).toMatch(/^\d+d left$/)
  })
})

describe('selectFeaturedMarket (task 0074)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when there are no markets', () => {
    expect(selectFeaturedMarket([])).toBeNull()
  })

  it('returns null when every market is expired', () => {
    const markets = [
      mkMarket({ id: 'a', endDate: '2025-01-01', volume: 100 }),
      mkMarket({ id: 'b', endDate: '2024-01-01', volume: 200 }),
    ]
    expect(selectFeaturedMarket(markets)).toBeNull()
  })

  it('prefers a market with positive volume over a zero-volume market with a degenerate yesPrice', () => {
    const markets = [
      // Degenerate seed market — appears first, has 0 volume + 0 yesPrice.
      mkMarket({ id: 'btc-seed', volume: 0, yesPrice: 0, question: 'Will BTC hit $100K by 2026?' }),
      // Real trader has put volume on this one.
      mkMarket({ id: 'real', volume: 5000, yesPrice: 0.42, question: 'Will X win?' }),
    ]
    const featured = selectFeaturedMarket(markets)
    expect(featured?.id).toBe('real')
  })

  it('returns the highest-volume non-zero market when multiple have positive volume', () => {
    const markets = [
      mkMarket({ id: 'small', volume: 100, yesPrice: 0.3 }),
      mkMarket({ id: 'big', volume: 10_000, yesPrice: 0.65 }),
      mkMarket({ id: 'mid', volume: 2_500, yesPrice: 0.5 }),
    ]
    expect(selectFeaturedMarket(markets)?.id).toBe('big')
  })

  it('falls back to the most balanced (yesPrice closest to 0.5) market when all volumes are zero', () => {
    const markets = [
      // Pure degenerate (0% chance).
      mkMarket({ id: 'extreme-no', volume: 0, yesPrice: 0 }),
      // Already-decided (100% chance).
      mkMarket({ id: 'extreme-yes', volume: 0, yesPrice: 1 }),
      // Most uncertain — should win in the all-zero-volume fallback.
      mkMarket({ id: 'balanced', volume: 0, yesPrice: 0.52 }),
    ]
    expect(selectFeaturedMarket(markets)?.id).toBe('balanced')
  })

  it('still picks a zero-volume active market over an expired non-zero market', () => {
    const markets = [
      mkMarket({ id: 'expired-high-vol', volume: 100_000, yesPrice: 0.6, endDate: '2025-01-01' }),
      mkMarket({ id: 'active-zero', volume: 0, yesPrice: 0.55 }),
    ]
    expect(selectFeaturedMarket(markets)?.id).toBe('active-zero')
  })
})

describe('generateProbabilityHistory (task 0074)', () => {
  it('returns null when currentPrice is 0 (degenerate market)', () => {
    expect(generateProbabilityHistory('m1', 0)).toBeNull()
  })

  it('returns null when currentPrice is 1 (already-decided market)', () => {
    expect(generateProbabilityHistory('m1', 1)).toBeNull()
  })

  it('returns null when explicit hasVolume=false is passed for a non-degenerate price', () => {
    // The caller can also opt into "no real history yet" semantics when the
    // market price exists but no trades have happened on chain.
    expect(generateProbabilityHistory('m1', 0.42, 30, false)).toBeNull()
  })

  it('returns a non-null array when the market has real activity', () => {
    const history = generateProbabilityHistory('m1', 0.42, 30, true)
    expect(history).not.toBeNull()
    expect(history!.length).toBeGreaterThan(0)
    // Last point should be the current price (anchor invariant).
    expect(history![history!.length - 1]).toBeCloseTo(0.42, 5)
  })

  it('is deterministic for the same inputs (seeded by marketId)', () => {
    const a = generateProbabilityHistory('same-id', 0.5, 20, true)
    const b = generateProbabilityHistory('same-id', 0.5, 20, true)
    expect(a).toEqual(b)
  })
})

describe('filterAndSortMarkets - ending sort with expired', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('places expired markets after active ones when sorting by ending', () => {
    const markets: PredictionMarket[] = [
      { id: '0', question: 'Expired market', category: 'Crypto', yesPrice: 0.5, volume: 1000, liquidity: 500, endDate: '2025-12-31', resolved: false, resolutionSource: 'test', createdAt: '2025-01-01', totalShares: 100 },
      { id: '1', question: 'Active market 1', category: 'Crypto', yesPrice: 0.7, volume: 2000, liquidity: 1000, endDate: '2026-12-31', resolved: false, resolutionSource: 'test', createdAt: '2026-01-01', totalShares: 200 },
      { id: '2', question: 'Active market 2', category: 'AI & Tech', yesPrice: 0.3, volume: 500, liquidity: 200, endDate: '2027-06-01', resolved: false, resolutionSource: 'test', createdAt: '2026-02-01', totalShares: 50 },
    ]
    const sorted = filterAndSortMarkets(markets, 'All', 'ending', '')
    const statuses = sorted.map(m => getMarketStatus(m.endDate))
    const firstExpiredIdx = statuses.indexOf('expired')
    const lastActiveIdx = statuses.lastIndexOf('active')
    if (firstExpiredIdx !== -1 && lastActiveIdx !== -1) {
      expect(firstExpiredIdx).toBeGreaterThan(lastActiveIdx)
    }
  })
})

describe('filterAndSortMarkets - volume-24h sort (task 0049)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sorts by volume24h descending when all markets have a value', () => {
    const markets: PredictionMarket[] = [
      mkMarket({ id: 'a', volume24h: 100 }),
      mkMarket({ id: 'b', volume24h: 5000 }),
      mkMarket({ id: 'c', volume24h: 0 }),
      mkMarket({ id: 'd', volume24h: 750 }),
    ]
    const sorted = filterAndSortMarkets(markets, 'All', 'volume-24h', '')
    expect(sorted.map(m => m.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('places markets with undefined volume24h after those with a value', () => {
    // First-paint case: some markets have loaded volume, some haven't.
    // We never want a freshly-mounted unknown to outrank an established one.
    const markets: PredictionMarket[] = [
      mkMarket({ id: 'loaded-low', volume24h: 1 }),
      mkMarket({ id: 'unknown', volume24h: undefined }),
      mkMarket({ id: 'loaded-high', volume24h: 10_000 }),
    ]
    const sorted = filterAndSortMarkets(markets, 'All', 'volume-24h', '')
    expect(sorted.map(m => m.id)).toEqual(['loaded-high', 'loaded-low', 'unknown'])
  })

  it('treats expired-vs-active as the primary key, like the other sorts', () => {
    const markets: PredictionMarket[] = [
      mkMarket({ id: 'expired-big', volume24h: 100_000, endDate: '2025-01-01' }),
      mkMarket({ id: 'active-small', volume24h: 10, endDate: '2027-01-01' }),
    ]
    const sorted = filterAndSortMarkets(markets, 'All', 'volume-24h', '')
    // Active must come first even though its 24h volume is way lower.
    expect(sorted[0].id).toBe('active-small')
  })

  it('returns a stable sort when two markets share the same volume24h', () => {
    const markets: PredictionMarket[] = [
      mkMarket({ id: 'a', volume24h: 50 }),
      mkMarket({ id: 'b', volume24h: 50 }),
    ]
    const sorted = filterAndSortMarkets(markets, 'All', 'volume-24h', '')
    // Tie → input order preserved (Array.prototype.sort is stable in modern JS).
    expect(sorted.map(m => m.id)).toEqual(['a', 'b'])
  })
})
