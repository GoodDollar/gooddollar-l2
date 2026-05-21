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
        ticker: 'MSFT',
        name: 'sMSFT',
        sector: 'Technology',
        description: 'Microsoft synthetic',
        price: 388.45,
        change24h: 0.9,
        volume24h: 22000000,
        marketCap: 2890000000000,
        high52w: 460,
        low52w: 260,
        sparkline7d: [380, 385, 390, 388, 389],
        peRatio: 35,
        eps: 11.2,
        dividendYield: 0.7,
        avgVolume: 30000000,
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
    ],
    isLoading: false,
    isLive: true,
  }),
}))

import StocksPage from '../page'

function getDesktopRows() {
  const table = screen.getByRole('table')
  return within(table).getAllByRole('row').slice(1)
}

describe('StocksPage sorting behavior', () => {
  it('reorders rows by volume and toggles direction on repeated clicks', async () => {
    walletState.address = undefined
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    let rows = getDesktopRows()
    expect(within(rows[0]).getByText('AAPL')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Volume/i }))
    rows = getDesktopRows()
    expect(within(rows[0]).getByText('NVDA')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Volume/i }))
    rows = getDesktopRows()
    expect(within(rows[0]).getByText('MSFT')).toBeInTheDocument()
  })

  it('keeps search and sort in sync for filtered results', async () => {
    walletState.address = undefined
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    await user.type(screen.getByPlaceholderText('Search stocks...'), 'AAPL')
    await user.click(screen.getByRole('button', { name: /Price/i }))
    await user.click(screen.getByRole('button', { name: /Price/i }))

    const rows = getDesktopRows()
    expect(rows).toHaveLength(1)
    expect(within(rows[0]).getByText('AAPL')).toBeInTheDocument()
  })
})
