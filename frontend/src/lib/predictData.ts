/**
 * predictData.ts — Types, utility functions, and category definitions for
 * prediction markets.
 *
 * Mock data has been REMOVED (GOO-215). All market/position data now comes
 * from on-chain reads via useOnChainPredict.ts and useMarkets.ts.
 *
 * This module retains:
 *   - Type exports (PredictionMarket, UserPosition, etc.)
 *   - Pure utility functions (filtering, sorting, formatting)
 *   - Category constants
 */

export type MarketCategory = 'Crypto' | 'Politics' | 'Sports' | 'AI & Tech' | 'World Events' | 'Culture'

export interface PredictionMarket {
  id: string
  question: string
  category: MarketCategory
  yesPrice: number
  volume: number
  liquidity: number
  endDate: string
  resolved: boolean
  outcome?: 'yes' | 'no'
  resolutionSource: string
  createdAt: string
  totalShares: number
}

export const ALL_CATEGORIES: MarketCategory[] = ['Crypto', 'Politics', 'Sports', 'AI & Tech', 'World Events', 'Culture']

export type SortOption = 'trending' | 'newest' | 'volume' | 'ending'

export function filterAndSortMarkets(
  markets: PredictionMarket[],
  category: MarketCategory | 'All',
  sort: SortOption,
  query: string,
): PredictionMarket[] {
  let result = [...markets]

  if (category !== 'All') {
    result = result.filter(m => m.category === category)
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase()
    result = result.filter(m => m.question.toLowerCase().includes(q))
  }

  const expiredLast = (a: PredictionMarket, b: PredictionMarket) => {
    const aExpired = getMarketStatus(a.endDate) === 'expired'
    const bExpired = getMarketStatus(b.endDate) === 'expired'
    if (aExpired && !bExpired) return 1
    if (!aExpired && bExpired) return -1
    return 0
  }

  switch (sort) {
    case 'trending':
      result.sort((a, b) => expiredLast(a, b) || b.volume - a.volume)
      break
    case 'newest':
      result.sort((a, b) => expiredLast(a, b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'volume':
      result.sort((a, b) => expiredLast(a, b) || b.volume - a.volume)
      break
    case 'ending':
      result.sort((a, b) => expiredLast(a, b) || new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      break
  }

  return result
}

export type MarketStatus = 'active' | 'ending-today' | 'expired'

export function getMarketStatus(endDate: string): MarketStatus {
  const end = new Date(endDate)
  const now = new Date()
  const msLeft = end.getTime() - now.getTime()
  if (msLeft < 0) return 'expired'
  if (msLeft < 24 * 60 * 60 * 1000) return 'ending-today'
  return 'active'
}

/**
 * Select the "featured" prediction market for the /predict hero card.
 *
 * Rules (task 0074):
 *  1. Only consider active (non-expired) markets.
 *  2. If any active market has positive volume, pick the highest-volume one
 *     (so we never feature a brand-new seed market over a real one).
 *  3. If every active market has zero volume, fall back to the most
 *     "balanced" market — the one whose `yesPrice` is closest to 0.5. This
 *     avoids parading a 0% or 100% degenerate market as the hero.
 *  4. Returns `null` when there are no active markets.
 *
 * On a tie the first market in input order wins (reduce semantics), keeping
 * selection stable across renders. Lifted out of `<FeaturedMarket />`
 * (task 0044) so the parent page can dedup the chosen market from the
 * active-markets grid below the hero.
 */
export function selectFeaturedMarket(markets: PredictionMarket[]): PredictionMarket | null {
  const active = markets.filter(m => getMarketStatus(m.endDate) !== 'expired')
  if (active.length === 0) return null

  const withVolume = active.filter(m => m.volume > 0)
  if (withVolume.length > 0) {
    return withVolume.reduce((top, m) => (m.volume > top.volume ? m : top), withVolume[0])
  }

  // Cold-start fallback: prefer the market whose probability is closest to
  // 0.5 (i.e. the most genuinely uncertain). 0 and 1 lose against any
  // non-degenerate price.
  return active.reduce((top, m) => {
    const topDist = Math.abs(top.yesPrice - 0.5)
    const mDist = Math.abs(m.yesPrice - 0.5)
    return mDist < topDist ? m : top
  }, active[0])
}

/**
 * Whether the market has any signal worth charting (task 0074).
 *
 * A market is "degenerate" when its price is exactly 0 or 1 — these are
 * either uninitialized seeds (no trades, no liquidity) or already-decided
 * markets, and rendering a wiggly synthetic sparkline next to them is
 * actively misleading.
 */
export function hasMeaningfulPrice(market: Pick<PredictionMarket, 'yesPrice' | 'volume'>): boolean {
  if (market.yesPrice <= 0 || market.yesPrice >= 1) return false
  return market.volume > 0
}

export function getDaysLeftLabel(endDate: string): string {
  const status = getMarketStatus(endDate)
  if (status === 'expired') return 'Expired'
  if (status === 'ending-today') return 'Ending today'
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return `${days}d left`
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Generate a deterministic probability-history sparkline for a market.
 *
 * Returns `null` (task 0074) when:
 *   - `currentPrice` is degenerate (≤ 0 or ≥ 1), or
 *   - the caller explicitly passes `hasVolume = false`, signalling that the
 *     market has had no real on-chain activity yet.
 *
 * Returning `null` lets callers render a "no trades yet" placeholder instead
 * of a fabricated wiggly line that misrepresents history.
 */
export function generateProbabilityHistory(
  marketId: string,
  currentPrice: number,
  points = 30,
  hasVolume = true,
): number[] | null {
  if (!hasVolume) return null
  if (currentPrice <= 0 || currentPrice >= 1) return null

  const rng = seededRandom(hashString(marketId))
  const startPrice = Math.max(0.02, Math.min(0.98, currentPrice + (rng() - 0.5) * 0.4))
  const result: number[] = []
  let price = startPrice
  const step = (currentPrice - startPrice) / points

  for (let i = 0; i < points; i++) {
    result.push(Math.max(0.01, Math.min(0.99, price)))
    price += step + (rng() - 0.5) * 0.06
  }
  result.push(currentPrice)
  return result
}

export function formatVolume(vol: number): string {
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export interface UserPosition {
  marketId: string
  side: 'yes' | 'no'
  shares: number
  avgPrice: number
  currentPrice: number
}

export interface ResolvedPosition {
  marketId: string
  side: 'yes' | 'no'
  shares: number
  avgPrice: number
  outcome: 'yes' | 'no'
  payout: number
}
