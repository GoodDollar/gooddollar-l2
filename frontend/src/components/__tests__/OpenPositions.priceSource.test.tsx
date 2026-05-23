import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/useOnChainPerps', () => ({
  useOnChainPositions: vi.fn(),
  useOnChainPairs: vi.fn(),
}))

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn().mockReturnValue({
    status: null, isLoading: false, error: null, nextRetryAt: null,
  }),
}))

import { OpenPositions } from '@/components/OpenPositions'
import { useOnChainPositions, useOnChainPairs } from '@/lib/useOnChainPerps'
import type { OpenPosition, PerpPair } from '@/lib/perpsData'

function position(over: Partial<OpenPosition>): OpenPosition {
  return {
    pair: 'BTC-USD', side: 'long', size: 0.1, leverage: 10,
    entryPrice: 80000, markPrice: 84000, liquidationPrice: 76000,
    unrealizedPnl: 100, margin: 100, marginMode: 'cross',
    ...over,
  }
}

function perpPair(over: Partial<PerpPair>): PerpPair {
  return {
    marketId: 0, symbol: 'BTC-USD', baseAsset: 'BTC', quoteAsset: 'USD',
    markPrice: 84000, indexPrice: 84000, change24h: 1.5, volume24h: 0,
    fundingRate: 0, nextFundingTime: 0, openInterest: 0, maxLeverage: 100,
    ...over,
  }
}

describe('OpenPositions — per-row PriceSourceBadge (lane 4 task 0003)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a PriceSourceBadge on each open position row', () => {
    vi.mocked(useOnChainPositions).mockReturnValue({
      positions: [
        position({ pair: 'BTC-USD' }),
        position({ pair: 'ETH-USD', size: 1, entryPrice: 3500, markPrice: 3600, liquidationPrice: 3000 }),
      ],
      isLoading: false,
    })
    vi.mocked(useOnChainPairs).mockReturnValue({
      pairs: [
        perpPair({ symbol: 'BTC-USD', baseAsset: 'BTC', markPrice: 84000 }),
        perpPair({ symbol: 'ETH-USD', baseAsset: 'ETH', markPrice: 3500, marketId: 1 }),
      ],
      isLoading: false, isLive: true,
    })

    render(<OpenPositions />)
    const badges = screen.getAllByTestId('price-source-badge')
    // One badge per row, two rows.
    expect(badges).toHaveLength(2)
  })

  it('renders nothing when there are no open positions', () => {
    vi.mocked(useOnChainPositions).mockReturnValue({ positions: [], isLoading: false })
    vi.mocked(useOnChainPairs).mockReturnValue({ pairs: [], isLoading: false, isLive: false })

    render(<OpenPositions />)
    expect(screen.queryByTestId('price-source-badge')).not.toBeInTheDocument()
    expect(screen.getByText('No open positions')).toBeInTheDocument()
  })
})
