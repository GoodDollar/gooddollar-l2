/**
 * featured-filter.test.tsx — Featured hero must respect the active filter
 * (task 0007d-0032).
 *
 * Before this fix, `selectFeaturedMarket` was fed the unfiltered
 * `visibleMarkets` set so the hero rendered a Crypto market even when
 * the user had selected `World Events` or `Culture` — both empty on
 * devnet today. The "No markets in <category> yet" empty state and a
 * "TRENDING · Crypto" hero appeared on the same screen.
 *
 * These tests pin the new behaviour: the hero is only fed markets that
 * match the active filter, so it disappears the moment the user
 * narrows to a category (or query) with zero matches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

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

// A small fixture matching today's devnet: one Crypto market, one
// AI & Tech market — and nothing in World Events or Culture. The
// `inferCategory` heuristic in `predict/page.tsx` keys off question
// substrings; we pick wording that maps unambiguously.
function mountWithMarkets() {
  vi.doMock('@/lib/useMarkets', () => ({
    useMarketCount: () => ({ count: BigInt(2), isLoading: false, isError: false }),
    useAllOnChainMarkets: () => ({
      markets: [
        // Crypto: "bitcoin" → Crypto via inferCategory
        mkOnChain(0, 'Will Bitcoin exceed $150,000 by end of 2026?', 0.55, BigInt(10_000) * BigInt(10) ** BigInt(18)),
        // AI & Tech: "openai" → AI & Tech
        mkOnChain(1, 'Will OpenAI release GPT-6 in 2026?', 0.42, BigInt(2_000) * BigInt(10) ** BigInt(18)),
      ],
      isLoading: false,
    }),
    useOnChainMarket: () => ({ market: null, isLoading: false }),
  }))
}

describe('PredictPage — featured hero respects the active filter (task 0032)', () => {
  beforeEach(() => {
    pushMock.mockClear()
    searchParamsString = ''
    vi.resetModules()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders FeaturedMarket when category is "All"', async () => {
    mountWithMarkets()
    const PredictPage = (await import('../page')).default
    render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )
    const hero = screen.getByTestId('predict-featured-market')
    expect(hero.textContent ?? '').toMatch(/Bitcoin exceed/i)
  })

  it('renders FeaturedMarket when category matches the featured market', async () => {
    searchParamsString = 'category=Crypto'
    mountWithMarkets()
    const PredictPage = (await import('../page')).default
    render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )
    const hero = screen.getByTestId('predict-featured-market')
    expect(hero.textContent ?? '').toMatch(/Bitcoin exceed/i)
  })

  it('does NOT render FeaturedMarket when the filter has no matching markets', async () => {
    searchParamsString = 'category=World+Events'
    mountWithMarkets()
    const PredictPage = (await import('../page')).default
    render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )
    expect(screen.queryByTestId('predict-featured-market')).toBeNull()
    // Empty-state copy specific to a single-category zero-match view.
    expect(screen.getByText(/no markets in/i).textContent ?? '').toMatch(/world events/i)
  })

  it('does NOT render FeaturedMarket when the search query has zero matches', async () => {
    searchParamsString = 'q=asdf-no-match-zzz'
    mountWithMarkets()
    const PredictPage = (await import('../page')).default
    render(
      <TestWrapper>
        <PredictPage />
      </TestWrapper>,
    )
    expect(screen.queryByTestId('predict-featured-market')).toBeNull()
    expect(screen.getByText(/no markets found/i)).toBeInTheDocument()
  })
})
