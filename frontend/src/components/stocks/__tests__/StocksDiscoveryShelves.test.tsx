import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Stock } from '@/lib/stockData'
import { StocksDiscoveryShelves } from '@/components/stocks/StocksDiscoveryShelves'

vi.mock('next/link', () => ({
  default: ({ href, children, prefetch: _prefetch, ...rest }: { href: string; children: React.ReactNode; prefetch?: boolean }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const stock = (ticker: string, change24h: number, volume24h: number, marketCap: number): Stock => ({
  ticker,
  name: `s${ticker}`,
  sector: 'Technology',
  description: '',
  price: 100,
  change24h,
  volume24h,
  marketCap,
  high52w: 120,
  low52w: 80,
  sparkline7d: [95, 98, 100],
  peRatio: 20,
  eps: 3,
  dividendYield: 0,
  avgVolume: 10,
})

describe('StocksDiscoveryShelves', () => {
  it('renders discovery shelves and ticker links when data is present', () => {
    render(
      <StocksDiscoveryShelves
        isLoading={false}
        dailyMovers={[stock('AAPL', 3.1, 10, 100), stock('TSLA', -2.7, 8, 80)]}
        trending={[stock('NVDA', 1.2, 22, 200)]}
        analysisPicks={[stock('MSFT', 0.9, 9, 150)]}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Daily Movers' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trending Stocks' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Market Analysis' })).toBeInTheDocument()

    const hrefs = screen.getAllByRole('link').map((node) => node.getAttribute('href'))
    expect(hrefs).toContain('/stocks/AAPL')
    expect(hrefs).toContain('/stocks/NVDA')
    expect(hrefs).toContain('/stocks/MSFT')
  })

  it('renders empty copy when shelves have no items', () => {
    render(
      <StocksDiscoveryShelves
        isLoading={false}
        dailyMovers={[]}
        trending={[]}
        analysisPicks={[]}
      />,
    )

    expect(screen.getAllByText(/No signals yet\./i).length).toBeGreaterThan(0)
  })
})
