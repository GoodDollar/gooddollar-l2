import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { selectFeaturedMarket, type PredictionMarket } from '../predictData'

/**
 * Regression guard for task 0044.
 *
 * `selectFeaturedMarket` is the single source of truth for which prediction
 * market gets the "Trending" hero treatment on /predict. Lifting it out of
 * <FeaturedMarket /> into a pure helper lets the parent page dedup the chosen
 * market from the active-markets grid below the hero.
 *
 * Rule:
 *   - Skip expired markets entirely.
 *   - Of the remaining markets, pick the one with the highest `volume`.
 *   - On ties, return the first market in input order (reduce semantics).
 *   - Return `null` when there are no active markets.
 */
describe('selectFeaturedMarket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const market = (overrides: Partial<PredictionMarket> & Pick<PredictionMarket, 'id'>): PredictionMarket => ({
    question: `Market ${overrides.id}`,
    category: 'Crypto',
    yesPrice: 0.5,
    volume: 0,
    liquidity: 0,
    endDate: '2027-01-01',
    resolved: false,
    resolutionSource: 'test',
    createdAt: '2026-01-01',
    totalShares: 0,
    ...overrides,
  })

  it('returns null for an empty list', () => {
    expect(selectFeaturedMarket([])).toBeNull()
  })

  it('returns null when every market is expired', () => {
    const markets = [
      market({ id: 'a', endDate: '2025-12-01', volume: 9000 }),
      market({ id: 'b', endDate: '2026-04-01', volume: 8000 }),
    ]
    expect(selectFeaturedMarket(markets)).toBeNull()
  })

  it('returns the single active market when only one exists', () => {
    const markets = [
      market({ id: 'expired', endDate: '2025-01-01', volume: 99999 }),
      market({ id: 'only-active', endDate: '2026-12-31', volume: 100 }),
    ]
    const featured = selectFeaturedMarket(markets)
    expect(featured?.id).toBe('only-active')
  })

  it('returns the highest-volume active market', () => {
    const markets = [
      market({ id: 'low', endDate: '2026-12-31', volume: 100 }),
      market({ id: 'top', endDate: '2026-12-31', volume: 9000 }),
      market({ id: 'mid', endDate: '2026-12-31', volume: 500 }),
    ]
    const featured = selectFeaturedMarket(markets)
    expect(featured?.id).toBe('top')
  })

  it('ignores expired markets even if they have higher volume', () => {
    const markets = [
      market({ id: 'expired-huge', endDate: '2025-01-01', volume: 999999 }),
      market({ id: 'active-small', endDate: '2026-12-31', volume: 100 }),
    ]
    const featured = selectFeaturedMarket(markets)
    expect(featured?.id).toBe('active-small')
  })

  it('keeps the first market on a volume tie (stable selection)', () => {
    const markets = [
      market({ id: 'first', endDate: '2026-12-31', volume: 1000 }),
      market({ id: 'second', endDate: '2026-12-31', volume: 1000 }),
    ]
    const featured = selectFeaturedMarket(markets)
    expect(featured?.id).toBe('first')
  })
})
