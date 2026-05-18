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

/**
 * Patterns that identify devnet seed markets (task 0051).
 *
 * The keeper scripts in `.autobuilder/tmp/` emit two seed-market question
 * templates plus the occasional bare ISO-8601 timestamp. These markets are
 * useful for chain liveness proofs but degrade the public testnet UX, so
 * the `/predict` page filters them out of both the grid and the featured
 * hero. Patterns are intentionally narrow and anchored so they can't
 * collide with real, user-submitted questions like "proof of stake — ...".
 */
const DEVNET_SEED_PATTERNS: RegExp[] = [
  /^supplemental devnet proof\b/i,
  /^devnet proof market\b/i,
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
]

/**
 * True if the market's `question` is a known devnet-keeper seed string.
 * See `DEVNET_SEED_PATTERNS` for the exact rules.
 */
export function isDevnetSeedMarket(m: { question: string }): boolean {
  const q = m.question.trim()
  if (q.length === 0) return false
  return DEVNET_SEED_PATTERNS.some(re => re.test(q))
}

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
  /**
   * Trailing-24h trade volume in collateral units (task 0049). Sourced from
   * client-side `Bought` event rollup in `use24hVolumeForMarkets.ts`. The
   * unit matches `volume` (already-divided-by-1e18 number). `undefined`
   * means the hook hasn't returned yet on this paint; `0` means we looked
   * and there was genuinely no trade activity in the last 24h. The card
   * differentiates the two — see Polymarket's "—" placeholder convention.
   */
  volume24h?: number
  /**
   * Previous 24h window volume (48h..24h ago). Used purely to compute the
   * up/down arrow direction next to the 24h figure. `null` means we tried
   * to fetch and got nothing back; `undefined` means we haven't tried yet.
   * Both render as a neutral (no-arrow) card to avoid lying about momentum.
   */
  volume24hPrev?: number | null
}

export const ALL_CATEGORIES: MarketCategory[] = ['Crypto', 'Politics', 'Sports', 'AI & Tech', 'World Events', 'Culture']

/**
 * `'volume-24h'` was added in task 0049 to match Polymarket's default sort
 * (recency-weighted activity beats lifetime cumulative volume). When a
 * market has no `volume24h` yet (hook still loading on first paint), it
 * sorts below any market that does have a value, so the grid never
 * spuriously hides established markets behind freshly-opened ones.
 */
export type SortOption = 'trending' | 'newest' | 'volume' | 'volume-24h' | 'ending'

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
    case 'volume-24h':
      // task 0049: markets with no loaded 24h figure sort to the bottom of
      // the active group so the grid doesn't spuriously hide established
      // markets behind newly-opened ones on first paint. Within the loaded
      // set, higher 24h volume wins.
      result.sort((a, b) => {
        const r = expiredLast(a, b)
        if (r !== 0) return r
        const av = a.volume24h
        const bv = b.volume24h
        if (av === undefined && bv === undefined) return 0
        if (av === undefined) return 1
        if (bv === undefined) return -1
        return bv - av
      })
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
