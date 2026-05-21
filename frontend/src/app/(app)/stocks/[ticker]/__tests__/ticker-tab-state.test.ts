import { describe, expect, it } from 'vitest'
import { buildFundamentalsRows, parseTickerTab } from '../tickerTabState'

describe('ticker tab state', () => {
  it('parses known tab values and falls back to overview', () => {
    expect(parseTickerTab('overview')).toBe('overview')
    expect(parseTickerTab('fundamentals')).toBe('fundamentals')
    expect(parseTickerTab('events')).toBe('events')
    expect(parseTickerTab('unknown')).toBe('overview')
    expect(parseTickerTab(undefined)).toBe('overview')
  })

  it('builds six fundamentals rows with formatted deltas', () => {
    const rows = buildFundamentalsRows({
      ticker: 'AAPL',
      name: 'Apple',
      sector: 'Technology',
      description: 'Apple',
      price: 210,
      change24h: 1.5,
      volume24h: 12_000_000,
      marketCap: 3_200_000_000_000,
      high52w: 240,
      low52w: 150,
      sparkline7d: [205, 207, 209, 210],
      peRatio: 28,
      eps: 7.2,
      dividendYield: 0.55,
      avgVolume: 14_000_000,
    })

    expect(rows).toHaveLength(6)
    expect(rows[0]?.label).toBe('Revenue (TTM)')
    expect(rows[0]?.delta).toMatch(/YoY/)
    expect(rows[1]?.label).toBe('EPS (TTM)')
    expect(rows[5]?.label).toBe('Dividend Yield')
  })
})
