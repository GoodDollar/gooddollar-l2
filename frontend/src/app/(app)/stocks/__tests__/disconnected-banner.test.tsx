import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type React from 'react'
import { TestWrapper } from '@/test-utils/wrapper'
import { DEVNET_CHAIN_ID } from '@/lib/devnet'

// Router push must never be called by the connect-wallet CTA.
const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

// Drive wallet state per test via a mutable object so we can simulate
// disconnected / wrong-chain / connected-on-devnet states.
const walletState: {
  address: `0x${string}` | undefined
  chainId: number | undefined
} = { address: undefined, chainId: undefined }

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => walletState,
  }
})

// ConnectButton.Custom is a render-prop. Stub it as a passthrough that
// injects spy openers we can assert against. Without this stub the real
// RainbowKit code would require a RainbowKitProvider mounted in tests.
const openConnectModal = vi.fn()
const openChainModal = vi.fn()
vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: {
        openConnectModal: () => void
        openChainModal: () => void
      }) => React.ReactNode
    }) => children({ openConnectModal, openChainModal }),
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

describe('StocksPage – connect-wallet CTA', () => {
  beforeEach(() => {
    push.mockReset()
    openConnectModal.mockReset()
    openChainModal.mockReset()
    walletState.address = undefined
    walletState.chainId = undefined
  })

  it('opens the RainbowKit connect modal when disconnected user taps the CTA', () => {
    walletState.address = undefined
    walletState.chainId = undefined

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const cta = screen.getByRole('button', { name: 'Connect Wallet to Trade Stocks' })
    fireEvent.click(cta)

    expect(openConnectModal).toHaveBeenCalledTimes(1)
    // Critical: must NOT navigate to a stock detail page (the previous misleading behavior).
    expect(push).not.toHaveBeenCalled()
  })

  it('hides the onboarding CTA once the wallet is connected on the canonical devnet chain', () => {
    walletState.address = '0x1111111111111111111111111111111111111111'
    walletState.chainId = DEVNET_CHAIN_ID

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(
      screen.queryByRole('button', { name: 'Connect Wallet to Trade Stocks' })
    ).not.toBeInTheDocument()
  })
})
