import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalysisGrid } from '@/components/stocks/AnalysisGrid'
import type { Stock } from '@/lib/stockData'

const liveStock: Stock = {
  ticker: 'AAPL',
  name: 'Apple',
  displayName: 'Apple Inc.',
  sector: 'Technology',
  description: '',
  price: 200,
  change24h: 1.23,
  volume24h: 50_000_000,
  marketCap: 3_000_000_000_000,
  high52w: 220,
  low52w: 150,
  sparkline7d: [],
  peRatio: 28.5,
  eps: 6.12,
  dividendYield: 0.46,
  avgVolume: 87_654_321,
}

const zeroStock: Stock = {
  ...liveStock,
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  peRatio: 0,
  eps: 0,
  dividendYield: 0,
  avgVolume: 0,
}

describe('AnalysisGrid', () => {
  it('renders coloured live values when fundamentals are present', () => {
    render(<AnalysisGrid stock={liveStock} />)
    expect(screen.getByText('P/E 28.5x')).toBeInTheDocument()
    const eps = screen.getByText('EPS $6.12')
    expect(eps.className).toContain('text-green-400')
    expect(screen.getByText('0.46% yield')).toBeInTheDocument()
    expect(screen.getByText(/avg vol/)).toBeInTheDocument()
  })

  it('renders muted em-dashes for every tile when fundamentals are degraded', () => {
    render(<AnalysisGrid stock={zeroStock} />)

    const grid = screen.getByTestId('analysis-grid')
    expect(grid.querySelector('.text-green-400')).toBeNull()
    expect(grid.querySelector('.text-red-400')).toBeNull()

    expect(screen.queryByText(/0\.0x/)).toBeNull()
    expect(screen.queryByText(/0\.00%/)).toBeNull()
    expect(screen.queryByText('No dividend')).toBeNull()
    expect(screen.queryByText('$0.00')).toBeNull()

    expect(screen.getByText(/P\/E —/)).toBeInTheDocument()
    expect(screen.getByText(/EPS —/)).toBeInTheDocument()
    expect(screen.getByText(/Yield —/)).toBeInTheDocument()
    expect(screen.getByText(/Avg vol —/)).toBeInTheDocument()
  })

  it('shows "No dividend" only when fundamentals are live and yield is zero', () => {
    render(<AnalysisGrid stock={{ ...liveStock, dividendYield: 0 }} />)
    expect(screen.getByText('No dividend')).toBeInTheDocument()
  })

  it('paints negative EPS red when fundamentals are live', () => {
    render(<AnalysisGrid stock={{ ...liveStock, eps: -1.5 }} />)
    const eps = screen.getByText('EPS $-1.50')
    expect(eps.className).toContain('text-red-400')
  })
})
