export interface AnalystOutlook {
  consensus: 'Bullish' | 'Neutral' | 'Bearish'
  targetLow: number
  targetMean: number
  targetHigh: number
  asOf: string
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
