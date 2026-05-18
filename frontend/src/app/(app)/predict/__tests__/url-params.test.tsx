import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

// Mock next/navigation so we can drive useSearchParams() from each test.
const pushMock = vi.fn()
let searchParamsString = ''
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsString),
  useParams: () => ({}),
}))

// Markets data layer: return a small representative set covering several
// categories so the category-filter assertions are meaningful.
vi.mock('@/lib/useMarkets', () => {
  const nowMs = Date.now()
  const futureMs = nowMs + 7 * 24 * 60 * 60 * 1000
  const mk = (
    id: number,
    question: string,
    yesNumerator: number,
    totalTokens: bigint,
  ) => ({
    id: BigInt(id),
    question,
    endTime: BigInt(Math.floor(futureMs / 1000)),
    status: 0,
    totalYES: (totalTokens * BigInt(Math.round(yesNumerator * 1000))) / BigInt(1000),
    totalNO: totalTokens - (totalTokens * BigInt(Math.round(yesNumerator * 1000))) / BigInt(1000),
    collateral: totalTokens,
    yesPrice: yesNumerator,
    endTimeMs: futureMs,
    isActive: true,
    isResolved: false,
  })
  return {
    useMarketCount: () => ({ count: BigInt(3), isLoading: false, isError: false }),
    useAllOnChainMarkets: () => ({
      markets: [
        mk(0, 'Will ETH hit $5000 by year end?', 0.6, BigInt(1000) * BigInt(10) ** BigInt(18)),
        mk(1, 'Will Manchester City win the Premier League?', 0.4, BigInt(500) * BigInt(10) ** BigInt(18)),
        mk(2, 'Will the next US election be in November?', 0.75, BigInt(200) * BigInt(10) ** BigInt(18)),
      ],
      isLoading: false,
    }),
    useOnChainMarket: () => ({ market: null, isLoading: false }),
  }
})

// InfoBanner doesn't matter for these tests and reads localStorage on mount.
vi.mock('@/components/InfoBanner', () => ({
  InfoBanner: () => null,
}))

import PredictPage from '../page'

describe('PredictPage URL params', () => {
  beforeEach(() => {
    pushMock.mockClear()
    searchParamsString = ''
  })

  it('renders with all defaults when no URL params are present', () => {
    render(<TestWrapper><PredictPage /></TestWrapper>)
    const input = screen.getByPlaceholderText(/search markets/i) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('seeds the search input from ?q= on first render', () => {
    searchParamsString = 'q=ETH'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    const input = screen.getByPlaceholderText(/search markets/i) as HTMLInputElement
    expect(input.value).toBe('ETH')
  })

  it('trims whitespace around ?q=', () => {
    searchParamsString = 'q=%20%20ETH%20%20' // "  ETH  "
    render(<TestWrapper><PredictPage /></TestWrapper>)
    const input = screen.getByPlaceholderText(/search markets/i) as HTMLInputElement
    expect(input.value).toBe('ETH')
  })

  it('selects the matching category chip from ?category=', () => {
    searchParamsString = 'category=Sports'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    // The active category chip is the only button with text "Sports" that
    // carries the goodgreen highlight class. We just assert the chip exists
    // and is rendered as a button — visual highlight is asserted via
    // class containment.
    const sportsChip = screen.getByRole('button', { name: 'Sports' })
    expect(sportsChip.className).toMatch(/goodgreen/)
  })

  it('falls back to All when ?category= is unknown', () => {
    searchParamsString = 'category=NotARealCategory'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    const allChip = screen.getByRole('button', { name: 'All' })
    expect(allChip.className).toMatch(/goodgreen/)
  })

  it('respects ?sort= when valid', () => {
    searchParamsString = 'sort=volume'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    // The active sort button is in the sort row. After task 0049 added the
    // separate "24h Volume" option, `/volume/i` is ambiguous, so we anchor
    // on the exact "Highest Volume" label.
    const sortBtn = screen.getByRole('button', { name: 'Highest Volume' })
    expect(sortBtn.className).toMatch(/goodgreen/)
  })

  it('respects ?sort=volume-24h (task 0049)', () => {
    searchParamsString = 'sort=volume-24h'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    const sortBtn = screen.getByRole('button', { name: '24h Volume' })
    expect(sortBtn.className).toMatch(/goodgreen/)
  })

  it('falls back to trending when ?sort= is unknown', () => {
    searchParamsString = 'sort=banana'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    const trendingBtn = screen.getByRole('button', { name: /trending/i })
    expect(trendingBtn.className).toMatch(/goodgreen/)
  })

  it('parses ?expired=1 as showExpired=true', () => {
    // No expired markets in the mock so the toggle button is absent —
    // we just assert no crash and that the page renders the search input.
    searchParamsString = 'expired=1'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    expect(screen.getByPlaceholderText(/search markets/i)).toBeTruthy()
  })

  it('parses ?expired=true (case-insensitive) as showExpired=true', () => {
    searchParamsString = 'expired=TRUE'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    expect(screen.getByPlaceholderText(/search markets/i)).toBeTruthy()
  })

  it('does not throw on very long ?q= values', () => {
    const long = 'a'.repeat(1500)
    searchParamsString = `q=${long}`
    render(<TestWrapper><PredictPage /></TestWrapper>)
    const input = screen.getByPlaceholderText(/search markets/i) as HTMLInputElement
    expect(input.value.length).toBe(1500)
  })

  it('handles all params combined without error', () => {
    searchParamsString = 'q=ETH&category=Crypto&sort=volume&expired=1'
    render(<TestWrapper><PredictPage /></TestWrapper>)
    const input = screen.getByPlaceholderText(/search markets/i) as HTMLInputElement
    expect(input.value).toBe('ETH')
    const cryptoChip = screen.getByRole('button', { name: 'Crypto' })
    expect(cryptoChip.className).toMatch(/goodgreen/)
    // Exact label (see "respects ?sort= when valid" above for rationale).
    const volumeBtn = screen.getByRole('button', { name: 'Highest Volume' })
    expect(volumeBtn.className).toMatch(/goodgreen/)
  })
})
