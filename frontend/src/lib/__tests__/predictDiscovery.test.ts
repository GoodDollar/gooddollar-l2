/**
 * predictDiscovery.test.ts — Unit tests for the discovery-sidebar selectors
 * (task 0048).
 *
 * The Polymarket parity sidebar needs two pure, deterministic, side-effect-free
 * helpers that the React component can render over. We TDD them here first so
 * the ranking rules are pinned down before any UI is wired up.
 *
 *   - `selectBreakingNews(markets, n)` returns up to `n` active markets ranked
 *     by "most actionable right now". Until task 0049's 24h-volume signal is
 *     plumbed everywhere, the placeholder ranking is "yesPrice distance from
 *     0.5 ascending, tiebreaker volume descending". `selectBreakingNews` MUST
 *     prefer real 24h volume when it's available (so that as soon as the hook
 *     lands, this widget upgrades automatically without a code change here).
 *   - `selectHotTopics(markets, n)` aggregates `volume` by `category`, drops
 *     empty categories, and returns up to `n` entries sorted by total
 *     descending.
 */
import { describe, it, expect } from 'vitest'
import type { PredictionMarket } from '../predictData'
import { selectBreakingNews, selectHotTopics } from '../predictDiscovery'

function mkMarket(overrides: Partial<PredictionMarket> = {}): PredictionMarket {
  return {
    id: overrides.id ?? '0',
    question: 'Will X happen?',
    category: 'Crypto',
    yesPrice: 0.5,
    volume: 0,
    liquidity: 100,
    endDate: '2030-12-31',
    resolved: false,
    resolutionSource: 'test',
    createdAt: '2026-01-01',
    totalShares: 100,
    ...overrides,
  }
}

describe('selectBreakingNews', () => {
  it('returns an empty array when there are no markets', () => {
    expect(selectBreakingNews([], 3)).toEqual([])
  })

  it('returns an empty array when every market is expired', () => {
    const past = '2020-01-01'
    const markets = [
      mkMarket({ id: '0', endDate: past, yesPrice: 0.4, volume: 100 }),
      mkMarket({ id: '1', endDate: past, yesPrice: 0.6, volume: 200 }),
    ]
    expect(selectBreakingNews(markets, 3)).toEqual([])
  })

  it('caps the result at n active markets', () => {
    const markets = Array.from({ length: 10 }, (_, i) =>
      mkMarket({ id: String(i), yesPrice: 0.5, volume: 100 + i }),
    )
    expect(selectBreakingNews(markets, 3)).toHaveLength(3)
    expect(selectBreakingNews(markets, 1)).toHaveLength(1)
  })

  it('returns fewer than n when there are fewer active markets', () => {
    const markets = [
      mkMarket({ id: '0', yesPrice: 0.4, volume: 100 }),
      mkMarket({ id: '1', yesPrice: 0.6, volume: 200 }),
    ]
    expect(selectBreakingNews(markets, 5)).toHaveLength(2)
  })

  it('drops expired markets from the ranking', () => {
    const past = '2020-01-01'
    const markets = [
      mkMarket({ id: 'expired', endDate: past, yesPrice: 0.5, volume: 1000 }),
      mkMarket({ id: 'active', yesPrice: 0.45, volume: 200 }),
    ]
    const result = selectBreakingNews(markets, 3)
    expect(result).toHaveLength(1)
    expect(result[0].market.id).toBe('active')
  })

  it('ranks by distance from 0.5 ascending when no 24h volume signal is available', () => {
    // Three active markets at different "uncertainty" levels:
    //   id=A is at 0.5 → distance 0 (most actionable)
    //   id=B is at 0.4 → distance 0.1
    //   id=C is at 0.1 → distance 0.4 (least actionable)
    const markets = [
      mkMarket({ id: 'C', yesPrice: 0.1, volume: 999 }),
      mkMarket({ id: 'A', yesPrice: 0.5, volume: 10 }),
      mkMarket({ id: 'B', yesPrice: 0.4, volume: 100 }),
    ]
    const result = selectBreakingNews(markets, 3)
    expect(result.map(r => r.market.id)).toEqual(['A', 'B', 'C'])
  })

  it('breaks distance ties by all-time volume descending', () => {
    // Both at distance 0.1 → tiebreaker by volume.
    const markets = [
      mkMarket({ id: 'low-vol', yesPrice: 0.4, volume: 100 }),
      mkMarket({ id: 'high-vol', yesPrice: 0.6, volume: 500 }),
    ]
    const result = selectBreakingNews(markets, 2)
    expect(result.map(r => r.market.id)).toEqual(['high-vol', 'low-vol'])
  })

  it('prefers markets with a loaded 24h volume signal when present', () => {
    // When volume24h is populated, it MUST drive the ranking (highest first)
    // so that the widget automatically upgrades from "uncertainty proxy" to
    // "real momentum" the moment task 0049's hook returns data for any
    // market. Markets without volume24h still appear, sorted by the
    // uncertainty fallback.
    const markets = [
      mkMarket({ id: 'hot', yesPrice: 0.9, volume: 10, volume24h: 5000 }),
      mkMarket({ id: 'warm', yesPrice: 0.5, volume: 10, volume24h: 100 }),
      mkMarket({ id: 'cold', yesPrice: 0.5, volume: 10 }),
    ]
    const result = selectBreakingNews(markets, 3)
    expect(result.map(r => r.market.id)).toEqual(['hot', 'warm', 'cold'])
  })

  it('emits a shape compatible with future per-market 24h deltas', () => {
    // Forward-compat: the component renders `result[i].delta` for the
    // up/down arrow. Until 0049 lands per-market deltas as a signed number,
    // selectBreakingNews returns `delta: null` so the component knows to
    // hide the chip.
    const markets = [mkMarket({ id: '0' })]
    const result = selectBreakingNews(markets, 3)
    expect(result[0]).toMatchObject({ market: expect.any(Object), delta: null })
  })

  it('is stable: same input → same output ordering', () => {
    const markets = [
      mkMarket({ id: 'A', yesPrice: 0.5, volume: 100 }),
      mkMarket({ id: 'B', yesPrice: 0.5, volume: 100 }),
      mkMarket({ id: 'C', yesPrice: 0.5, volume: 100 }),
    ]
    const r1 = selectBreakingNews(markets, 3).map(r => r.market.id)
    const r2 = selectBreakingNews(markets, 3).map(r => r.market.id)
    expect(r1).toEqual(r2)
  })
})

