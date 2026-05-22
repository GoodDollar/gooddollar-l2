/**
 * Deterministic sentiment generation from ticker string.
 * Uses a simple string hash to produce consistent bullish/bearish %
 * per ticker without any real backend.
 */

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export interface SentimentData {
  bullish: number
  bearish: number
  voters: number
}

export function generateSentiment(ticker: string): SentimentData {
  const hash = hashString(ticker.toUpperCase())
  const bullish = (hash % 40) + 45
  const bearish = 100 - bullish
  const voters = ((hash >> 4) % 800) + 200
  return { bullish, bearish, voters }
}
