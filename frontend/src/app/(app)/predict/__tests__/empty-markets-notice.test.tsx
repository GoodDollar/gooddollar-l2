import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

// Mock next/navigation so we can drive useSearchParams() without a real router.
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

const futureMs = Date.now() + 7 * 24 * 60 * 60 * 1000
const pastMs = Date.now() - 7 * 24 * 60 * 60 * 1000

function mkActive(id: number, question: string, yesNumerator: number, totalTokens: bigint) {
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

function mkExpired(id: number, question: string, yesNumerator: number, totalTokens: bigint) {
  return {
    id: BigInt(id),
    question,
    endTime: BigInt(Math.floor(pastMs / 1000)),
    status: 1,
    totalYES: (totalTokens * BigInt(Math.round(yesNumerator * 1000))) / BigInt(1000),
    totalNO: totalTokens - (totalTokens * BigInt(Math.round(yesNumerator * 1000))) / BigInt(1000),
    collateral: totalTokens,
    yesPrice: yesNumerator,
    endTimeMs: pastMs,
    isActive: false,
    isResolved: false,
  }
}

describe('PredictPage — EmptyMarketsNotice when only expired markets exist (task 0061)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    searchParamsString = ''
    vi.resetModules()
    // scrollIntoView is not implemented in jsdom.
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('shows the "only-expired" notice when there are zero active markets but expired markets exist', async () => {
    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(2), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mkExpired(0, 'Will BTC hit $100K by 2026?', 0.62, BigInt(10_000) * BigInt(10) ** BigInt(18)),
          mkExpired(1, 'Will Manchester City win?', 0.4, BigInt(500) * BigInt(10) ** BigInt(18)),
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

    const notice = screen.getByTestId('predict-empty-markets-notice')
    expect(notice).toBeTruthy()
    expect(notice.textContent ?? '').toMatch(/all current markets have resolved/i)
    // "Browse archive →" button should be available.
    expect(screen.getByRole('button', { name: /browse archive/i })).toBeTruthy()
  })

  it('shows the "filter-no-active" notice when a search filter is active with no featured hero', async () => {
    // Seed a search filter; the only markets in the dataset are expired, so
    // `featured` is null and the dead-zone guard renders in `filter-no-active`
    // mode (variant chosen by `query.trim() !== '' || category !== 'All'`).
    searchParamsString = 'q=BTC'

    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(2), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mkExpired(0, 'Will BTC hit $100K by 2026?', 0.62, BigInt(10_000) * BigInt(10) ** BigInt(18)),
          mkExpired(1, 'Will Manchester City win the Premier League?', 0.4, BigInt(500) * BigInt(10) ** BigInt(18)),
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

    const notice = screen.getByTestId('predict-empty-markets-notice')
    expect(notice).toBeTruthy()
    expect(notice.textContent ?? '').toMatch(/no active markets match your filter/i)

    // Both action buttons should be present.
    expect(screen.getByRole('button', { name: /browse archive/i })).toBeTruthy()
    const clearBtn = screen.getByRole('button', { name: /clear filters/i })
    expect(clearBtn).toBeTruthy()

    // Clearing filters should reset the search input.
    fireEvent.click(clearBtn)
    const input = screen.getByPlaceholderText(/search markets/i) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('does NOT show the EmptyMarketsNotice when active markets are present', async () => {
    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(2), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mkActive(0, 'Will BTC hit $100K by 2026?', 0.62, BigInt(10_000) * BigInt(10) ** BigInt(18)),
          mkExpired(1, 'Will Manchester City win?', 0.4, BigInt(500) * BigInt(10) ** BigInt(18)),
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

    expect(screen.queryByTestId('predict-empty-markets-notice')).toBeNull()
  })

  it('does NOT show the EmptyMarketsNotice when there are no expired markets either', async () => {
    searchParamsString = 'q=nothing-matches-xyz'

    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(1), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mkActive(0, 'Will BTC hit $100K by 2026?', 0.62, BigInt(10_000) * BigInt(10) ** BigInt(18)),
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

    expect(screen.queryByTestId('predict-empty-markets-notice')).toBeNull()
  })

  it('"Browse archive →" expands the expired section', async () => {
    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(2), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mkExpired(0, 'Will BTC hit $100K?', 0.62, BigInt(10_000) * BigInt(10) ** BigInt(18)),
          mkExpired(1, 'Will Lakers win?', 0.4, BigInt(500) * BigInt(10) ** BigInt(18)),
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

    // Before clicking: the "Show expired (N)" toggle is collapsed.
    const toggle = screen.getByRole('button', { name: /show expired \(\d+\)/i })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: /browse archive/i }))

    // After clicking the notice's "Browse archive" button, the toggle should be expanded.
    const expandedToggle = screen.getByRole('button', { name: /hide expired/i })
    expect(expandedToggle.getAttribute('aria-expanded')).toBe('true')
  })
})
