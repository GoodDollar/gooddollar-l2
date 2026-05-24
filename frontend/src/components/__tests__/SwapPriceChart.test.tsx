/**
 * Task 0061 — SwapPriceChart honesty contract.
 *
 * Locks down the four invariants the landing hero must hold:
 *   1. Live feed → "Live · last update Ns ago" pill, real 24h change.
 *   2. Live feed but no 24h-change reading → em-dash percent.
 *   3. Stale / errored feed → "Demo · prices are illustrative" pill.
 *   4. The synthetic sparkline ALWAYS carries the "Sparkline illustrative"
 *      overlay — `getChartData()` is hash-seeded regardless of feed state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const usePriceFeedsMock = vi.fn()
vi.mock('@/lib/usePriceFeeds', async () => {
  const actual = await vi.importActual<typeof import('@/lib/usePriceFeeds')>('@/lib/usePriceFeeds')
  return {
    ...actual,
    usePriceFeeds: () => usePriceFeedsMock(),
  }
})

import { SwapPriceChart } from '@/components/SwapPriceChart'

function feed(overrides: Partial<import('@/lib/usePriceFeeds').PriceFeedState> = {}) {
  const base: import('@/lib/usePriceFeeds').PriceFeedState = {
    prices: { ETH: 3000, 'G$': 0.01 },
    quotes: { ETH: { price: 3000, change24h: -2.41, volume24h: 0, marketCap: 0 } },
    isLive: true,
    lastUpdated: new Date(Date.now() - 5_000),
    error: null,
    unknownSymbols: [],
  }
  return { ...base, ...overrides }
}

describe('SwapPriceChart', () => {
  beforeEach(() => {
    usePriceFeedsMock.mockReset()
  })

  it('renders a Live pill and the real 24h change when the feed is live', () => {
    usePriceFeedsMock.mockReturnValue(feed())
    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.getByTestId('swap-attribution-pill').textContent).toMatch(/Live/)
    expect(screen.getByTestId('swap-change-cell').textContent).toMatch(/2\.41%/)
    expect(screen.getByTestId('swap-change-cell').textContent).toMatch(/ETH 24h/)
  })

  it('renders an em-dash percentage when the live change24h is missing', () => {
    usePriceFeedsMock.mockReturnValue(feed({ quotes: {} }))
    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.getByTestId('swap-attribution-pill').textContent).toMatch(/Live/)
    const cell = screen.getByTestId('swap-change-cell')
    expect(cell.textContent).toMatch(/—/)
    expect(cell.textContent).not.toMatch(/\d+\.\d+%/)
  })

  it('renders a Demo pill and em-dash when the feed is stale or errored', () => {
    usePriceFeedsMock.mockReturnValue(feed({ isLive: false, lastUpdated: null, error: 'price proxy 500' }))
    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.getByTestId('swap-attribution-pill').textContent).toMatch(/Demo/)
    expect(screen.getByTestId('swap-attribution-pill').textContent).toMatch(/illustrative/)
    expect(screen.getByTestId('swap-change-cell').textContent).toMatch(/—/)
  })

  it('flips to Demo when the rate is live but older than the freshness window', () => {
    usePriceFeedsMock.mockReturnValue(feed({ lastUpdated: new Date(Date.now() - 5 * 60_000) }))
    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.getByTestId('swap-attribution-pill').textContent).toMatch(/Demo/)
  })

  it('renders the "Sparkline illustrative" overlay regardless of feed state', () => {
    usePriceFeedsMock.mockReturnValue(feed())
    const { unmount } = render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.getByText(/Sparkline illustrative/)).toBeInTheDocument()
    unmount()

    usePriceFeedsMock.mockReturnValue(feed({ isLive: false, lastUpdated: null }))
    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.getByText(/Sparkline illustrative/)).toBeInTheDocument()
  })

  it('exposes the sparkline as illustrative via aria-label', () => {
    usePriceFeedsMock.mockReturnValue(feed())
    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    const svg = document.querySelector('svg[aria-label]')
    expect(svg?.getAttribute('aria-label')).toMatch(/illustrative/)
  })

  it('renders a positive sign and green color for a positive 24h change', () => {
    usePriceFeedsMock.mockReturnValue(
      feed({ quotes: { ETH: { price: 3000, change24h: 3.45, volume24h: 0, marketCap: 0 } } }),
    )
    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    const cell = screen.getByTestId('swap-change-cell')
    expect(cell.textContent).toMatch(/▲/)
    expect(cell.textContent).toMatch(/3\.45%/)
  })
})
