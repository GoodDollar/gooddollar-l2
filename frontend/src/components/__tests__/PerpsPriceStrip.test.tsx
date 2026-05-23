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

import { PerpsPriceStrip } from '@/components/PerpsPriceStrip'
import { useOnChainPairs } from '@/lib/useOnChainPerps'
import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
import type { PerpPair } from '@/lib/perpsData'

function p(over: Partial<PerpPair>): PerpPair {
  return {
    marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
    markPrice: 84000, indexPrice: 84000, change24h: 1.5, volume24h: 0,
    fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 100,
    ...over,
  }
}

describe('PerpsPriceStrip', () => {
  beforeEach(() => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null, isLoading: false, error: null, nextRetryAt: null,
    })
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
    expect(screen.getByText('Market closed')).toBeInTheDocument()
  })
})
