import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

// Mock next/navigation so PredictPage can mount during tests.
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

const futureMs = Date.now() + 30 * 24 * 60 * 60 * 1000

function mkOnChain(
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

describe('PredictPage — featured hero contradictory data guards (task 0074)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    searchParamsString = ''
    vi.resetModules()
  })

  it('suppresses Live/Trending badges and the synthetic sparkline when the featured market has zero volume', async () => {
    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(1), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          // Degenerate seed market — zero volume, zero yesPrice.
          mkOnChain(0, 'Will BTC hit $100K by 2026?', 0, BigInt(0)),
        ],
        isLoading: false,
      }),
      useOnChainMarket: () => ({ market: null, isLoading: false }),
    }))

    const PredictPage = (await import('../page')).default
    const { container } = render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )

    // The hero still mounts and shows the market question (something must
    // be at the top of the page).
    expect(screen.getAllByText(/BTC hit \$100K/i).length).toBeGreaterThan(0)

    // CRITICAL: do NOT advertise this degenerate market as Live or Trending.
    // Scope to the featured hero region so we ignore badges that may appear
    // elsewhere (e.g. on legitimate active markets in the grid).
    const heroEl = screen.getByRole('button', { name: /^Featured:/ })
    expect(within(heroEl).queryByText('Live')).toBeNull()
    expect(within(heroEl).queryByText(/^Trending$/i)).toBeNull()

    // A "No trades yet" / cold-start label should appear instead.
    expect(within(heroEl).getByText(/no trades yet/i)).toBeInTheDocument()

    // The synthetic sparkline (an inline SVG polyline) must not render in
    // the hero when there's no real history.
    const heroSvgs = heroEl.querySelectorAll('svg polyline')
    expect(heroSvgs.length).toBe(0)
  })

  it('still renders the sparkline, Live, and Trending badges when the featured market has real volume', async () => {
    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(2), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mkOnChain(0, 'Will BTC hit $100K by 2026?', 0, BigInt(0)),
          // Real activity: non-zero yesPrice + non-zero volume.
          mkOnChain(1, 'Will Ethereum hit $10K?', 0.42, BigInt(50_000) * BigInt(10) ** BigInt(18)),
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

    const heroEl = screen.getByRole('button', { name: /^Featured:/ })
    // The non-degenerate Ethereum market should win selection.
    expect(within(heroEl).getByText(/Ethereum hit \$10K/i)).toBeInTheDocument()
    // Real-activity badges remain.
    expect(within(heroEl).getByText('Live')).toBeInTheDocument()
    expect(within(heroEl).getByText(/^Trending$/i)).toBeInTheDocument()
    // Sparkline polyline renders for a market with real activity.
    expect(heroEl.querySelectorAll('svg polyline').length).toBeGreaterThan(0)
  })

  it('selectFeaturedMarket prefers the non-degenerate market over a zero-volume seed market', async () => {
    // This is the exact production scenario: the BTC seed market appears
    // first in the on-chain list but has 0 volume and 0 yesPrice, while a
    // second market has real activity. The hero must pick the second one.
    vi.doMock('@/lib/useMarkets', () => ({
      useMarketCount: () => ({ count: BigInt(2), isLoading: false, isError: false }),
      useAllOnChainMarkets: () => ({
        markets: [
          mkOnChain(0, 'Will BTC hit $100K by 2026?', 0, BigInt(0)),
          mkOnChain(1, 'Will Manchester City win the Premier League?', 0.45, BigInt(2_000) * BigInt(10) ** BigInt(18)),
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

    const heroEl = screen.getByRole('button', { name: /^Featured:/ })
    expect(within(heroEl).getByText(/Manchester City/i)).toBeInTheDocument()
    expect(within(heroEl).queryByText(/BTC hit \$100K/i)).toBeNull()
  })
})
