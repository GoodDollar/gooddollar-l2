/**
 * Task 0024: Equity StockStatsBar MUST NOT render perp-only fields
 * (Funding, OI) and MUST em-dash zero-sentinel data instead of
 * pretending `$0` / `+0.00%` are real prints.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StockStatsBar } from '@/components/stocks/StockStatsBar'
import type { Stock } from '@/lib/stockData'

const baseStock: Stock = {
  ticker: 'AAPL',
  name: 'sAAPL',
  displayName: 'Apple Inc.',
  sector: 'Technology',
  description: 'Apple Inc.',
  price: 193,
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  high52w: 193 * 1.15,
  low52w: 193 * 0.75,
  sparkline7d: null,
  peRatio: 0,
  eps: 0,
  dividendYield: 0,
  avgVolume: 0,
}

describe('StockStatsBar — equity-only fields (task 0024)', () => {
  it('does not render perp-only Funding and OI columns', () => {
    render(<StockStatsBar stock={baseStock} />)
    const bar = screen.getByTestId('stock-stats-bar')
    expect(bar.textContent).not.toMatch(/Funding/i)
    expect(bar.textContent).not.toMatch(/\bOI\b/)
  })

  it('em-dashes Vol when volume24h is the no-data sentinel (zero)', () => {
    render(<StockStatsBar stock={baseStock} />)
    const bar = screen.getByTestId('stock-stats-bar')
    expect(bar.textContent).not.toMatch(/Vol[^—]+\$0/)
    expect(bar.textContent).toMatch(/Vol\s*—/)
  })

  it('em-dashes the 24h change tile when change24h is the no-data sentinel (zero)', () => {
    render(<StockStatsBar stock={baseStock} />)
    const bar = screen.getByTestId('stock-stats-bar')
    expect(bar.textContent).not.toMatch(/\+0\.00%/)
    expect(bar.textContent).not.toMatch(/▲\s*\+0/)
    expect(bar.textContent).toMatch(/24h\s*—/)
  })

  it('renders live values when real numbers are present', () => {
    const liveStock: Stock = {
      ...baseStock,
      change24h: 1.3,
      volume24h: 62_000_000,
    }
    render(<StockStatsBar stock={liveStock} />)
    const bar = screen.getByTestId('stock-stats-bar')
    expect(bar.textContent).toMatch(/▲ \+1\.30%/)
    expect(bar.textContent).toMatch(/\$62\.00M/)
  })
})
