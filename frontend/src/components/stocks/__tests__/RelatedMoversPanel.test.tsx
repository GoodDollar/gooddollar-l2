import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RelatedMoversPanel } from '@/components/stocks/RelatedMoversPanel'
import type { Stock } from '@/lib/stockData'

vi.mock('next/link', () => ({
  default: ({ href, children, prefetch: _prefetch, ...rest }: { href: string; children: React.ReactNode; prefetch?: boolean }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const stock = (ticker: string, change24h: number): Stock => ({
  ticker,
  name: `s${ticker}`,
  displayName: `s${ticker}`,
  sector: 'Technology',
  description: '',
  price: 100,
  change24h,
  volume24h: 1,
  marketCap: 1,
  high52w: 1,
  low52w: 1,
  sparkline7d: [1, 2, 3],
  peRatio: 1,
  eps: 1,
  dividendYield: 0,
  avgVolume: 1,
})

const zeroStock = (ticker: string): Stock => ({
  ticker,
  name: `s${ticker}`,
  displayName: `s${ticker}`,
  sector: 'Technology',
  description: '',
  price: 100,
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  high52w: 0,
  low52w: 0,
  sparkline7d: [],
  peRatio: 0,
  eps: 0,
  dividendYield: 0,
  avgVolume: 0,
})

describe('RelatedMoversPanel', () => {
  it('renders related links and excludes current ticker from movers list', () => {
    render(
      <RelatedMoversPanel
        currentTicker="AAPL"
        related={[stock('MSFT', 1.2), stock('NVDA', 3.3)]}
        movers={[stock('AAPL', 2.4), stock('NVDA', 3.3), stock('AMZN', -2.1)]}
      />
    )

    const links = screen.getAllByRole('link')
    const hrefs = links.map((el) => el.getAttribute('href'))
    expect(hrefs).toContain('/stocks/MSFT')
    expect(hrefs).toContain('/stocks/NVDA')

    const moversHeading = screen.getByText(/Daily movers/i)
    expect(moversHeading).toBeInTheDocument()
    expect(screen.queryByText(/\+2\.40%/)).toBeNull()
  })

  it('omits movers whose oracle has no 24h-change reading and shows an honest empty state', () => {
    render(
      <RelatedMoversPanel
        currentTicker="AAPL"
        related={[]}
        movers={[zeroStock('MSFT'), zeroStock('NVDA'), zeroStock('AMZN')]}
      />
    )

    // No fabricated +0.00% lines for zero-data oracle.
    expect(screen.queryByText(/\+0\.00%/)).toBeNull()
    expect(screen.queryByText(/-0\.00%/)).toBeNull()
    expect(screen.getByText(/No 24h-change data from the oracle yet/i)).toBeInTheDocument()
  })

  it('keeps movers that have real volume even when change24h is zero (true flat day)', () => {
    const flatButReal: Stock = { ...zeroStock('MSFT'), volume24h: 1_000_000 }
    render(
      <RelatedMoversPanel
        currentTicker="AAPL"
        related={[]}
        movers={[flatButReal]}
      />
    )
    expect(screen.getByText('MSFT')).toBeInTheDocument()
  })
})
