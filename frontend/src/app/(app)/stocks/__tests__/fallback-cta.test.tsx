import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const push = vi.fn()
const walletState = { address: undefined as `0x${string}` | undefined }
const stocksState = { isLive: true }

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

const stockFixture = {
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
}

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({
    stocks: [stockFixture],
    isLoading: false,
    isLive: stocksState.isLive,
  }),
}))

// Import after vi.mock declarations
import StocksPage from '../page'

describe('StocksPage CTA state honors oracle isLive', () => {
  it('shows demo-mode hero and Preview-style CTA when oracle is NOT live and wallet disconnected', () => {
    walletState.address = undefined
    stocksState.isLive = false

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    // Hero should NOT advertise live trading
    expect(screen.queryByRole('button', { name: 'Connect Wallet to Trade Stocks' })).not.toBeInTheDocument()
    // Hero should advertise demo preview
    expect(screen.getByRole('button', { name: /preview stocks demo/i })).toBeInTheDocument()
    expect(screen.getByText(/Stocks Oracle in Demo Mode/i)).toBeInTheDocument()

    // Desktop per-row CTA: "Preview" with adjacent "Demo" chip — NO bare "Trade" button
    expect(screen.queryByRole('button', { name: 'Trade' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Preview AAPL — demo data/ })).toBeInTheDocument()

    // Mobile card affordance: "Tap to preview" + "Demo" chip, NOT "Tap to trade"
    expect(screen.queryByText('Tap to trade')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Demo data — preview only/i)).toBeInTheDocument()
  })

  it('shows live-trade hero and Trade CTAs when oracle IS live and wallet disconnected', () => {
    walletState.address = undefined
    stocksState.isLive = true

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: 'Connect Wallet to Trade Stocks' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /preview stocks demo/i })).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Trade' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Preview AAPL — demo data/ })).not.toBeInTheDocument()

    expect(screen.getByText('Tap to trade')).toBeInTheDocument()
  })

  it('does NOT show the hero CTA when wallet is connected, regardless of isLive', () => {
    walletState.address = '0x1111111111111111111111111111111111111111'
    stocksState.isLive = false

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(screen.queryByRole('button', { name: 'Connect Wallet to Trade Stocks' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /preview stocks demo/i })).not.toBeInTheDocument()

    // Per-row CTAs still honor isLive even when wallet connected
    expect(screen.queryByRole('button', { name: 'Trade' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Preview AAPL — demo data/ })).toBeInTheDocument()
  })
})
