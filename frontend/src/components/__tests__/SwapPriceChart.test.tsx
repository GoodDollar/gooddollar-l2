import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/useAttributedPrice', () => ({
  useAttributedPrices: vi.fn(),
}))

vi.mock('@/lib/usePriceFeeds', async () => {
  const actual = await vi.importActual<typeof import('@/lib/usePriceFeeds')>('@/lib/usePriceFeeds')
  return {
    ...actual,
    usePriceFeeds: vi.fn(),
  }
})

import { SwapPriceChart } from '@/components/SwapPriceChart'
import { useAttributedPrices } from '@/lib/useAttributedPrice'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import type { AttributedPrice } from '@/lib/useAttributedPrice'
import type { PriceSource } from '@/lib/priceSource'

function attr(over: Partial<AttributedPrice> & { symbol: string; priceUsd: number; source: PriceSource }): AttributedPrice {
  return {
    change24h: 0,
    ageMs: 1000,
    divergent: false,
    divergenceOtherUsd: null,
    ...over,
  }
}

describe('SwapPriceChart — uses canonical useAttributedPrices (task 0027)', () => {
  beforeEach(() => {
    vi.mocked(usePriceFeeds).mockReturnValue({
      prices: { ETH: 2065, 'G$': 0.01022 },
      sources: { ETH: 'coingecko', 'G$': 'coingecko' },
      quotes: {},
      isLive: true,
      lastUpdated: new Date(),
      error: null,
      unknownSymbols: [],
    })
  })

  it('renders the rate derived from useAttributedPrices, not usePriceFeeds', () => {
    vi.mocked(useAttributedPrices).mockReturnValue({
      ETH:  attr({ symbol: 'ETH',  priceUsd: 1820,   source: 'chain-oracle' }),
      'G$': attr({ symbol: 'G$',   priceUsd: 0.0102, source: 'fallback' }),
    })

    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    // 1820 / 0.0102 = 178,431.37 → formatted as 178,431 (maximumFractionDigits: 0)
    expect(screen.getByText(/178,431\s*G\$/)).toBeInTheDocument()
    expect(screen.queryByText(/202,025/)).not.toBeInTheDocument()
  })

  it('shows a PriceSourceBadge for the input symbol (chain-oracle case)', () => {
    vi.mocked(useAttributedPrices).mockReturnValue({
      ETH:  attr({ symbol: 'ETH',  priceUsd: 1820,   source: 'chain-oracle' }),
      'G$': attr({ symbol: 'G$',   priceUsd: 0.0102, source: 'fallback' }),
    })

    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    const badge = screen.getByTestId('price-source-badge')
    expect(badge).toHaveAttribute('data-source', 'chain-oracle')
  })

  it('returns null when both symbols resolve to unknown', () => {
    vi.mocked(useAttributedPrices).mockReturnValue({
      ETH:  attr({ symbol: 'ETH',  priceUsd: 0, source: 'unknown' }),
      'G$': attr({ symbol: 'G$',   priceUsd: 0, source: 'unknown' }),
    })

    const { container } = render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the indicative caption when both inputs resolve to fallback', () => {
    vi.mocked(useAttributedPrices).mockReturnValue({
      ETH:  attr({ symbol: 'ETH',  priceUsd: 3012.45, source: 'fallback' }),
      'G$': attr({ symbol: 'G$',   priceUsd: 0.0102,  source: 'fallback' }),
    })

    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.getByTestId('hero-indicative')).toHaveTextContent(/Indicative/i)
  })

  it('does not show the indicative caption when at least one input is live', () => {
    vi.mocked(useAttributedPrices).mockReturnValue({
      ETH:  attr({ symbol: 'ETH',  priceUsd: 1820,   source: 'chain-oracle' }),
      'G$': attr({ symbol: 'G$',   priceUsd: 0.0102, source: 'fallback' }),
    })

    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.queryByTestId('hero-indicative')).not.toBeInTheDocument()
  })

  // Task 0035 — the percentage displayed next to the CoinGecko badge must
  // come from CoinGecko's `change24h`, not from a Math.random() walk in
  // chartData.ts. We also drop the 1D/1W/1M selector because we have no
  // multi-timeframe real series to back it up — every selection used to
  // render the same synthetic walk under a "CoinGecko" badge.
  it('renders the input change24h next to the badge (not a synthetic walk %)', () => {
    vi.mocked(useAttributedPrices).mockReturnValue({
      ETH:  attr({ symbol: 'ETH',  priceUsd: 2069,   source: 'coingecko', change24h: -0.95 }),
      'G$': attr({ symbol: 'G$',   priceUsd: 0.0102, source: 'coingecko', change24h: 0.12 }),
    })

    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    const percent = screen.getByTestId('hero-change-percent')
    expect(percent).toHaveTextContent(/0\.95\s*%/)
    expect(percent).toHaveTextContent('▼')
    expect(screen.queryByText(/33\.83/)).not.toBeInTheDocument()
  })

  it('hides the percentage entirely when change24h is null', () => {
    vi.mocked(useAttributedPrices).mockReturnValue({
      ETH:  attr({ symbol: 'ETH',  priceUsd: 2069,   source: 'coingecko', change24h: null }),
      'G$': attr({ symbol: 'G$',   priceUsd: 0.0102, source: 'coingecko', change24h: null }),
    })

    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.queryByTestId('hero-change-percent')).toBeNull()
  })

  it('no longer renders the 1D / 1W / 1M timeframe selector', () => {
    vi.mocked(useAttributedPrices).mockReturnValue({
      ETH:  attr({ symbol: 'ETH',  priceUsd: 2069,   source: 'coingecko', change24h: -0.95 }),
      'G$': attr({ symbol: 'G$',   priceUsd: 0.0102, source: 'coingecko', change24h: 0.12 }),
    })

    render(<SwapPriceChart inputSymbol="ETH" outputSymbol="G$" />)
    expect(screen.queryByRole('button', { name: '1D' })).toBeNull()
    expect(screen.queryByRole('button', { name: '1W' })).toBeNull()
    expect(screen.queryByRole('button', { name: '1M' })).toBeNull()
  })
})
