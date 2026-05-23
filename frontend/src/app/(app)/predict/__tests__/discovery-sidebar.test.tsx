/**
 * discovery-sidebar.test.tsx — Component tests for `PredictDiscoverySidebar`
 * (task 0048).
 *
 * The sidebar is rendered as a sibling of the market grid on the Predict
 * page. It is stateless and renders over two pure selectors that have
 * their own unit tests in `frontend/src/lib/__tests__/predictDiscovery.test.ts`.
 *
 * These tests focus on the wiring and accessibility contract that the
 * page relies on:
 *
 *  - Sample markets render the right number of rows for each widget.
 *  - Each clickable row exposes the correct ARIA role so the page works
 *    with keyboard navigation and screen readers.
 *  - The hot-topics rows invoke `onCategorySelect` with the right
 *    category when clicked (the page wires this to its own
 *    `setCategory` state).
 *  - Empty markets array shows a graceful "Nothing trending yet"
 *    inline empty state, not a blank panel.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'
import { PredictDiscoverySidebar } from '@/components/predict/PredictDiscoverySidebar'
import type { PredictionMarket, MarketCategory } from '@/lib/predictData'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}))

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()

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

describe('PredictDiscoverySidebar', () => {
  const sampleMarkets: PredictionMarket[] = [
    mkMarket({
      id: '1',
      question: 'Will BTC hit $100K?',
      category: 'Crypto',
      yesPrice: 0.52,
      volume: 10_000,
    }),
    mkMarket({
      id: '2',
      question: 'Will Trump win 2028?',
      category: 'Politics',
      yesPrice: 0.48,
      volume: 8_000,
    }),
    mkMarket({
      id: '3',
      question: 'Will Lakers win?',
      category: 'Sports',
      yesPrice: 0.51,
      volume: 5_000,
    }),
    mkMarket({
      id: '4',
      question: 'Will AGI ship in 2027?',
      category: 'AI & Tech',
      yesPrice: 0.9,
      volume: 50_000,
    }),
    mkMarket({
      id: '5',
      question: 'Expired thing',
      category: 'Culture',
      yesPrice: 0.5,
      volume: 1_000,
      endDate: pastDate,
    }),
  ]

  it('renders a single <aside> labelled as the discovery sidebar', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={sampleMarkets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    expect(screen.getByRole('complementary', { name: /discovery/i })).toBeInTheDocument()
  })

  it('renders the "Breaking news" heading and exactly 3 ranked rows for >= 3 active markets', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={sampleMarkets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    // Find the breaking-news region by its accessible name.
    const breakingNews = screen.getByRole('region', { name: /breaking news/i })
    // The widget should render an ordered list of rows.
    const rows = within(breakingNews).getAllByRole('listitem')
    expect(rows.length).toBe(3)
  })

  it('breaking-news rows are full keyboard-navigable links to /predict/[id]', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={sampleMarkets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    const breakingNews = screen.getByRole('region', { name: /breaking news/i })
    const links = within(breakingNews).getAllByRole('link')
    // All links should target the /predict/[marketId] route.
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^\/predict\/\d+/)
    }
    // At least one link should target one of our sample market IDs.
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs.some(h => h && /^\/predict\/(1|2|3|4)$/.test(h))).toBe(true)
  })

  it('renders the "Hot topics" heading and up to 4 rows aggregated by category', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={sampleMarkets} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    const hotTopics = screen.getByRole('region', { name: /hot topics/i })
    const rows = within(hotTopics).getAllByRole('listitem')
    // We have 5 categories represented (Crypto, Politics, Sports, AI & Tech,
    // Culture) — capped at 4.
    expect(rows.length).toBe(4)
  })

  it('clicking a hot-topics row calls onCategorySelect with that category', () => {
    const onCategorySelect = vi.fn()
    render(
      <TestWrapper>
        <PredictDiscoverySidebar
          markets={sampleMarkets}
          onCategorySelect={onCategorySelect}
        />
      </TestWrapper>,
    )
    const hotTopics = screen.getByRole('region', { name: /hot topics/i })
    // Hot topics rows are <button>s (filter actions, not navigation).
    const buttons = within(hotTopics).getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    // The first row is the highest-volume category — "AI & Tech" with
    // 50_000 of volume.
    fireEvent.click(buttons[0])
    expect(onCategorySelect).toHaveBeenCalledTimes(1)
    const calledWith = onCategorySelect.mock.calls[0][0] as MarketCategory
    expect(['Crypto', 'Politics', 'Sports', 'AI & Tech', 'World Events', 'Culture']).toContain(calledWith)
    expect(calledWith).toBe('AI & Tech')
  })

  it('renders graceful empty states when markets is empty', () => {
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={[]} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    // Both widget headings still render so the layout stays intentional.
    expect(screen.getByRole('region', { name: /breaking news/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /hot topics/i })).toBeInTheDocument()
    expect(screen.getByText(/nothing trending yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no hot topics yet/i)).toBeInTheDocument()
  })

  it('falls back to a "Recently resolved" widget when only expired markets exist (task 0015)', () => {
    const onlyExpired = [
      mkMarket({ id: '10', endDate: pastDate, category: 'Crypto', volume: 500 }),
      mkMarket({ id: '11', endDate: pastDate, category: 'Politics', volume: 700 }),
    ]
    render(
      <TestWrapper>
        <PredictDiscoverySidebar markets={onlyExpired} onCategorySelect={() => {}} />
      </TestWrapper>,
    )
    const breakingNews = screen.getByRole('region', { name: /breaking news/i })
    expect(within(breakingNews).getByText(/nothing trending yet/i)).toBeInTheDocument()

    expect(screen.queryByRole('region', { name: /hot topics/i })).not.toBeInTheDocument()
    const resolved = screen.getByRole('region', { name: /recently resolved/i })
    expect(within(resolved).getAllByRole('listitem').length).toBe(2)
    const links = within(resolved).getAllByRole('link')
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^\/predict\?view=archive&category=/)
    }
  })
})
