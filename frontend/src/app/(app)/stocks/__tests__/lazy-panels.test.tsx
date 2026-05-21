import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const walletState = { address: undefined as `0x${string}` | undefined }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/stocks',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, options?: { loading?: () => JSX.Element }) => {
    const Loading = options?.loading
    return function MockDynamic() {
      return Loading ? <Loading /> : null
    }
  },
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => walletState,
  }
})

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
    ],
    isLoading: false,
    isLive: true,
  }),
}))

import StocksPage from '../page'

describe('StocksPage deferred heavy panels', () => {
  it('renders loading placeholders for deferred market intelligence and rebalance panels', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    expect(screen.getByText('Loading market intelligence...')).toBeInTheDocument()
    expect(screen.getByText('Loading rebalance diagnostics...')).toBeInTheDocument()
  })
})