describe('selectHotTopics', () => {
  it('returns an empty array when there are no markets', () => {
    expect(selectHotTopics([], 4)).toEqual([])
  })

  it('aggregates volume per category and returns highest first', () => {
    const markets = [
      mkMarket({ id: '1', category: 'Crypto', volume: 100 }),
      mkMarket({ id: '2', category: 'Crypto', volume: 200 }),
      mkMarket({ id: '3', category: 'Sports', volume: 50 }),
      mkMarket({ id: '4', category: 'Politics', volume: 1000 }),
    ]
    const result = selectHotTopics(markets, 4)
    expect(result.map(t => t.category)).toEqual(['Politics', 'Crypto', 'Sports'])
    expect(result.find(t => t.category === 'Crypto')?.total).toBe(300)
    expect(result.find(t => t.category === 'Politics')?.total).toBe(1000)
    expect(result.find(t => t.category === 'Sports')?.total).toBe(50)
  })

  it('includes a count of how many markets fed each topic', () => {
    const markets = [
      mkMarket({ id: '1', category: 'Crypto', volume: 100 }),
      mkMarket({ id: '2', category: 'Crypto', volume: 200 }),
      mkMarket({ id: '3', category: 'Politics', volume: 50 }),
    ]
    const result = selectHotTopics(markets, 4)
    expect(result.find(t => t.category === 'Crypto')?.count).toBe(2)
    expect(result.find(t => t.category === 'Politics')?.count).toBe(1)
  })

  it('drops categories with zero markets (not rendered as $0)', () => {
    // The spec says: "A category with zero markets is omitted from the
    // rendered list, not shown as $0." This is the difference between
    // "iterate over ALL_CATEGORIES" (would yield 6 rows always) and
    // "reduce over markets" (yields only what exists).
    const markets = [
      mkMarket({ id: '1', category: 'Crypto', volume: 100 }),
    ]
    const result = selectHotTopics(markets, 4)
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('Crypto')
  })

  it('caps the result at n entries', () => {
    const markets = [
      mkMarket({ id: '1', category: 'Crypto', volume: 100 }),
      mkMarket({ id: '2', category: 'Politics', volume: 200 }),
      mkMarket({ id: '3', category: 'Sports', volume: 300 }),
      mkMarket({ id: '4', category: 'AI & Tech', volume: 400 }),
      mkMarket({ id: '5', category: 'World Events', volume: 500 }),
      mkMarket({ id: '6', category: 'Culture', volume: 600 }),
    ]
    const result = selectHotTopics(markets, 3)
    expect(result).toHaveLength(3)
    // Top 3 by volume: Culture, World Events, AI & Tech.
    expect(result.map(t => t.category)).toEqual(['Culture', 'World Events', 'AI & Tech'])
  })

  it('counts expired markets in the aggregation (lifetime volume signal)', () => {
    // Hot topics aren't a "what's live right now" signal — they represent
    // sustained traction. We keep expired markets in the aggregate so a
    // freshly-resolved high-volume market still shows its category as hot
    // for a bit. (Active-only filtering is the breaking-news widget's job.)
    const markets = [
      mkMarket({ id: '1', category: 'Crypto', endDate: '2020-01-01', volume: 1000 }),
      mkMarket({ id: '2', category: 'Sports', volume: 100 }),
    ]
    const result = selectHotTopics(markets, 4)
    expect(result.map(t => t.category)).toEqual(['Crypto', 'Sports'])
  })

  it('is stable for ties (same input order → same output order)', () => {
    const markets = [
      mkMarket({ id: '1', category: 'Crypto', volume: 100 }),
      mkMarket({ id: '2', category: 'Sports', volume: 100 }),
    ]
    const result = selectHotTopics(markets, 4)
    // Tie at 100 each — either order is acceptable for the *implementation*,
    // but the function must be deterministic, so the second call returns
    // the same order as the first.
    const result2 = selectHotTopics(markets, 4)
    expect(result.map(t => t.category)).toEqual(result2.map(t => t.category))
  })
})
