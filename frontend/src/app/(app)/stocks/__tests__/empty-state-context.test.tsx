import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-utils/wrapper'

const push = vi.fn()
const walletState = { address: undefined as `0x${string}` | undefined }
const watchlistState = { watchlist: [] as string[] }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => walletState,
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => unknown }) =>
      children({ openConnectModal: vi.fn() }),
  },
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({
    stocks: [
      {
        ticker: 'AAPL',
        name: 'sAAPL',
        sector: 'Technology',
        description: 'Apple synthetic',
        price: 218.27,
        change24h: 1.3,
        volume24h: 62000000,
        marketCap: 3340000000000,
        high52w: 260,
        low52w: 150,
        sparkline7d: [210, 212, 214, 216, 218],
        peRatio: 32,
        eps: 6.8,
        dividendYield: 0.5,
        avgVolume: 55000000,
      },
      {
        ticker: 'MSFT',
        name: 'sMSFT',
        sector: 'Technology',
        description: 'Microsoft synthetic',
        price: 388.45,
        change24h: 0.9,
        volume24h: 22000000,
        marketCap: 2890000000000,
        high52w: 420,
        low52w: 300,
        sparkline7d: [380, 382, 384, 386, 388],
        peRatio: 36,
        eps: 8.2,
        dividendYield: 0.7,
        avgVolume: 20000000,
      },
    ],
    isLoading: false,
    isLive: true,
  }),
}))

vi.mock('@/lib/useWatchlist', () => ({
  useWatchlist: () => ({
    watchlist: watchlistState.watchlist,
    isWatched: (ticker: string) => watchlistState.watchlist.includes(ticker.toUpperCase()),
  }),
}))

import StocksPage from '../page'

describe('StocksPage empty-state context', () => {
  beforeEach(() => {
    walletState.address = undefined
    watchlistState.watchlist = []
    push.mockReset()
  })

  it('shows search-aware empty copy for watchlist tab when a query filters to zero rows', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    await user.type(screen.getByPlaceholderText(/search stocks/i), 'AAPL')
    await user.click(screen.getByRole('tab', { name: /watchlist/i }))

    expect(screen.getAllByText(/No watchlist stocks match "AAPL"/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Your watchlist is empty/i)).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /clear search/i })[0])
    expect(screen.getAllByText(/Your watchlist is empty/i).length).toBeGreaterThan(0)
  })

  it('keeps generic no-match copy on all tab', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    await user.type(screen.getByPlaceholderText(/search stocks/i), 'ZZZZZ')
    expect(screen.getAllByText(/No stocks match your search/i).length).toBeGreaterThan(0)
  })
})
