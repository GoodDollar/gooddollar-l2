export interface AnalystOutlook {
  consensus: 'Bullish' | 'Neutral' | 'Bearish'
  targetLow: number
  targetMean: number
  targetHigh: number
  /** ISO timestamp for the underlying snapshot — formatted on render. */
  asOf: string
  analystCount: number
  ratingDistribution: {
    buy: number
    hold: number
    sell: number
  }
  revisionTrend: 'Up' | 'Flat' | 'Down'
  /**
   * Discriminator. Only `'street'` is treated as a real Street consensus
   * by `AnalystOutlookCard`; anything else (incl. `'sample'` or
   * undefined) collapses to a `Source: feed pending` empty state.
   * Task 0029.
   */
  source?: 'street' | 'sample'
  /** Optional ms timestamp of the underlying feed read. */
  updatedAtMs?: number
}

export interface StockNewsItem {
  id: string
  ticker: string
  headline: string
  source: string
  publishedAt: string
  tag: 'Earnings' | 'Guidance' | 'Macro' | 'Product'
  url: string
}

/**
 * Returns the latest analyst consensus for a ticker, or `null` when no
 * real adapter is wired. Task 0029 removed the hardcoded
 * `ANALYST_OUTLOOK_BY_TICKER` table — the ticker page now surfaces a
 * `Source: feed pending` empty state via `AnalystOutlookCard` until a
 * real Street-consensus adapter is added. Future implementations should
 * return `{ ..., source: 'street', updatedAtMs }`; only the `'street'`
 * discriminant unlocks the full rendering path.
 */
export function getAnalystOutlook(_ticker: string): AnalystOutlook | null {
  return null
}

export function calcUpsidePercent(currentPrice: number, targetMean: number): number {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return 0
  return ((targetMean - currentPrice) / currentPrice) * 100
}

/**
 * Returns the latest news catalysts for a ticker, or `[]` when no real
 * adapter is wired. Task 0030 removed the hardcoded `NEWS_BY_TICKER`
 * table — the per-ticker page now shows a `Source: feed pending` empty
 * state via `NewsEventsPanel` until a real news adapter is added.
 */
export function getStockNews(_ticker: string): StockNewsItem[] {
  return []
}

