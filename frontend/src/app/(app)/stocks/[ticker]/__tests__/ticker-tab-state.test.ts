import { describe, expect, it } from 'vitest'
import { buildFundamentalsRows, parseTickerTab } from '../tickerTabState'
import type { Stock } from '@/lib/stockData'

const LIVE_STOCK: Stock = {
  ticker: 'AAPL',
  name: 'Apple',
  displayName: 'Apple Inc.',
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
}

const DEGRADED_STOCK: Stock = {
  ...LIVE_STOCK,
  ticker: 'AAPL',
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  high52w: 0,
  low52w: 0,
  peRatio: 0,
  eps: 0,
  dividendYield: 0,
  avgVolume: 0,
}

describe('ticker tab state', () => {
  it('parses known tab values and falls back to overview', () => {
    expect(parseTickerTab('overview')).toBe('overview')
    expect(parseTickerTab('fundamentals')).toBe('fundamentals')
    expect(parseTickerTab('events')).toBe('events')
    expect(parseTickerTab('unknown')).toBe('overview')
    expect(parseTickerTab(undefined)).toBe('overview')
  })

  describe('buildFundamentalsRows with live fundamentals', () => {
    it('renders six rows with real values from the stock fields', () => {
      const rows = buildFundamentalsRows(LIVE_STOCK, true)
      expect(rows).toHaveLength(6)
      expect(rows[0]?.label).toBe('Revenue (TTM)')
      expect(rows[1]?.label).toBe('EPS (TTM)')
      expect(rows[1]?.value).toBe('$7.20')
      expect(rows[2]?.label).toBe('P/E')
      expect(rows[2]?.value).toBe('28.0x')
      expect(rows[5]?.label).toBe('Dividend Yield')
      expect(rows[5]?.value).toBe('0.55%')
    })

    it('does not derive deltas from change24h * arbitrary multipliers', () => {
      const rows = buildFundamentalsRows({ ...LIVE_STOCK, change24h: 0 }, true)
      for (const row of rows) {
        expect(row.delta).not.toMatch(/\+0\.0\s*%\s*YoY/i)
        expect(row.delta).not.toMatch(/\+0\.0\s*pts/i)
      }
    })
  })

  describe('buildFundamentalsRows with degraded oracle (live=false)', () => {
    it('returns six rows whose numeric values collapse to em-dash', () => {
      const rows = buildFundamentalsRows(DEGRADED_STOCK, false)
      expect(rows).toHaveLength(6)
      for (let i = 0; i < 5; i += 1) {
        expect(rows[i]?.value).toBe('—')
        expect(rows[i]?.positive).toBeNull()
      }
    })

    it('does not leak the 42% gross margin or 18% FCF baselines', () => {
      const rows = buildFundamentalsRows(DEGRADED_STOCK, false)
      for (const row of rows) {
        expect(row.value).not.toMatch(/42/)
        expect(row.value).not.toMatch(/18/)
        expect(row.delta).not.toMatch(/YoY/i)
        expect(row.delta).not.toMatch(/pts/i)
      }
    })

    it('preserves the Dividend Yield empty-state signal', () => {
      const rows = buildFundamentalsRows(DEGRADED_STOCK, false)
      const dividend = rows[5]
      expect(dividend?.label).toBe('Dividend Yield')
      expect(dividend?.value).toBe('—')
      expect(dividend?.delta).toBe('No cash dividend')
    })
  })
})
