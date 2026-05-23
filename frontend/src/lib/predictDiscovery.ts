/**
 * predictDiscovery.ts — Pure selectors that power the Polymarket-parity
 * discovery sidebar on the Predict page (task 0048).
 *
 * The right-rail sidebar renders two widgets:
 *
 *   • **Breaking news.** Up to N active markets where _something is about to
 *     happen_. Ranking prefers the most actionable signal we have: if real
 *     24h trade volume is loaded (task 0049), it drives ordering. Otherwise
 *     we fall back to "yesPrice distance from 0.5 ascending" — the closer the
 *     market is to a coin flip, the more impactful the next trade is. Ties
 *     break by all-time volume descending.
 *
 *   • **Hot topics.** Volume aggregated by category and capped at N rows.
 *     Categories with zero markets are omitted (not rendered as $0).
 *
 * Both selectors are pure, deterministic, and free of `Date`/`Math.random()`
 * side effects so that they are safe to memoize and trivial to unit-test.
 * `getMarketStatus(endDate)` does call `new Date()` internally, but only to
 * decide whether a market is expired — that is a property of "now" by design
 * and matches how the rest of the Predict page renders the same data.
 */
import type { PredictionMarket } from './predictData'
import { getMarketStatus } from './predictData'
import type { MarketCategory } from './predictData'

/**
 * Shape returned by `selectBreakingNews`. `delta` is a forward-compat slot
 * for the per-market 24h price/volume delta from task 0049's hook. Until
 * that wiring is plumbed end-to-end, it is `null` and the sidebar renders
 * no chip.
 */
export interface BreakingNewsEntry {
  market: PredictionMarket
  delta: number | null
}

/**
 * Shape returned by `selectHotTopics`. `total` is the summed
 * `market.volume` across `count` markets in this category.
 */
export interface HotTopicEntry {
  category: MarketCategory
  total: number
  count: number
}

/**
 * Pick up to `n` active markets to display in the "Breaking news" widget.
 *
 * Algorithm:
 *
 *   1. Filter out expired markets (`getMarketStatus(endDate) === 'expired'`).
 *   2. Sort by "best signal we have":
 *      - Primary: `volume24h` descending when it is a positive finite number.
 *        Markets without a loaded 24h signal fall through to the secondary
 *        rule below.
 *      - Secondary: `Math.abs(yesPrice - 0.5)` ascending — markets near 50%
 *        are the most actionable. (A 99%-likely market is "boring".)
 *      - Tiebreaker: all-time `volume` descending.
 *   3. Cap at `n`.
 *
 * The implementation produces a stable ordering for repeated calls on the
 * same input because all comparisons are total and depend only on the
 * market fields themselves.
 *
 * @param markets Source list (typically the full `allMarkets` from the page).
 * @param n Maximum number of entries to return. Default 3.
 */
export function selectBreakingNews(markets: PredictionMarket[], n = 3): BreakingNewsEntry[] {
  const active = markets.filter(m => getMarketStatus(m.endDate) !== 'expired')

  const has24h = (m: PredictionMarket): boolean =>
    typeof m.volume24h === 'number' && Number.isFinite(m.volume24h) && m.volume24h > 0

  // Stable sort: V8's Array.prototype.sort is stable as of ES2019, so we
  // rely on that. The compound comparator below is total and deterministic.
  const sorted = [...active].sort((a, b) => {
    const aHas24h = has24h(a)
    const bHas24h = has24h(b)
    if (aHas24h && bHas24h) {
      // Both loaded — higher 24h volume wins.
      return (b.volume24h ?? 0) - (a.volume24h ?? 0)
    }
    if (aHas24h !== bHas24h) {
      // The market with the real signal always outranks one without.
      return aHas24h ? -1 : 1
    }
    // Neither loaded — fall back to "uncertainty" proxy.
    const aDist = Math.abs(a.yesPrice - 0.5)
    const bDist = Math.abs(b.yesPrice - 0.5)
    if (aDist !== bDist) return aDist - bDist
    return b.volume - a.volume
  })

  return sorted.slice(0, Math.max(0, n)).map(market => ({ market, delta: null }))
}

/**
 * Internal: aggregate markets matching `predicate` into category buckets,
 * sort by total volume descending, and cap at `n`.
 *
 * Used by both `selectHotTopics` (active-only, for the "HOT TOPICS" widget)
 * and `selectRecentlyResolvedTopics` (resolved-only, for the fallback
 * "RECENTLY RESOLVED" widget that surfaces in end-of-cycle states).
 */
function aggregateByCategory(
  markets: PredictionMarket[],
  predicate: (m: PredictionMarket) => boolean,
  n: number,
): HotTopicEntry[] {
  const buckets = new Map<MarketCategory, { total: number; count: number }>()
  for (const m of markets) {
    if (!predicate(m)) continue
    const prev = buckets.get(m.category) ?? { total: 0, count: 0 }
    buckets.set(m.category, {
      total: prev.total + (Number.isFinite(m.volume) ? m.volume : 0),
      count: prev.count + 1,
    })
  }

  const entries: HotTopicEntry[] = []
  for (const [category, { total, count }] of buckets.entries()) {
    if (count > 0) entries.push({ category, total, count })
  }
  entries.sort((a, b) => b.total - a.total)
  return entries.slice(0, Math.max(0, n))
}

/**
 * Pick up to `n` categories to display in the "Hot Topics" widget.
 *
 * Algorithm:
 *
 *   1. Filter markets by `getMarketStatus(endDate) !== 'expired'` so the
 *      per-category count matches what the user gets when they click into
 *      that category on the main grid.
 *   2. Reduce remaining markets into a `Map<MarketCategory, { total, count }>`.
 *   3. Drop categories whose `count === 0`.
 *   4. Sort by `total` descending.
 *   5. Cap at `n`.
 *
 * The active-only filter is the fix for task 0015: previously this aggregated
 * across the full dataset (active + resolved), so resolved-only categories
 * tinted the widget as if they were hot active markets. Clicking such a row
 * landed the user on `No active markets match your filter`. The page-level
 * `PredictDiscoverySidebar` now falls back to a `selectRecentlyResolvedTopics`
 * widget when this returns an empty array.
 *
 * @param markets Source list (typically the full `allMarkets` from the page).
 * @param n Maximum number of category rows. Default 4.
 */
export function selectHotTopics(markets: PredictionMarket[], n = 4): HotTopicEntry[] {
  return aggregateByCategory(
    markets,
    m => getMarketStatus(m.endDate) !== 'expired',
    n,
  )
}

/**
 * Pick up to `n` categories to display in the fallback "Recently Resolved"
 * widget — used when `selectHotTopics` returns an empty array (every market
 * has resolved, no active markets to bet on).
 *
 * Same aggregation rules as `selectHotTopics` but filtered on
 * `getMarketStatus(endDate) === 'expired'`.
 */
export function selectRecentlyResolvedTopics(
  markets: PredictionMarket[],
  n = 4,
): HotTopicEntry[] {
  return aggregateByCategory(
    markets,
    m => getMarketStatus(m.endDate) === 'expired',
    n,
  )
}
