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
  it('renders core modules; News + Earnings always render an honest empty state until a feed is wired', () => {
    render(
      <MarketIntelligencePanel stocks={stocks} isLive={false} isLoading={false} onSelectTicker={vi.fn()} />
    )
    expect(screen.getByRole('heading', { name: /Market Intelligence/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Top Movers/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Upcoming Earnings/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /News Flow/i })).toBeInTheDocument()

    // The panel-level "Demo intelligence data" chip was replaced by per-column
    // source captions on the columns that have no live feed.
    expect(screen.queryByText(/Demo intelligence data/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/Source: feed pending/i).length).toBeGreaterThanOrEqual(2)

    expect(screen.getByTestId('news-flow-empty').textContent).toMatch(/No headlines yet/i)
    expect(screen.getByTestId('earnings-empty').textContent).toMatch(/No earnings calendar yet/i)

    // No fabricated headlines or calendar dates may leak through.
    expect(
      screen.queryByText(/Market Wire|Tech Ledger|momentum turns positive|pulls back after recent run/i),
    ).not.toBeInTheDocument()
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
    expect(screen.getByTestId('earnings-empty').textContent).toMatch(/No earnings calendar yet/i)
    expect(screen.getByTestId('news-flow-empty').textContent).toMatch(/No headlines yet/i)
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

  describe('task 0028 — Top Movers honest source attribution', () => {
    it('oracle offline → Top Movers renders feed-pending caption and empty state, no ranking', () => {
      render(
        <MarketIntelligencePanel
          stocks={stocks}
          isLive={false}
          isLoading={false}
          onSelectTicker={vi.fn()}
        />,
      )

      const topMoversCard = screen.getByRole('heading', { name: /Top Movers/i }).closest('article')
      expect(topMoversCard).toBeTruthy()
      // Top Movers card now carries its own feed-pending caption (3 captions total: TM + Earnings + News)
      expect(screen.getAllByText(/Source: feed pending/i).length).toBeGreaterThanOrEqual(3)
      // No ranking buttons — three seed tickers must NOT render as movers.
      expect(topMoversCard!.querySelector('button[type="button"][class*="bg-dark-100/60"]')).toBeNull()
      // Honest empty state present:
      expect(screen.getByTestId('top-movers-empty-gainers').textContent).toMatch(/No gainers yet/i)
    })

    it('oracle live, gainers present but no losers → Losers tab renders explicit empty state, not Gainers list', () => {
      const positiveOnly: Stock[] = stocks.filter(s => s.change24h >= 0)
      render(
        <MarketIntelligencePanel
          stocks={positiveOnly}
          isLive
          updatedAtMs={Date.now()}
          isLoading={false}
          onSelectTicker={vi.fn()}
        />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Losers' }))
      expect(screen.getByTestId('top-movers-empty-losers').textContent).toMatch(/No losers yet/i)
      // Gainers ranking must NOT bleed through to the Losers tab.
      expect(screen.queryByRole('button', { name: /AAPL\+1.80%/i })).not.toBeInTheDocument()
    })

    it('oracle live, both directions present → both tabs render their respective ranked lists', () => {
      render(
        <MarketIntelligencePanel
          stocks={stocks}
          isLive
          updatedAtMs={Date.now()}
          isLoading={false}
          onSelectTicker={vi.fn()}
        />,
      )

      // Gainers (default)
      expect(screen.getByRole('button', { name: /AAPL\+1.80%/i })).toBeInTheDocument()
      expect(screen.queryByTestId('top-movers-empty-gainers')).not.toBeInTheDocument()

      // Losers
      fireEvent.click(screen.getByRole('button', { name: 'Losers' }))
      expect(screen.getByRole('button', { name: /TSLA-2.60%/i })).toBeInTheDocument()
      expect(screen.queryByTestId('top-movers-empty-losers')).not.toBeInTheDocument()
    })

    it('oracle live caption renders Source: oracle when updatedAtMs is supplied', () => {
      // 7s in the past so the age line reads "Updated 7s ago" deterministically
      const updatedAtMs = Date.now() - 7_000
      render(
        <MarketIntelligencePanel
          stocks={stocks}
          isLive
          updatedAtMs={updatedAtMs}
          isLoading={false}
          onSelectTicker={vi.fn()}
        />,
      )

      const topMoversCard = screen.getByRole('heading', { name: /Top Movers/i }).closest('article')
      expect(topMoversCard?.textContent).toMatch(/Source: oracle/i)
      expect(topMoversCard?.textContent).toMatch(/Updated\s+\d+s\s+ago/i)
      // Earnings + News still on feed pending (only those two captions remain "pending")
      expect(screen.getAllByText(/Source: feed pending/i).length).toBe(2)
    })
  })
})
