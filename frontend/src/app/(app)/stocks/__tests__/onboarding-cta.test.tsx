import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    ],
    isLoading: false,
    isLive: true,
  }),
}))

import StocksPage from '../page'

describe('StocksPage onboarding CTA', () => {
  it('shows first-time onboarding CTA when wallet is disconnected', () => {
    walletState.address = undefined

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: 'Connect Wallet to Trade Stocks' })).toBeInTheDocument()
    expect(screen.getByText('Tap to trade')).toBeInTheDocument()
  })

  it('hides first-time onboarding CTA when wallet is connected', () => {
    walletState.address = '0x1111111111111111111111111111111111111111'

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(screen.queryByText('Connect Wallet to Trade Stocks')).not.toBeInTheDocument()
  })
})
