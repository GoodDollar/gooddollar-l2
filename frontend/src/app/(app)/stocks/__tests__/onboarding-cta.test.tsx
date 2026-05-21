import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

const push = vi.fn()
const walletState = { address: undefined as `0x${string}` | undefined }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/stocks',
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

  it('keeps mobile row text constrained so ticker/meta does not collide with right-side pricing', () => {
    walletState.address = undefined

    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const tradeHint = screen.getByText('Tap to trade')
    const row = tradeHint.closest('div[class*="bg-dark-100"]')
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

  it('reserves right/bottom safe area on stocks markets page for floating feedback controls', () => {
    walletState.address = undefined

    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const wrapper = container.querySelector('div.w-full.max-w-5xl.mx-auto')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.className).toContain('pb-24')
    expect(wrapper?.className).toContain('md:pr-24')
  })

  it('uses mobile-first filter shell spacing for clearer top-viewport hierarchy', () => {
    walletState.address = undefined

    const { container } = render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>
    )

    const wrapper = container.querySelector('div.w-full.max-w-5xl.mx-auto')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.className).toContain('space-y-5')

    const searchInput = screen.getByPlaceholderText('Search stocks...')
    const filterShell = searchInput.closest('div.mb-4')
    expect(filterShell).toBeTruthy()
    expect(filterShell?.className).toContain('rounded-2xl')
    expect(filterShell?.className).toContain('bg-dark-100/35')
    expect(filterShell?.className).toContain('p-3')
  })
})
