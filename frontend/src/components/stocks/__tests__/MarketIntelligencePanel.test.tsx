import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
    expect(screen.getByTestId('earnings-empty').textContent).toMatch(/No earnings calendar wired yet/i)
    expect(screen.getByTestId('news-flow-empty').textContent).toMatch(/No cross-ticker news feed yet/i)
  })

  it('never renders the fabricated headline template even when stocks have positive change24h', () => {
    render(
      <MarketIntelligencePanel stocks={stocks} isLive={true} isLoading={false} onSelectTicker={vi.fn()} />
    )
    expect(screen.queryByText(/momentum turns positive/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pulls back after recent run/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Market Wire|Tech Ledger/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Q\d FY\d{4}/)).not.toBeInTheDocument()
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
    expect(screen.getByText(/No earnings calendar wired yet/i)).toBeInTheDocument()
    expect(screen.getByText(/No cross-ticker news feed yet/i)).toBeInTheDocument()
  })

  it('renders the muted "oracle feed degraded" empty state when every stock is a zero sentinel', () => {
    const degradedStocks: Stock[] = stocks.map((s) => ({
      ...s,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
    }))
    const { container } = render(
      <MarketIntelligencePanel
        stocks={degradedStocks}
        isLive={false}
        isLoading={false}
        onSelectTicker={vi.fn()}
      />
    )

    const empty = screen.getByTestId('top-movers-empty')
    expect(empty).toBeInTheDocument()
    expect(empty.textContent).toMatch(/oracle feed degraded/i)

    const topMovers = container.querySelector('article')
    expect(topMovers?.querySelector('.text-green-400')).toBeNull()
    expect(topMovers?.querySelector('.text-red-400')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Losers' }))
    expect(screen.getByTestId('top-movers-empty')).toBeInTheDocument()
  })

  it('shows only the live-change names in Top Movers when fundamentals are mixed', () => {
    const mixed: Stock[] = [
      { ...stocks[0]!, change24h: 2.4, volume24h: 1e9 },
      { ...stocks[1]!, change24h: -1.1, volume24h: 5e8 },
      { ...stocks[2]!, change24h: 0, volume24h: 0, marketCap: 0 },
    ]
    render(
      <MarketIntelligencePanel stocks={mixed} isLive isLoading={false} onSelectTicker={vi.fn()} />
    )

    const topMovers = screen.getByRole('heading', { name: /Top Movers/i }).closest('article')!
    expect(within(topMovers).getByRole('button', { name: /AAPL\+2.40%/i })).toBeInTheDocument()
    expect(within(topMovers).queryByRole('button', { name: /META/i })).not.toBeInTheDocument()

    fireEvent.click(within(topMovers).getByRole('button', { name: 'Losers' }))
    expect(within(topMovers).getByRole('button', { name: /TSLA-1.10%/i })).toBeInTheDocument()
    expect(within(topMovers).queryByRole('button', { name: /META/i })).not.toBeInTheDocument()
  })

  it('renders skeleton shimmer bars in Top Movers when loading', () => {
    const { container } = render(
      <MarketIntelligencePanel stocks={[]} isLive isLoading={true} onSelectTicker={vi.fn()} />
    )
    expect(screen.queryByText(/Loading movers/i)).not.toBeInTheDocument()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })
})
