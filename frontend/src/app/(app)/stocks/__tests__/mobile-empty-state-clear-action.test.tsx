import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
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

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal: () => {}, openChainModal: () => {} }),
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
    ],
    isLoading: false,
    isLive: true,
  }),
}))

import StocksPage from '../page'

describe('StocksPage mobile empty-state clear action', () => {
  it('shows a dedicated "Clear search" action and restores results after tap', async () => {
    walletState.address = undefined
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const search = screen.getByPlaceholderText('Search stocks...')
    await user.type(search, 'no-match-query')

    const clearSearch = screen.getByRole('button', { name: 'Clear search' })
    expect(clearSearch).toBeInTheDocument()
    await user.click(clearSearch)

    expect(search).toHaveValue('')
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0)
  })
})
