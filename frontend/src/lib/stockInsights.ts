export interface AnalystRatingDistribution {
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
}

export interface AnalystOutlook {
  consensus: 'Bullish' | 'Neutral' | 'Bearish'
  ratings: AnalystRatingDistribution
  analystCount: number
  targetLow: number
  targetMean: number
  targetHigh: number
  asOf: string
  confidence: 'High' | 'Moderate' | 'Low'
  source: string
  refreshedAt: string
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

// Helper to keep analystCount derivable but stored for convenience in the UI.
function buildOutlook(
  consensus: AnalystOutlook['consensus'],
  ratings: AnalystRatingDistribution,
  prices: { targetLow: number; targetMean: number; targetHigh: number },
  asOf: string,
  provenance: Pick<AnalystOutlook, 'confidence' | 'source' | 'refreshedAt'> = {
    confidence: 'Moderate',
    source: 'Street Consensus',
    refreshedAt: '2026-05-20T12:00:00Z',
  },
): AnalystOutlook {
  const analystCount =
    ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell
  return {
    consensus,
    ratings,
    analystCount,
    ...prices,
    asOf,
    ...provenance,
  }
}

const ANALYST_OUTLOOK_BY_TICKER: Record<string, AnalystOutlook> = {
  AAPL: buildOutlook(
    'Bullish',
    { strongBuy: 18, buy: 12, hold: 6, sell: 2, strongSell: 1 },
    { targetLow: 196, targetMean: 224, targetHigh: 248 },
    'May 2026',
  ),
  MSFT: buildOutlook(
    'Bullish',
    { strongBuy: 22, buy: 14, hold: 5, sell: 2, strongSell: 1 },
    { targetLow: 418, targetMean: 451, targetHigh: 486 },
    'May 2026',
  ),
  NVDA: buildOutlook(
    'Bullish',
    { strongBuy: 28, buy: 13, hold: 4, sell: 1, strongSell: 0 },
    { targetLow: 98, targetMean: 117, targetHigh: 138 },
    'May 2026',
  ),
  AMZN: buildOutlook(
    'Bullish',
    { strongBuy: 19, buy: 13, hold: 7, sell: 2, strongSell: 1 },
    { targetLow: 176, targetMean: 204, targetHigh: 226 },
    'May 2026',
  ),
  GOOGL: buildOutlook(
    'Bullish',
    { strongBuy: 17, buy: 12, hold: 6, sell: 3, strongSell: 1 },
    { targetLow: 154, targetMean: 176, targetHigh: 198 },
    'May 2026',
  ),
  META: buildOutlook(
    'Neutral',
    { strongBuy: 10, buy: 9, hold: 15, sell: 6, strongSell: 2 },
    { targetLow: 545, targetMean: 588, targetHigh: 633 },
    'May 2026',
  ),
  TSLA: buildOutlook(
    'Neutral',
    { strongBuy: 8, buy: 7, hold: 18, sell: 7, strongSell: 5 },
    { targetLow: 231, targetMean: 278, targetHigh: 338 },
    'May 2026',
  ),
  AMD: buildOutlook(
    'Neutral',
    { strongBuy: 10, buy: 11, hold: 14, sell: 4, strongSell: 2 },
    { targetLow: 92, targetMean: 110, targetHigh: 136 },
    'May 2026',
  ),
}

export function getAnalystOutlook(ticker: string): AnalystOutlook | null {
  return ANALYST_OUTLOOK_BY_TICKER[ticker] ?? null
}

export function calcUpsidePercent(currentPrice: number, targetMean: number): number {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return 0
  return ((targetMean - currentPrice) / currentPrice) * 100
}

const NEWS_BY_TICKER: Record<string, StockNewsItem[]> = {
  AAPL: [
    {
      id: 'aapl-earnings-refresh',
      ticker: 'AAPL',
      headline: 'Apple supply-chain update improves near-term iPhone shipment outlook',
      source: 'Market Wire',
      publishedAt: '2026-05-18T15:30:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/aapl-guidance',
    },
    {
      id: 'aapl-ai-suite',
      ticker: 'AAPL',
      headline: 'Apple expands on-device AI suite ahead of developer conference',
      source: 'Tech Ledger',
      publishedAt: '2026-05-17T10:15:00Z',
      tag: 'Product',
      url: 'https://example.com/news/aapl-ai-suite',
    },
  ],
  MSFT: [
    {
      id: 'msft-cloud-demand',
      ticker: 'MSFT',
      headline: 'Azure enterprise demand remains strong in new channel checks',
      source: 'Street Brief',
      publishedAt: '2026-05-19T09:40:00Z',
      tag: 'Guidance',
      url: 'https://example.com/news/msft-azure-demand',
    },
    {
      id: 'msft-earnings-watch',
      ticker: 'MSFT',
      headline: 'Analysts raise earnings expectations for next quarter',
      source: 'Earnings Desk',
      publishedAt: '2026-05-16T20:05:00Z',
      tag: 'Earnings',
      url: 'https://example.com/news/msft-earnings-watch',
    },
  ],
  NVDA: [
    {
      id: 'nvda-dc-capex',
      ticker: 'NVDA',
      headline: 'Hyperscaler capex plans point to sustained accelerator demand',
      source: 'Data Center Journal',
      publishedAt: '2026-05-18T13:05:00Z',
      tag: 'Macro',
      url: 'https://example.com/news/nvda-capex-demand',
    },
  ],
}

export function getStockNews(ticker: string): StockNewsItem[] {
  return NEWS_BY_TICKER[ticker] ?? []
}
