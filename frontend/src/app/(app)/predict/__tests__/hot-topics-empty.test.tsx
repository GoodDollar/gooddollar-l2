/**
 * /predict — discovery sidebar must not tint resolved-only categories as
 * active hot markets (task 0015).
 *
 * Three regimes pinned here:
 *
 *   • All active → HOT TOPICS header with active counts only.
 *   • Mixed → HOT TOPICS shows only the categories with at least one
 *     active market. Resolved-only categories are excluded.
 *   • All resolved (today's end-of-cycle state) → HOT TOPICS widget is
 *     replaced by a RECENTLY RESOLVED widget whose rows link to
 *     `/predict?view=archive&category=…` (not into the empty
 *     active-filter view).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'
import { PredictDiscoverySidebar } from '@/components/predict/PredictDiscoverySidebar'
import type { PredictionMarket } from '@/lib/predictData'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

function mkMarket(overrides: Partial<PredictionMarket> = {}): PredictionMarket {
  return {
    id: overrides.id ?? '0',
    question: 'Will X happen?',
    category: 'Crypto',
    yesPrice: 0.5,
    volume: 0,
    liquidity: 100,
    endDate: futureDate,
    resolved: false,
    resolutionSource: 'test',
    createdAt: '2026-01-01',
    totalShares: 100,
    ...overrides,
  }
}

describe('PredictDiscoverySidebar — hot-topics regime A: all active', () => {
  const markets: PredictionMarket[] = [
    mkMarket({ id: '1', category: 'Crypto', volume: 100 }),
    mkMarket({ id: '2', category: 'Politics', volume: 200 }),
    mkMarket({ id: '3', category: 'Sports', volume: 50 }),
    mkMarket({ id: '4', category: 'Culture', volume: 80 }),
  ]

  it('renders the HOT TOPICS widget with one row per active category', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={markets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    const hotTopics = screen.getByTestId('hot-topics-widget')
    expect(within(hotTopics).getAllByRole('listitem').length).toBe(4)
    expect(screen.queryByTestId('recently-resolved-widget')).not.toBeInTheDocument()
  })

  it('rows are buttons that fire onCategorySelect when clicked', () => {
    const onCategorySelect = vi.fn()
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={markets} onCategorySelect={onCategorySelect} />
      </TestWrapper>,
    )
    const hotTopics = screen.getByTestId('hot-topics-widget')
    const buttons = within(hotTopics).getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    fireEvent.click(buttons[0])
    expect(onCategorySelect).toHaveBeenCalledTimes(1)
  })
})

describe('PredictDiscoverySidebar — hot-topics regime B: mixed active + resolved', () => {
  const markets: PredictionMarket[] = [
    mkMarket({ id: '1', category: 'Politics', volume: 200 }),
    mkMarket({ id: '2', category: 'Culture', volume: 1000, endDate: pastDate }),
    mkMarket({ id: '3', category: 'Culture', volume: 500, endDate: pastDate }),
  ]

  it('HOT TOPICS shows only the active categories — resolved-only Culture is excluded', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={markets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    const hotTopics = screen.getByTestId('hot-topics-widget')
    expect(within(hotTopics).getAllByRole('listitem').length).toBe(1)
    expect(within(hotTopics).getByText('Politics')).toBeInTheDocument()
    expect(within(hotTopics).queryByText('Culture')).not.toBeInTheDocument()
    expect(screen.queryByTestId('recently-resolved-widget')).not.toBeInTheDocument()
  })
})

describe('PredictDiscoverySidebar — hot-topics regime C: all resolved (end-of-cycle)', () => {
  const markets: PredictionMarket[] = [
    mkMarket({ id: '10', category: 'Culture', volume: 1000, endDate: pastDate }),
    mkMarket({ id: '11', category: 'Politics', volume: 500, endDate: pastDate }),
    mkMarket({ id: '12', category: 'Sports', volume: 200, endDate: pastDate }),
  ]

  it('replaces HOT TOPICS with a RECENTLY RESOLVED widget — no active hot-topics row remains', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={markets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    expect(screen.queryByTestId('hot-topics-widget')).not.toBeInTheDocument()
    expect(screen.getByTestId('recently-resolved-widget')).toBeInTheDocument()
  })

  it('each resolved row is a link to /predict?view=archive&category=… (lands in the archive, not the empty filter)', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={markets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    const resolved = screen.getByTestId('recently-resolved-widget')
    const links = within(resolved).getAllByRole('link')
    expect(links.length).toBe(3)
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/predict?view=archive&category=Culture')
    expect(hrefs).toContain('/predict?view=archive&category=Politics')
    expect(hrefs).toContain('/predict?view=archive&category=Sports')
  })

  it('does not call onCategorySelect when a resolved row is clicked (archive nav, not active filter)', () => {
    const onCategorySelect = vi.fn()
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={markets} onCategorySelect={onCategorySelect} />
      </TestWrapper>,
    )
    const resolved = screen.getByTestId('recently-resolved-widget')
    const links = within(resolved).getAllByRole('link')
    fireEvent.click(links[0])
    expect(onCategorySelect).not.toHaveBeenCalled()
  })

  it('uses gray-tinted treatment to signal "not an active hot market" affordance', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={markets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    const resolved = screen.getByTestId('recently-resolved-widget')
    const links = within(resolved).getAllByRole('link')
    for (const link of links) {
      expect(link.className).toMatch(/text-gray-/)
      expect(link.className).not.toMatch(/text-goodgreen|text-orange/)
    }
  })
})
