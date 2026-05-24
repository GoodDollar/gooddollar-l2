export interface AnalystOutlook {
  consensus: 'Bullish' | 'Neutral' | 'Bearish'
  targetLow: number
  targetMean: number
  targetHigh: number
  asOf: string
  analystCount: number
  ratingDistribution: {
    buy: number
    hold: number
    sell: number
  }
  revisionTrend: 'Up' | 'Flat' | 'Down'
  source: string
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
 * Analyst consensus feed — currently unwired.
 *
 * Task 0036 deleted a hand-written analyst-consensus map of 8
 * fabricated entries that the card labelled as live street data. The
 * card rendered green Bullish pills + Target Mean dollars + green
 * upside % directly above a synthetic stock price, with no demo badge
 * — a trust failure of the same shape as tasks 0032/0033/0034.
 *
 * The `AnalystOutlook` type stays exported so an eventual real
 * consensus feed drops in without breaking call sites;
 * `getAnalystOutlook` returns `null` for every ticker until then.
 */
export function getAnalystOutlook(_ticker: string): AnalystOutlook | null {
  return null
}

/**
 * News feed — currently unwired.
 *
 * Task 0034 deleted a hand-written `NEWS_BY_TICKER` map of 12 × 3
 * fabricated headlines (every URL pointed at a placeholder host, every
 * byline was invented). Headlines rendered next to a synthetic-stock
 * price with no demo badge read as a live news feed, which is the
 * exact trust failure this lane exists to prevent.
 *
 * The `StockNewsItem` type stays exported so the eventual real feed
 * can drop in without breaking call sites; `getStockNews` returns
 * `[]` for every ticker until then.
 */
export function getStockNews(_ticker: string): StockNewsItem[] {
  return []
}
