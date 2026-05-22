import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MarketIntelligencePanel } from '@/components/stocks/MarketIntelligencePanel'
import type { Stock } from '@/lib/stockData'

const stocks: Stock[] = [
  {
    ticker: 'AAPL',
    name: 'Apple',
    sector: 'Technology',
    description: 'Apple',
    price: 210.12,
    change24h: 1.8,
    volume24h: 40_000_000,
    marketCap: 3_100_000_000_000,
    high52w: 240,
    low52w: 160,
    sparkline7d: [200, 205, 207, 210],
    peRatio: 28,
    eps: 7.2,
    dividendYield: 0.5,
    avgVolume: 41_000_000,
  },
  {
    ticker: 'TSLA',
    name: 'Tesla',
    sector: 'Automotive',
    description: 'Tesla',
    price: 178.44,
    change24h: -2.6,
    volume24h: 92_000_000,
    marketCap: 780_000_000_000,
    high52w: 280,
    low52w: 145,
    sparkline7d: [200, 195, 190, 178],
    peRatio: 40,
    eps: 3.4,
    dividendYield: 0,
    avgVolume: 82_000_000,
  },
  {
    ticker: 'META',
    name: 'Meta',
    sector: 'Technology',
    description: 'Meta',
    price: 512.01,
    change24h: 0.6,
    volume24h: 28_000_000,
    marketCap: 1_290_000_000_000,
    high52w: 560,
    low52w: 350,
    sparkline7d: [495, 500, 505, 512],
    peRatio: 26,
    eps: 12.4,
    dividendYield: 0.3,
    avgVolume: 24_000_000,
  },
]

describe('MarketIntelligencePanel', () => {
  it('renders core modules and demo badge when oracle is offline', () => {
    render(
      <MarketIntelligencePanel stocks={stocks} isLive={false} isLoading={false} onSelectTicker={vi.fn()} />
    )
    expect(screen.getByRole('heading', { name: /Market Intelligence/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Top Movers/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Upcoming Earnings/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /News Flow/i })).toBeInTheDocument()
    expect(screen.getByText(/Demo intelligence data/i)).toBeInTheDocument()
  })

  it('switches movers mode and routes ticker clicks', () => {
    const onSelectTicker = vi.fn()
    render(
      <MarketIntelligencePanel stocks={stocks} isLive isLoading={false} onSelectTicker={onSelectTicker} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Losers' }))
    fireEvent.click(screen.getByRole('button', { name: /TSLA-2.60%/i }))
    expect(onSelectTicker).toHaveBeenCalledWith('TSLA')
  })

  it('keeps losers list strictly negative and gainers strictly non-negative', () => {
    render(
      <MarketIntelligencePanel stocks={stocks} isLive isLoading={false} onSelectTicker={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Losers' }))
    expect(screen.getByRole('button', { name: /TSLA-2.60%/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /AAPL\+1.80%/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /META\+0.60%/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Gainers' }))
    expect(screen.getByRole('button', { name: /AAPL\+1.80%/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /META\+0.60%/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /TSLA-2.60%/i })).not.toBeInTheDocument()
  })

  it('renders explicit empty states when no data is available', () => {
    render(
      <MarketIntelligencePanel stocks={[]} isLive isLoading={false} onSelectTicker={vi.fn()} />
    )
    expect(screen.getByText(/No movers available/i)).toBeInTheDocument()
    expect(screen.getByText(/No earnings events available/i)).toBeInTheDocument()
    expect(screen.getByText(/No headlines available/i)).toBeInTheDocument()
  })

  it('renders skeleton shimmer bars instead of plain text when loading', () => {
    const { container } = render(
      <MarketIntelligencePanel stocks={[]} isLive isLoading={true} onSelectTicker={vi.fn()} />
    )
    expect(screen.queryByText(/Loading movers/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Loading earnings/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Loading headlines/i)).not.toBeInTheDocument()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(9)
  })
})
