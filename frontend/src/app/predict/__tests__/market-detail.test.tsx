import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

let mockMarketId = '1'

vi.mock('next/navigation', () => ({
  useParams: () => ({ marketId: mockMarketId }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/useMarkets', () => ({
  useOnChainMarket: () => ({ market: null, isLoading: false }),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: ({ children }: any) => children({ openConnectModal: vi.fn() }) },
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: () => ({ isConnected: false }),
}))

vi.mock('@/lib/usePredictTrade', () => ({
  usePredictTrade: () => ({
    buyShares: vi.fn(),
    sellShares: vi.fn(),
    isExecuting: false,
    error: null,
  }),
}))

vi.mock('@/components/ChartErrorBoundary', () => ({
  ChartErrorBoundary: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="mock-chart">Chart</div>,
}))

import MarketDetailPage from '../[marketId]/page'

describe('MarketDetailPage — BigInt crash guard', () => {
  it('does not crash when marketId is a non-numeric string', () => {
    mockMarketId = 'abc'
    const { container } = render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    expect(container.innerHTML).not.toBe('')
    expect(screen.getByText('Market Not Found')).toBeTruthy()
  })

  it('does not crash when marketId contains special characters', () => {
    mockMarketId = '12-xyz!@#'
    render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    expect(screen.getByText('Market Not Found')).toBeTruthy()
  })

  it('does not crash when marketId is empty', () => {
    mockMarketId = ''
    render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    expect(screen.getByText('Market Not Found')).toBeTruthy()
  })

  it('shows Market Not Found for a valid numeric ID with no matching market', () => {
    mockMarketId = '999999'
    render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    expect(screen.getByText('Market Not Found')).toBeTruthy()
  })

  it('renders Back to Markets link on not-found state', () => {
    mockMarketId = 'invalid'
    render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    const link = screen.getByText('Back to Markets')
    expect(link).toBeTruthy()
    expect(link.closest('a')?.getAttribute('href')).toBe('/predict')
  })
})
