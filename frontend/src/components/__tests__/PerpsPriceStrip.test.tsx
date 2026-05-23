import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPairs: vi.fn(),
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn().mockReturnValue({
    status: null, isLoading: false, error: null, nextRetryAt: null,
  }),
}))

vi.mock('@/lib/usePriceFeeds', () => ({
  usePriceFeeds: vi.fn().mockReturnValue({
    prices: {}, sources: {}, quotes: {}, isLive: true,
    lastUpdated: new Date(), error: null, unknownSymbols: [],
  }),
  FALLBACK_PRICES: { ETH: 3012.45, WBTC: 60125.80, USDC: 1 },
}))

import { PerpsPriceStrip } from '@/components/PerpsPriceStrip'
import { useOnChainPairs } from '@/lib/useOnChainPerps'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
import { usePriceFeeds } from '@/lib/usePriceFeeds'
import type { PerpPair } from '@/lib/perpsData'

function p(over: Partial<PerpPair>): PerpPair {
  return {
    marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
    markPrice: 84000, indexPrice: 84000, change24h: 1.5, volume24h: 0,
    fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 100,
    ...over,
  }
}

function mockFeeds(over: {
  prices?: Record<string, number>
  sources?: Record<string, 'coingecko' | 'fallback'>
  quotes?: Record<string, { price: number; change24h: number; volume24h: number; marketCap: number }>
} = {}): void {
  vi.mocked(usePriceFeeds).mockReturnValue({
    prices: over.prices ?? {},
    sources: over.sources ?? {},
    quotes: over.quotes ?? {},
    isLive: true,
    lastUpdated: new Date(),
    error: null,
    unknownSymbols: [],
  })
}

describe('PerpsPriceStrip', () => {
  beforeEach(() => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: null, nextRetryAt: null,
    })
    mockFeeds()
  })

  it('renders BTC and ETH cards plus the active pair when it is a third symbol', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        p({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 }),
        p({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500, marketId: 1 }),
        p({ symbol: 'SOL-USD', baseAsset: 'SOL', markPrice: 134.5, marketId: 2 }),
      ],
      isLoading: false, isLive: true,
    })

    render(<PerpsPriceStrip activeSymbol="SOL-USD" />)
    expect(screen.getByText('BTC-USD')).toBeInTheDocument()
    expect(screen.getByText('ETH-USD')).toBeInTheDocument()
    expect(screen.getByText('SOL-USD')).toBeInTheDocument()
  })

  it('renders only BTC and ETH when the active pair is already one of them', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        p({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 }),
        p({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500, marketId: 1 }),
      ],
      isLoading: false, isLive: true,
    })

    render(<PerpsPriceStrip activeSymbol="BTC-USD" />)
    expect(screen.getAllByTestId('live-price-card')).toHaveLength(2)
  })

  it('badges read "Chain oracle" when chain markPrice is positive', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        p({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 }),
        p({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500, marketId: 1 }),
      ],
      isLoading: false, isLive: true,
    })

    render(<PerpsPriceStrip activeSymbol="BTC-USD" />)
    const labels = screen.getAllByText('Chain oracle')
    expect(labels.length).toBeGreaterThanOrEqual(2)
  })

  it('badges read "Market closed" when price-service reports sessionState=closed', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        p({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 }),
        p({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500, marketId: 1 }),
      ],
      isLoading: false, isLive: true,
    })
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: {
        healthy: false, freshCount: 0, totalCount: 2,
        quotes: [
          { symbol: 'BTC', lastUpdateMs: 1000, sessionState: 'closed', confidence: 100 },
          { symbol: 'ETH', lastUpdateMs: 1000, sessionState: 'open', confidence: 100 },
        ],
        timestamp: Date.now(),
      },
      isLoading: false, error: null, nextRetryAt: null,
    })

    render(<PerpsPriceStrip activeSymbol="BTC-USD" />)
    // Badge label AND freshness footer both render "Market closed"; assert at least one.
    expect(screen.getAllByText('Market closed').length).toBeGreaterThan(0)
  })

  // Task 0033 — when useOnChainPairs returns isFallback:true rows (the
  // FALLBACK_PAIRS substitution kicked in because the RPC is unreachable),
  // the headline BTC/ETH tiles MUST render the CoinGecko price and badge,
  // not the static FALLBACK_PAIRS markPrice with a "Chain oracle" badge.
  it('headline BTC/ETH tiles use CoinGecko price when pairs are isFallback:true', () => {
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        p({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84_250, isFallback: true }),
        p({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 1_820, marketId: 1, isFallback: true }),
      ],
      isLoading: false, isLive: false,
    })
    mockFeeds({
      prices: { BTC: 67_500, WBTC: 67_500, ETH: 2_069, WETH: 2_069 },
      sources: { BTC: 'coingecko', WBTC: 'coingecko', ETH: 'coingecko', WETH: 'coingecko' },
      quotes: {
        BTC:  { price: 67_500, change24h: -0.4, volume24h: 0, marketCap: 0 },
        WBTC: { price: 67_500, change24h: -0.4, volume24h: 0, marketCap: 0 },
        ETH:  { price: 2_069,  change24h: -0.9, volume24h: 0, marketCap: 0 },
        WETH: { price: 2_069,  change24h: -0.9, volume24h: 0, marketCap: 0 },
      },
    })

    const { container } = render(<PerpsPriceStrip activeSymbol="BTC-USD" />)

    // Cards must read the CoinGecko prices, never the FALLBACK_PAIRS constants.
    const cards = Array.from(container.querySelectorAll('[data-testid="live-price-card"]'))
    const cardTexts = cards.map(c => c.textContent ?? '')
    const btcCard = cardTexts.find(t => t.startsWith('BTC-USD')) ?? ''
    const ethCard = cardTexts.find(t => t.startsWith('ETH-USD')) ?? ''

    expect(btcCard).toContain('$67,500')
    expect(btcCard).not.toContain('$84,250')
    expect(ethCard).toContain('$2,069')
    expect(ethCard).not.toContain('$1,820')

    // Every headline tile carries the "Cached (CoinGecko)" badge, none claim
    // "Chain oracle" because the chain is not actually responding.
    expect(screen.getAllByText('Cached (CoinGecko)').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('Chain oracle')).toBeNull()
  })
})
