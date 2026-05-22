import { describe, it, expect } from 'vitest'
import { getDailyMovers, getTrendingStocks, getMarketAnalysisPicks } from '@/lib/stockDiscovery'
import type { Stock } from '@/lib/stockData'

const mk = (
  ticker: string,
  change24h: number,
  volume24h: number,
  marketCap: number,
): Stock => ({
  ticker,
  name: `s${ticker}`,
  sector: 'Technology',
  description: `${ticker} description`,
  price: 100,
  change24h,
  volume24h,
  marketCap,
  high52w: 120,
  low52w: 80,
  sparkline7d: [1, 2, 3],
  peRatio: 20,
  eps: 1,
  dividendYield: 0,
  avgVolume: 1_000_000,
})

describe('consolidated discovery shelf derivations', () => {
  const stocks = [
    mk('AAPL', 3.1, 10_000, 3e12),
    mk('TSLA', -5.2, 20_000, 800e9),
    mk('NVDA', 1.0, 30_000, 2.5e12),
    mk('MSFT', 0.5, 5_000, 2.9e12),
    mk('META', -0.3, 15_000, 1.2e12),
  ]

  it('produces identical results when called together vs individually', () => {
    const movers = getDailyMovers(stocks, 5)
    const trending = getTrendingStocks(stocks, 5)
    const analysis = getMarketAnalysisPicks(stocks, 5)

    const consolidated = {
      movers: getDailyMovers(stocks, 5),
      trending: getTrendingStocks(stocks, 5),
      analysis: getMarketAnalysisPicks(stocks, 5),
    }

    expect(consolidated.movers).toEqual(movers)
    expect(consolidated.trending).toEqual(trending)
    expect(consolidated.analysis).toEqual(analysis)
  })

  it('getDailyMovers returns stocks sorted by absolute change', () => {
    const movers = getDailyMovers(stocks, 3)
    expect(movers.map((s) => s.ticker)).toEqual(['TSLA', 'AAPL', 'NVDA'])
  })

  it('getTrendingStocks returns stocks sorted by weighted volume+cap', () => {
    const trending = getTrendingStocks(stocks, 3)
    expect(trending).toHaveLength(3)
    const tickers = trending.map((s) => s.ticker)
    expect(tickers).toContain('AAPL')
  })
})
