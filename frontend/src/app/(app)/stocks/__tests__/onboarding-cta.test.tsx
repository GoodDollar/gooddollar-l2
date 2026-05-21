import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-utils/wrapper'
import { STOCKS_ONBOARDING_PROGRESS_KEY } from '@/lib/stocksOnboardingProgress'

const push = vi.fn()
const scrollIntoView = vi.fn()
const walletState = { address: undefined as `0x${string}` | undefined }

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: scrollIntoView,
  writable: true,
})

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
  it('shows shared disconnected journey checklist on markets', async () => {
    walletState.address = undefined

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(await screen.findByTestId('stocks-onboarding-checklist')).toBeInTheDocument()
    expect(screen.getByText('Explore markets')).toBeInTheDocument()
    expect(screen.getByText('Open stock detail')).toBeInTheDocument()
    expect(screen.getByText('Connect wallet and place first order')).toBeInTheDocument()
  })

  it('shows first-time onboarding CTA when wallet is disconnected', async () => {
    walletState.address = undefined

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(await screen.findByRole('button', { name: 'Connect with In-browser Wallet' })).toBeInTheDocument()
    expect(screen.getByText(/Mobile wallet QR connections are temporarily unavailable/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue in Read-only Mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'More connection options' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try Another Connector' })).not.toBeInTheDocument()
    expect(screen.getByText('Tap to trade')).toBeInTheDocument()
  })

  it('reveals non-primary connector actions only after expanding options', async () => {
    walletState.address = undefined
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    await user.click(await screen.findByRole('button', { name: 'More connection options' }))
    expect(screen.getByRole('button', { name: 'Try Another Connector' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide connection options' })).toBeInTheDocument()
  })

  it('renders explicit three-step first-time journey copy in the hero card', async () => {
    walletState.address = undefined

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    expect(await screen.findByText('How to start')).toBeInTheDocument()
    expect(screen.getByText('1. Connect wallet')).toBeInTheDocument()
    expect(screen.getByText('2. Choose a stock')).toBeInTheDocument()
    expect(screen.getByText('3. Place your first trade')).toBeInTheDocument()
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

  it('keeps mobile row text constrained so ticker/meta does not collide with right-side pricing', () => {
    walletState.address = undefined

    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const tapBadge = screen.getByText('Tap to trade')
    const row = tapBadge.closest('div[class*="bg-dark-100"]')
    expect(row).toBeTruthy()

    const rightColumn = row?.querySelector('div.text-right')
    expect(rightColumn?.className).toContain('w-[96px]')
    expect(rightColumn?.className).toContain('shrink-0')

    const price = screen.getAllByText('$218.27')[0]
    expect(price.className).toContain('whitespace-nowrap')

    const name = screen.getAllByText('sAAPL')[0]
    expect(name.className).toContain('max-w-[84px]')

    // Ensure rendered "Tap to trade" badge still exists in constrained layout.
    expect(container.textContent).toContain('Tap to trade')
  })

  it('keeps desktop Trade action visible without hover-only gating', () => {
    walletState.address = undefined

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const tradeButton = screen.getByRole('button', { name: 'Trade' })
    expect(tradeButton).toBeInTheDocument()
    expect(tradeButton.className).not.toContain('sm:opacity-0')
    expect(tradeButton.className).not.toContain('group-hover:opacity-100')
  })

  it('marks stock-detail step in session progress when Trade is selected', async () => {
    walletState.address = undefined
    push.mockClear()
    window.sessionStorage.clear()
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: 'Trade' }))
    const progressRaw = window.sessionStorage.getItem(STOCKS_ONBOARDING_PROGRESS_KEY)
    expect(progressRaw).toBeTruthy()
    const progress = JSON.parse(progressRaw || '{}')
    expect(progress.openedStockDetail).toBe(true)
    expect(push).toHaveBeenCalledWith('/stocks/AAPL')
  })

  it('keeps read-only CTA in browse context when wallet connect is unavailable', async () => {
    walletState.address = undefined
    push.mockClear()
    scrollIntoView.mockClear()
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    await user.click(await screen.findByRole('button', { name: 'Continue in Read-only Mode' }))

    expect(push).not.toHaveBeenCalled()
    expect(scrollIntoView).toHaveBeenCalled()
    expect(screen.getByPlaceholderText('Search stocks...')).toHaveFocus()
  })
})
