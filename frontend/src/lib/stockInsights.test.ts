import { describe, it, expect } from 'vitest'
import { getAnalystOutlook, type AnalystOutlook } from './stockInsights'

const TICKERS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD']

function totalRatings(outlook: AnalystOutlook): number {
  const { ratings } = outlook
  return (
    ratings.strongBuy +
    ratings.buy +
    ratings.hold +
    ratings.sell +
    ratings.strongSell
  )
}

describe('AnalystOutlook — rating distribution', () => {
  it.each(TICKERS)('%s has a ratings distribution that sums to analystCount', ticker => {
    const outlook = getAnalystOutlook(ticker)
    expect(outlook).not.toBeNull()
    if (!outlook) return
    expect(outlook.ratings).toBeDefined()
    expect(typeof outlook.analystCount).toBe('number')
    expect(outlook.analystCount).toBeGreaterThan(0)
    expect(totalRatings(outlook)).toBe(outlook.analystCount)
  })

  it.each(TICKERS)('%s ratings are all non-negative integers', ticker => {
    const outlook = getAnalystOutlook(ticker)
    expect(outlook).not.toBeNull()
    if (!outlook) return
    const buckets = [
      outlook.ratings.strongBuy,
      outlook.ratings.buy,
      outlook.ratings.hold,
      outlook.ratings.sell,
      outlook.ratings.strongSell,
    ]
    for (const v of buckets) {
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
    }
  })

  it('Bullish tickers have SB+B strictly greater than S+SS', () => {
    for (const ticker of TICKERS) {
      const outlook = getAnalystOutlook(ticker)
      if (!outlook || outlook.consensus !== 'Bullish') continue
      const positive = outlook.ratings.strongBuy + outlook.ratings.buy
      const negative = outlook.ratings.sell + outlook.ratings.strongSell
      expect(positive, `Bullish ticker ${ticker} must have positive > negative`).toBeGreaterThan(negative)
    }
  })

  it('Neutral tickers have Hold as the (joint-) largest bucket', () => {
    for (const ticker of TICKERS) {
      const outlook = getAnalystOutlook(ticker)
      if (!outlook || outlook.consensus !== 'Neutral') continue
      const { strongBuy, buy, hold, sell, strongSell } = outlook.ratings
      const others = [strongBuy, buy, sell, strongSell]
      for (const v of others) {
        expect(hold, `Neutral ticker ${ticker}: hold (${hold}) should be >= every other bucket (${v})`).toBeGreaterThanOrEqual(v)
      }
    }
  })

  it('Bearish tickers have S+SS strictly greater than SB+B', () => {
    for (const ticker of TICKERS) {
      const outlook = getAnalystOutlook(ticker)
      if (!outlook || outlook.consensus !== 'Bearish') continue
      const positive = outlook.ratings.strongBuy + outlook.ratings.buy
      const negative = outlook.ratings.sell + outlook.ratings.strongSell
      expect(negative, `Bearish ticker ${ticker} must have negative > positive`).toBeGreaterThan(positive)
    }
  })
})
