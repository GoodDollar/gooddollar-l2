import { describe, it, expect } from 'vitest'
import type { Stock } from '@/lib/stockData'
import { getDailyMovers, getMarketAnalysisPicks, getTrendingStocks } from '@/lib/stockDiscovery'

const stock = (ticker: string, change24h: number, volume24h: number, marketCap: number): Stock => ({
  ticker,
  name: `s${ticker}`,
  sector: 'Technology',
  description: '',
  price: 100,
  change24h,
  volume24h,
  marketCap,
  high52w: 120,
  low52w: 80,
  sparkline7d: [95, 98, 100],
  peRatio: 20,
  eps: 3,
  dividendYield: 0,
  avgVolume: 10,
})

describe('stockDiscovery helpers', () => {
  const stocks: Stock[] = [
    stock('AAPL', 4.2, 12, 300),
    stock('TSLA', -5.8, 15, 180),
    stock('NVDA', 2.1, 30, 420),
    stock('MSFT', 0.3, 20, 390),
    stock('AMD', -1.8, 28, 120),
  ]

  it('returns movers ordered by magnitude', () => {
    const movers = getDailyMovers(stocks, 3)
    expect(movers.map((s) => s.ticker)).toEqual(['TSLA', 'AAPL', 'NVDA'])
  })

  it('returns trending by volume + market cap weight', () => {
    const trending = getTrendingStocks(stocks, 2)
    expect(trending.length).toBe(2)
    expect(trending[0]?.ticker).toBe('NVDA')
  })

  it('returns market analysis picks with bounded length', () => {
    const picks = getMarketAnalysisPicks(stocks, 2)
    expect(picks.length).toBeLessThanOrEqual(2)
  })
})
