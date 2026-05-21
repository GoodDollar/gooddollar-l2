import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-utils/wrapper'

const push = vi.fn()
const walletState = { address: undefined as `0x${string}` | undefined }

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
        ticker: 'NVDA',
        name: 'sNVDA',
        sector: 'Technology',
        description: 'NVIDIA synthetic',
        price: 104.75,
        change24h: 3.2,
        volume24h: 310000000,
        marketCap: 2580000000000,
        high52w: 140,
        low52w: 39,
        sparkline7d: [95, 98, 101, 103, 105],
        peRatio: 64,
        eps: 1.8,
        dividendYield: 0.1,
        avgVolume: 78000000,
      },
      {
        ticker: 'JPM',
        name: 'sJPM',
        sector: 'Financials',
        description: 'JPM synthetic',
        price: 198.11,
        change24h: -0.4,
        volume24h: 42000000,
        marketCap: 570000000000,
        high52w: 220,
        low52w: 141,
        sparkline7d: [200, 201, 199, 198, 198],
        peRatio: 16,
        eps: 12.4,
        dividendYield: 1.9,
        avgVolume: 18000000,
      },
      {
        ticker: 'XOM',
        name: 'sXOM',
        sector: 'Energy',
        description: 'Exxon synthetic',
        price: 122.44,
        change24h: -2.8,
        volume24h: 28000000,
        marketCap: 520000000000,
        high52w: 130,
        low52w: 92,
        sparkline7d: [128, 126, 125, 123, 122],
        peRatio: 14,
        eps: 8.7,
        dividendYield: 3.2,
        avgVolume: 16000000,
      },
    ],
    isLoading: false,
    isLive: true,
  }),
}))

import StocksPage from '../page'

describe('StocksPage discovery modules', () => {
  it('renders movers, trending, and sector quick filters', () => {
    walletState.address = undefined

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(screen.getByText('Top Movers')).toBeInTheDocument()
    expect(screen.getByText('Trending')).toBeInTheDocument()
    expect(screen.getByTestId('stocks-sector-filters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Technology' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Energy' })).toBeInTheDocument()
  })

  it('applies sector filter to stocks list', async () => {
    walletState.address = undefined
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: 'Energy' }))

    const table = screen.getByRole('table')
    expect(within(table).queryByText('XOM')).toBeInTheDocument()
    expect(within(table).queryByText('AAPL')).not.toBeInTheDocument()
    expect(within(table).queryByText('NVDA')).not.toBeInTheDocument()
  })

  it('navigates to stock detail from discovery modules', async () => {
    walletState.address = undefined
    push.mockClear()
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const moversPanel = screen.getByText('Top Movers').closest('div')
    expect(moversPanel).toBeTruthy()
    await user.click(within(moversPanel as HTMLElement).getByRole('button', { name: /^NVDA/ }))
    expect(push).toHaveBeenCalledWith('/stocks/NVDA')
  })
})
