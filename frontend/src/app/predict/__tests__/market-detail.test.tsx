import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

let mockMarketId = '1'
let mockMarketCount: bigint = BigInt(2)
let mockCountLoading = false
let mockCountError = false
let mockOnChainMarket: { market: unknown; isLoading: boolean; isError?: boolean } = {
  market: null,
  isLoading: false,
}

vi.mock('next/navigation', () => ({
  useParams: () => ({ marketId: mockMarketId }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/useMarkets', () => ({
  useOnChainMarket: () => mockOnChainMarket,
  useMarketCount: () => ({
    count: mockMarketCount,
    isLoading: mockCountLoading,
    isError: mockCountError,
  }),
  useAllOnChainMarkets: () => ({ markets: [], isLoading: false }),
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

beforeEach(() => {
  mockMarketCount = BigInt(2)
  mockCountLoading = false
  mockCountError = false
  mockOnChainMarket = { market: null, isLoading: false }
})

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

describe('MarketDetailPage — out-of-range / stuck-loading guards', () => {
  it('renders Market Not Found immediately when id >= marketCount (no spinner)', () => {
    mockMarketId = '9999999999'
    mockMarketCount = BigInt(2)
    // Even if the on-chain hook were stuck loading, the out-of-range gate
    // should fire MarketNotFound before we ever render the spinner.
    mockOnChainMarket = { market: null, isLoading: true, isError: false }
    render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    expect(screen.getByText('Market Not Found')).toBeTruthy()
    expect(screen.queryByLabelText('Loading market data')).toBeNull()
  })

  it('renders Market Not Found exactly at the boundary (id == marketCount)', () => {
    mockMarketId = '2'
    mockMarketCount = BigInt(2)
    mockOnChainMarket = { market: null, isLoading: true, isError: false }
    render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    expect(screen.getByText('Market Not Found')).toBeTruthy()
  })

  it('falls back to Market Not Found when fetch stays loading past the timeout', () => {
    vi.useFakeTimers()
    try {
      mockMarketId = '0'
      mockMarketCount = BigInt(2)
      mockOnChainMarket = { market: null, isLoading: true, isError: false }
      render(<TestWrapper><MarketDetailPage /></TestWrapper>)
      // Initially we should be in the loading state, not MarketNotFound.
      expect(screen.queryByText('Market Not Found')).toBeNull()
      // Advance past the 5s timeout — even if the hook is still "loading",
      // the mount-only timer should fire MarketNotFound.
      act(() => {
        vi.advanceTimersByTime(6_000)
      })
      expect(screen.getByText('Market Not Found')).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders Market Not Found when isError is true even while id is in range', () => {
    mockMarketId = '0'
    mockMarketCount = BigInt(2)
    mockOnChainMarket = { market: null, isLoading: false, isError: true }
    render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    expect(screen.getByText('Market Not Found')).toBeTruthy()
  })

  // Regression test for task 0018: a failed marketCount() read (anvil down,
  // MarketFactory reverted) must short-circuit to MarketNotFound immediately
  // rather than spinning until the 5s mount timer fires.
  it('renders Market Not Found immediately when useMarketCount errors (RPC down)', () => {
    mockMarketId = '0'
    mockMarketCount = BigInt(0)
    mockCountError = true
    // Even if the per-market hook is still "loading", the count error gate
    // should fire MarketNotFound first.
    mockOnChainMarket = { market: null, isLoading: true, isError: false }
    render(<TestWrapper><MarketDetailPage /></TestWrapper>)
    expect(screen.getByText('Market Not Found')).toBeTruthy()
    expect(screen.queryByLabelText('Loading market data')).toBeNull()
  })
})

afterEach(() => {
  vi.useRealTimers()
})
