/**
 * Task 0022: /stocks hero MUST NOT render both "Market Closed" and
 * "Trade synthetic equities 24/7" in the same viewport. The shared
 * `useSyntheticStockHeader` helper composes a single non-contradicting
 * pill + subhead pair.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type React from 'react'
import { TestWrapper } from '@/test-utils/wrapper'

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList))
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/stocks',
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ address: undefined, chainId: 42220 }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (args: { openConnectModal: () => void; openChainModal: () => void }) => React.ReactNode
    }) => children({ openConnectModal: vi.fn(), openChainModal: vi.fn() }),
  },
}))

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({ stocks: [], isLoading: false, isLive: true }),
}))

vi.mock('@/lib/useStocksRebalanceStatus', () => ({
  useStocksRebalanceStatus: () => ({ data: [], isLoading: false, error: null, bySymbol: {} }),
}))

vi.mock('@/lib/useStockWatchlist', () => ({
  useStockWatchlist: () => ({ favorites: new Set(), toggleFavorite: vi.fn(), isFavorite: () => false }),
}))

vi.mock('@/lib/marketHours', () => ({
  getMarketSession: vi.fn(),
}))

import { getMarketSession } from '@/lib/marketHours'
import StocksPage from '@/app/(app)/stocks/page'

describe('Stocks hero — synthetic vs underlying (task 0022)', () => {
  beforeEach(() => {
    vi.mocked(getMarketSession).mockReset()
  })

  it('weekend / closed: hero says "Synthetic · trade 24/7", not "Market Closed"', () => {
    vi.mocked(getMarketSession).mockReturnValue({
      label: 'Market Closed',
      state: 'closed',
      color: 'text-gray-400',
      dotColor: 'bg-gray-400',
      nextEventLabel: 'Opens Mon',
      nextEventDate: null,
    })

    const { container } = render(<TestWrapper><StocksPage /></TestWrapper>)
    const pill = screen.getByTestId('synthetic-stock-header-badge')
    expect(pill).toHaveTextContent('Synthetic · trade 24/7')
    expect(pill.textContent).not.toMatch(/Market Closed/)

    const subhead = screen.getByTestId('stocks-hero-subhead')
    expect(subhead.textContent).toMatch(/24\/7/i)
    expect(subhead.textContent).toMatch(/underlying/i)

    // Spot-check no rogue bare "Market Closed · Opens Mon" pill anywhere
    // in the hero (it would defeat the whole point of the task).
    const heroChunk = container.querySelector('.mb-5, .sm\\:mb-6') ?? container
    expect(heroChunk.textContent).not.toMatch(/Market Closed · Opens Mon/)
  })

  it('open: hero says "Live · oracle ticking" and does not mention Mon', () => {
    vi.mocked(getMarketSession).mockReturnValue({
      label: 'Market Open',
      state: 'open',
      color: 'text-green-400',
      dotColor: 'bg-green-400',
      nextEventLabel: 'Closes 4:00 PM ET',
      nextEventDate: null,
    })

    render(<TestWrapper><StocksPage /></TestWrapper>)
    const pill = screen.getByTestId('synthetic-stock-header-badge')
    expect(pill).toHaveTextContent('Live · oracle ticking')

    const subhead = screen.getByTestId('stocks-hero-subhead')
    expect(subhead.textContent).toMatch(/oracle is publishing live prices/i)
    expect(subhead.textContent).not.toMatch(/until Mon/i)
  })
})
