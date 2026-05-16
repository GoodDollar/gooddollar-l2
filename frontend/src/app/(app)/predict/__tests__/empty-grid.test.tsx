import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

// Mock next/navigation so we can drive useSearchParams() and inspect router calls.
const pushMock = vi.fn()
let searchParamsString = ''
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(searchParamsString),
  useParams: () => ({}),
}))

vi.mock('@/components/InfoBanner', () => ({
  InfoBanner: () => null,
}))

// Helper to build an on-chain market shape that matches useMarkets's contract.
const futureMs = Date.now() + 7 * 24 * 60 * 60 * 1000
function mk(
  id: number,
  question: string,
  yesNumerator: number,
  totalTokens: bigint,
) {
  return {
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
  }
}

describe('PredictPage — empty grid when featured is the only match (task 0072)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    searchParamsString = ''
    vi.resetModules()
  })

  it('renders a helpful "only one market" notice when the on-chain set has exactly one active market', async () => {
    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(1), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mk(0, 'Will BTC hit $100K by 2026?', 0.62, BigInt(1000) * BigInt(10) ** BigInt(18)),
        ],
        isLoading: false,
      }),
      useOnChainMarket: () => ({ market: null, isLoading: false }),
    }))

    const PredictPage = (await import('../page')).default
    render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )

    // Featured hero must still render its question.
    expect(screen.getAllByText(/BTC hit \$100K/i).length).toBeGreaterThan(0)

    // The helpful notice replaces what would otherwise be a blank area.
    expect(screen.getByTestId('predict-only-featured-notice')).toBeTruthy()
    expect(screen.getByText(/only active market/i)).toBeTruthy()

    // Critically: do NOT show "No markets found" (we have one — the featured).
    expect(screen.queryByText(/no markets found/i)).toBeNull()
  })

  it('renders a "filter narrowed" notice with a Clear filter button when search/category narrows to only the featured market', async () => {
    // Seed a search query so the filter is active on mount.
    searchParamsString = 'q=BTC'

    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(3), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          // Highest volume → selectFeaturedMarket picks this one.
          mk(0, 'Will BTC hit $100K by 2026?', 0.62, BigInt(10_000) * BigInt(10) ** BigInt(18)),
          mk(1, 'Will Manchester City win the Premier League?', 0.4, BigInt(500) * BigInt(10) ** BigInt(18)),
          mk(2, 'Will the next US election be in November?', 0.75, BigInt(200) * BigInt(10) ** BigInt(18)),
        ],
        isLoading: false,
      }),
      useOnChainMarket: () => ({ market: null, isLoading: false }),
    }))

    const PredictPage = (await import('../page')).default
    render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )

    // The notice should appear, and it should be the "filter narrowed" variant.
    const notice = screen.getByTestId('predict-only-featured-notice')
    expect(notice).toBeTruthy()
    expect(notice.textContent ?? '').toMatch(/filter/i)

    // Clear filter button resets the search input.
    const clearBtn = screen.getByRole('button', { name: /clear filter/i })
    fireEvent.click(clearBtn)

    // After clearing, the search input should be empty.
    const input = screen.getByPlaceholderText(/search markets/i) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('still shows the existing "No markets found" empty state when filtered.length === 0', async () => {
    searchParamsString = 'q=nothing-matches-this-query-xyz'

    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(2), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mk(0, 'Will BTC hit $100K by 2026?', 0.62, BigInt(10_000) * BigInt(10) ** BigInt(18)),
          mk(1, 'Will Manchester City win the Premier League?', 0.4, BigInt(500) * BigInt(10) ** BigInt(18)),
        ],
        isLoading: false,
      }),
      useOnChainMarket: () => ({ market: null, isLoading: false }),
    }))

    const PredictPage = (await import('../page')).default
    render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )

    expect(screen.getByText(/no markets found/i)).toBeTruthy()
    // The "only featured" notice must NOT be present in this case.
    expect(screen.queryByTestId('predict-only-featured-notice')).toBeNull()
  })

  it('does NOT render the notice when there are other active markets beside the featured one', async () => {
    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(3), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mk(0, 'Will BTC hit $100K by 2026?', 0.62, BigInt(10_000) * BigInt(10) ** BigInt(18)),
          mk(1, 'Will Manchester City win the Premier League?', 0.4, BigInt(500) * BigInt(10) ** BigInt(18)),
          mk(2, 'Will the next US election be in November?', 0.75, BigInt(200) * BigInt(10) ** BigInt(18)),
        ],
        isLoading: false,
      }),
      useOnChainMarket: () => ({ market: null, isLoading: false }),
    }))

    const PredictPage = (await import('../page')).default
    render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )

    expect(screen.queryByTestId('predict-only-featured-notice')).toBeNull()
    // We expect the grid to render the non-featured markets.
    expect(screen.getAllByText(/Manchester City|US election/i).length).toBeGreaterThan(0)
  })
})
