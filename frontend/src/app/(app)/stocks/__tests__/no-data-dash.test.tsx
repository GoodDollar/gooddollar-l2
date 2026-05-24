/**
 * Browse table — "no data" cells render as em-dash, not literal 0.
 *
 * Lane 4 promise: any field with no live signal renders `—`, never a
 * silent `0` / `+0.00%` / `$0` that conflates "we don't know" with
 * "genuinely zero".
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type React from 'react'
import { TestWrapper } from '@/test-utils/wrapper'

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList))
})

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/stocks',
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ address: '0x1111111111111111111111111111111111111111', chainId: 42220 }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal: vi.fn(), openChainModal: vi.fn() }),
  },
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({
    // Seed-only path: price is present (chain seed) but every other field
    // is the "no data" sentinel 0. Without the fix this would render
    // +0.00% / $0 / $0 in green; with the fix all three should be em-dash.
    stocks: [
      {
        ticker: 'AAPL', name: 'Apple', sector: 'Technology', description: 'Apple synthetic',
        price: 218.27, change24h: 0, volume24h: 0, marketCap: 0,
        high52w: 0, low52w: 0, sparkline7d: [210, 212, 214, 216, 218],
        peRatio: 0, eps: 0, dividendYield: 0, avgVolume: 0,
      },
    ],
    isLoading: false,
    isLive: false,
  }),
}))

vi.mock('@/lib/useStockPrices', () => ({
  useStockPrices: () => ({
    prices: { AAPL: 218.27 },
    sources: { AAPL: 'chain-oracle' as const },
    hasLiveData: true,
    isLoading: false,
    isPartial: false,
    isFallback: false,
    missingSymbols: [],
  }),
}))

vi.mock('@/lib/usePriceServiceStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/usePriceServiceStatus')>()
  return {
    ...actual,
    usePriceServiceStatus: () => ({
      status: null,
      isLoading: false,
      error: null,
      nextRetryAt: null,
    }),
  }
})

vi.mock('@/lib/useStocksRebalanceStatus', () => ({
  useStocksRebalanceStatus: () => ({
    data: [],
    isLoading: false,
    error: null,
    bySymbol: {},
  }),
}))

vi.mock('@/lib/useStockWatchlist', () => ({
  useStockWatchlist: () => ({
    favorites: new Set(),
    toggleFavorite: vi.fn(),
    isFavorite: () => false,
  }),
}))

import StocksPage from '../page'

describe('StocksPage — no-data fields render as em-dash, not literal 0', () => {
  beforeEach(() => {
    push.mockReset()
  })

  it('does not render "+0.00%" in any row when 24h change source has no data', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    // The "+0.00%" string was the symptom: the seed used 0 as a "no oracle
    // update" sentinel and rendered it the same as a real flat day.
    expect(screen.queryAllByText('+0.00%').length).toBe(0)
  })

  it('renders at least one em-dash placeholder for no-data fields', () => {
    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    // Several cells (24h change, volume, market cap) should now be —.
    const dashes = within(container).getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})
