import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { PairSelector } from '@/components/perps/PairSelector'
import type { PerpPair } from '@/lib/perpsData'

function makePair(overrides: Partial<PerpPair>): PerpPair {
  return {
    marketId: 0,
    symbol: 'BTC-USD',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    markPrice: 84_250.6,
    indexPrice: 84_250.6,
    change24h: 0,
    volume24h: 0,
    fundingRate: 0,
    nextFundingTime: 0,
    openInterest: 0,
    maxLeverage: 50,
    ...overrides,
  }
}

const pairs: PerpPair[] = [
  makePair({ marketId: 0, symbol: 'BTC-USD', change24h: 0 }),
  makePair({ marketId: 1, symbol: 'ETH-USD', markPrice: 1_820, change24h: -2.5 }),
  makePair({ marketId: 2, symbol: 'SOL-USD', markPrice: 134.5, change24h: 1.2 }),
]

describe('PairSelector', () => {
  it('renders muted em-dash for pairs whose 24h change is the zero sentinel', () => {
    render(<PairSelector pairs={pairs} selected="BTC-USD" onSelect={() => {}} />)
    const meta = screen.getByTestId('pair-selector-meta-BTC-USD')
    expect(meta).toHaveTextContent('—')
    expect(meta.textContent).not.toContain('0.0%')
    expect(meta.querySelector('.text-green-400')).toBeNull()
    expect(meta.querySelector('.text-red-400')).toBeNull()
  })

  it('renders coloured percentages when 24h change is non-zero', () => {
    render(<PairSelector pairs={pairs} selected="BTC-USD" onSelect={() => {}} />)
    const ethMeta = screen.getByTestId('pair-selector-meta-ETH-USD')
    expect(ethMeta.textContent).toContain('-2.5%')
    const solMeta = screen.getByTestId('pair-selector-meta-SOL-USD')
    expect(solMeta.textContent).toContain('+1.2%')
  })

  it('invokes onSelect when a pill is clicked', () => {
    const onSelect = vi.fn()
    render(<PairSelector pairs={pairs} selected="BTC-USD" onSelect={onSelect} />)
    const ethButton = screen.getByRole('button', { name: /ETH-USD/i })
    fireEvent.click(ethButton)
    expect(onSelect).toHaveBeenCalledWith('ETH-USD')
  })

  it('marks the active pair pill with the goodgreen highlight', () => {
    render(<PairSelector pairs={pairs} selected="ETH-USD" onSelect={() => {}} />)
    const activeButton = screen.getByRole('button', { name: /ETH-USD/i })
    expect(activeButton.className).toContain('bg-goodgreen/15')
    const inactiveButton = screen.getByRole('button', { name: /BTC-USD/i })
    expect(inactiveButton.className).not.toContain('bg-goodgreen/15')
  })

  it('handles a pair with non-zero change cleanly even when active', () => {
    render(<PairSelector pairs={pairs} selected="ETH-USD" onSelect={() => {}} />)
    const ethMeta = screen.getByTestId('pair-selector-meta-ETH-USD')
    expect(within(ethMeta).getByText(/-2.5%/)).toBeInTheDocument()
  })
})
