import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PeerComparePanel } from '@/components/stocks/PeerComparePanel'
import type { Stock } from '@/lib/stockData'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const livePeer = (ticker: string, change24h: number): Stock => ({
  ticker,
  name: ticker,
  displayName: ticker,
  sector: 'Technology',
  description: '',
  price: 100,
  change24h,
  volume24h: 1_000_000,
  marketCap: 100_000_000_000,
  high52w: 150,
  low52w: 50,
  sparkline7d: [],
  peRatio: 20,
  eps: 5,
  dividendYield: 0,
  avgVolume: 1_000_000,
})

const zeroPeer = (ticker: string): Stock => ({
  ...livePeer(ticker, 0),
  change24h: 0,
  volume24h: 0,
  marketCap: 0,
  peRatio: 0,
  eps: 0,
  avgVolume: 0,
})

describe('PeerComparePanel', () => {
  it('renders colored 24h% values when peers have live data', () => {
    render(
      <PeerComparePanel
        peers={[livePeer('MSFT', 1.5), livePeer('NVDA', -2.1)]}
        metric="change24h"
        onMetricChange={() => {}}
      />
    )
    expect(screen.getByText('+1.50%')).toBeInTheDocument()
    expect(screen.getByText('-2.10%')).toBeInTheDocument()
    expect(screen.queryByTestId('peer-compare-degraded')).toBeNull()
  })

  it('renders em-dashes and a "feed degraded" subtitle when every peer lacks live 24h data', () => {
    render(
      <PeerComparePanel
        peers={[zeroPeer('MSFT'), zeroPeer('NVDA'), zeroPeer('GOOGL')]}
        metric="change24h"
        onMetricChange={() => {}}
      />
    )

    expect(screen.queryByText(/\+0\.00%/)).toBeNull()
    expect(screen.getByTestId('peer-compare-degraded')).toHaveTextContent(
      /24h change unavailable — oracle feed degraded/i
    )
    // Each peer row should have an em-dash for its value.
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('switches subtitle copy by metric and gates Mkt Cap on fundamentals', () => {
    render(
      <PeerComparePanel
        peers={[zeroPeer('MSFT'), zeroPeer('NVDA')]}
        metric="marketCap"
        onMetricChange={() => {}}
      />
    )
    expect(screen.getByTestId('peer-compare-degraded')).toHaveTextContent(
      /Market cap unavailable/i
    )
  })

  it('renders Peer data unavailable when peers list is empty', () => {
    render(
      <PeerComparePanel peers={[]} metric="change24h" onMetricChange={() => {}} />
    )
    expect(screen.getByText(/Peer data unavailable right now/i)).toBeInTheDocument()
    expect(screen.queryByTestId('peer-compare-degraded')).toBeNull()
  })
})
