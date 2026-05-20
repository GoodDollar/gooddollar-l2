import { describe, it, expect } from 'vitest'
import { getRelatedSymbols, getTopMovers } from '@/lib/stockDiscovery'
import type { Stock } from '@/lib/stockData'

const mk = (ticker: string, sector: string, marketCap: number, change24h: number): Stock => ({
  ticker,
  name: `s${ticker}`,
  sector,
  description: `${ticker} description`,
  price: 100,
  change24h,
  volume24h: 1_000_000,
  marketCap,
  high52w: 120,
  low52w: 80,
  sparkline7d: [1, 2, 3],
  peRatio: 20,
  eps: 1,
  dividendYield: 0,
  avgVolume: 1_000_000,
})

describe('stockDiscovery', () => {
  const universe = [
    mk('AAPL', 'Technology', 3_000_000_000_000, 1.1),
    mk('MSFT', 'Technology', 2_900_000_000_000, 0.8),
    mk('NVDA', 'Technology', 2_500_000_000_000, 3.7),
    mk('AMZN', 'Consumer', 1_900_000_000_000, -1.9),
    mk('JPM', 'Finance', 500_000_000_000, 0.2),
  ]

  it('prioritizes same-sector symbols for related suggestions', () => {
    const related = getRelatedSymbols(universe, 'AAPL', 3)
    expect(related.map((s) => s.ticker)).toEqual(['MSFT', 'NVDA', 'AMZN'])
  })

  it('returns top movers by absolute 24h move', () => {
    const movers = getTopMovers(universe, 3)
    expect(movers.map((s) => s.ticker)).toEqual(['NVDA', 'AMZN', 'AAPL'])
  })
})
