import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StockStatsBar } from '@/components/stocks/StockStatsBar'
import type { Stock } from '@/lib/stockData'

function baseStock(overrides: Partial<Stock> = {}): Stock {
  return {
    ticker: 'AAPL',
    name: 'sAAPL',
    displayName: 'Apple Inc.',
    sector: 'Technology',
    description: '',
    price: 194,
    change24h: 0,
    volume24h: 0,
    marketCap: 0,
    high52w: 0,
    low52w: 0,
    sparkline7d: null,
    peRatio: 0,
    eps: 0,
    dividendYield: 0,
    avgVolume: 0,
    ...overrides,
  }
}

describe('StockStatsBar — no-data branching', () => {
  it('renders em-dashes for 24h %/H/L/Vol when change24h=0 and volume24h=0', () => {
    render(<StockStatsBar stock={baseStock({ change24h: 0, volume24h: 0 })} />)

    // Funding + OI always render '—' (2). Plus 24h %, 24h H, 24h L, Vol = 6 total.
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(6)

    // 24h % no longer leaks a fabricated 0.00% on the no-data branch.
    expect(screen.queryByText('0.00%')).not.toBeInTheDocument()
    expect(screen.queryByText(/▲|▼/)).not.toBeInTheDocument()
  })

  it('renders real high/low for a real flat day (change24h=0, volume24h>0)', () => {
    render(<StockStatsBar stock={baseStock({ change24h: 0, volume24h: 1_500_000, price: 194 })} />)

    // Only Funding and OI remain as '—'.
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(2)

    // Vol formatted with K/M/B suffix.
    expect(screen.getByText(/\$1\.5M/)).toBeInTheDocument()
  })

  it('renders normally when change24h !== 0', () => {
    render(
      <StockStatsBar
        stock={baseStock({ change24h: 1.23, volume24h: 1_000_000, price: 194 })}
      />,
    )
    expect(screen.getByText(/▲ \+1\.23%/)).toBeInTheDocument()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(2)
  })
})
