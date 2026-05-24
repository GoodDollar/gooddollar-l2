import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import { RecentTrades } from '../RecentTrades'
import type { TradeRecord } from '@/lib/stockData'

let searchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}))

function withDemoQuery(value: string | null): void {
  searchParams = value === null ? new URLSearchParams() : new URLSearchParams({ demoTrades: value })
}

function trade(partial: Partial<TradeRecord> & Pick<TradeRecord, 'id' | 'ticker' | 'side' | 'price' | 'timestamp'>): TradeRecord {
  return {
    shares: 1,
    pnl: 0,
    ...partial,
  }
}

beforeEach(() => {
  withDemoQuery(null)
})

describe('RecentTrades default path', () => {
  it('renders the honest empty state when no trades are provided', () => {
    render(<RecentTrades trades={[]} />)
    expect(screen.getByText('No recent trades')).toBeInTheDocument()
    expect(screen.getByText(/CollateralVault/)).toBeInTheDocument()
    expect(screen.queryByText(/Demo data/)).not.toBeInTheDocument()
  })

  it('never calls Math.random in the default empty render', () => {
    const spy = vi.spyOn(Math, 'random')
    render(<RecentTrades trades={[]} markPrice={191} />)
    expect(spy).not.toHaveBeenCalled()
  })

  it('never calls Math.random in the default populated render', () => {
    const spy = vi.spyOn(Math, 'random')
    render(<RecentTrades
      trades={[
        trade({ id: 'a', ticker: 'AAPL', side: 'buy', price: 191, timestamp: 3000 }),
        trade({ id: 'b', ticker: 'AAPL', side: 'sell', price: 192, timestamp: 5000 }),
      ]}
      markPrice={191}
    />)
    expect(spy).not.toHaveBeenCalled()
  })

  it('renders trades in strict descending-timestamp order regardless of input order', () => {
    render(<RecentTrades trades={[
      trade({ id: 'a', ticker: 'AAPL', side: 'buy', price: 100, timestamp: 1000 }),
      trade({ id: 'b', ticker: 'AAPL', side: 'sell', price: 110, timestamp: 3000 }),
      trade({ id: 'c', ticker: 'AAPL', side: 'buy', price: 120, timestamp: 2000 }),
    ]} />)

    const region = screen.getByRole('region', { name: /recent trades list/i })
    const rows = region.querySelectorAll('div.flex.justify-between')
    // Most-recent first → timestamp=3000 (price 110), then 2000 (120), then 1000 (100).
    expect(rows[0]?.textContent).toContain('110')
    expect(rows[1]?.textContent).toContain('120')
    expect(rows[2]?.textContent).toContain('100')
  })

  it('renders crypto-specific empty-state copy for a crypto symbol', () => {
    render(<RecentTrades trades={[]} symbol="BTC" />)
    expect(screen.getByText(/Crypto trade history/)).toBeInTheDocument()
    expect(screen.queryByText(/CollateralVault/)).not.toBeInTheDocument()
  })

  it('preserves the accessible region semantics in the empty state', () => {
    render(<RecentTrades trades={[]} />)
    const region = screen.getByRole('region', { name: /recent trades list/i })
    expect(region).toHaveAttribute('tabindex', '0')
  })
})

describe('RecentTrades demo opt-in', () => {
  it('renders the demo banner + RNG trades when ?demoTrades=1 is present', () => {
    withDemoQuery('1')
    render(<RecentTrades trades={[]} markPrice={191} />)
    expect(screen.getByText('Demo data — not on-chain')).toBeInTheDocument()
    // Three columns header always present.
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Size')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
  })

  it('does not show the demo banner without the query flag', () => {
    withDemoQuery(null)
    render(<RecentTrades trades={[]} markPrice={191} />)
    expect(screen.queryByText('Demo data — not on-chain')).not.toBeInTheDocument()
  })

  it('falls back to empty-state when the flag is set but markPrice is omitted', () => {
    withDemoQuery('1')
    render(<RecentTrades trades={[]} />)
    expect(screen.queryByText('Demo data — not on-chain')).not.toBeInTheDocument()
    expect(screen.getByText('No recent trades')).toBeInTheDocument()
  })
})
