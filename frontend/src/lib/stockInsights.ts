export interface AnalystOutlook {
  consensus: 'Bullish' | 'Neutral' | 'Bearish'
  targetLow: number
  targetMean: number
  targetHigh: number
  asOf: string
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

const ANALYST_OUTLOOK_BY_TICKER: Record<string, AnalystOutlook> = {
  AAPL: { consensus: 'Bullish', targetLow: 196, targetMean: 224, targetHigh: 248, asOf: 'May 2026' },
  MSFT: { consensus: 'Bullish', targetLow: 418, targetMean: 451, targetHigh: 486, asOf: 'May 2026' },
  NVDA: { consensus: 'Bullish', targetLow: 98, targetMean: 117, targetHigh: 138, asOf: 'May 2026' },
  AMZN: { consensus: 'Bullish', targetLow: 176, targetMean: 204, targetHigh: 226, asOf: 'May 2026' },
  GOOGL: { consensus: 'Bullish', targetLow: 154, targetMean: 176, targetHigh: 198, asOf: 'May 2026' },
  META: { consensus: 'Neutral', targetLow: 545, targetMean: 588, targetHigh: 633, asOf: 'May 2026' },
  TSLA: { consensus: 'Neutral', targetLow: 231, targetMean: 278, targetHigh: 338, asOf: 'May 2026' },
  AMD: { consensus: 'Neutral', targetLow: 92, targetMean: 110, targetHigh: 136, asOf: 'May 2026' },
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
