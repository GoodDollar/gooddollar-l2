import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KeyStatistics } from '@/components/stocks/KeyStatistics'
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
  peRatio: 28.4,
  eps: 6.12,
  dividendYield: 0.5,
  avgVolume: 80_000_000,
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

describe('KeyStatistics', () => {
  it('renders live values when oracle has change + fundamentals', () => {
    render(<KeyStatistics stock={liveStock} />)
    expect(screen.getByTestId('key-stats-change-24h')).toHaveTextContent('+1.23%')
    expect(screen.getByText(/Market Cap/i)).toBeInTheDocument()
    expect(screen.getByText('28.4x')).toBeInTheDocument()
    expect(screen.getByText('$6.12')).toBeInTheDocument()
  })

  it('renders em-dashes (not green zeros) when oracle has no change or fundamentals data', () => {
    render(<KeyStatistics stock={zeroStock} />)

    // Headline-style 24h-change inside the grid: must be a dash, not "+0.00%".
    const change = screen.getByTestId('key-stats-change-24h')
    expect(change).toHaveTextContent('—')
    expect(change.textContent).not.toContain('0.00%')
    expect(change.className).toContain('text-gray-500')
    expect(change.className).not.toContain('text-green-400')

    // No fabricated zero-cap / zero-volume / zero-P/E values.
    expect(screen.queryByText(/0\.0x/)).toBeNull()
    expect(screen.queryByText('$0.00')).toBeNull()
  })

  it('renders 52W High / Low as em-dash when fundamentals are degraded', () => {
    render(<KeyStatistics stock={{ ...zeroStock, high52w: 220, low52w: 150 }} />)
    expect(screen.queryByText('$220.00')).toBeNull()
    expect(screen.queryByText('$150.00')).toBeNull()
    expect(screen.queryByText('$0.00')).toBeNull()
  })

  it('renders 52W High / Low as em-dash when fundamentals are live but values are zero sentinels', () => {
    render(<KeyStatistics stock={{ ...liveStock, high52w: 0, low52w: 0 }} />)
    expect(screen.queryByText('$0.00')).toBeNull()
  })

  it('renders 52W High / Low values when fundamentals are live and values are non-zero', () => {
    render(<KeyStatistics stock={{ ...liveStock, high52w: 210.5, low52w: 164.0 }} />)
    expect(screen.getByText('$210.50')).toBeInTheDocument()
    expect(screen.getByText('$164.00')).toBeInTheDocument()
  })
})
