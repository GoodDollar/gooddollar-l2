/**
 * PredictDiscoverySidebar — Polymarket-parity right-rail for the Predict
 * page (task 0048).
 *
 * Two widgets stacked vertically:
 *
 *   • **Breaking news** — top N active markets ranked by `selectBreakingNews`.
 *     Each row links to `/predict/[id]` via `next/link` for keyboard- and
 *     screen-reader-native navigation. The page-level click handler is the
 *     anchor itself.
 *
 *   • **Hot topics** — top N category aggregates ranked by `selectHotTopics`.
 *     Rows are `<button>`s that invoke the page-supplied
 *     `onCategorySelect(category)` callback to drive the existing category
 *     filter state. The button gives us proper keyboard semantics and matches
 *     the rest of the Predict page's filter chips.
 *
 * The component is stateless on purpose: all ranking, sorting, and
 * deduplication is in pure selectors in `frontend/src/lib/predictDiscovery.ts`
 * so this file stays small and focused on presentation + a11y.
 *
 * Layout responsibility lives in the parent page — this component renders
 * an `<aside role="complementary">` that can be dropped into any 2-column
 * grid track. It is hidden below the `lg` breakpoint via the wrapping page
 * to preserve mobile UX (single-column scrolling list of markets).
 */
import { useMemo } from 'react'
import Link from 'next/link'
import { Newspaper, Flame } from 'lucide-react'
import type { PredictionMarket, MarketCategory } from '@/lib/predictData'
import { formatVolume } from '@/lib/predictData'
import {
  selectBreakingNews,
  selectHotTopics,
  type BreakingNewsEntry,
  type HotTopicEntry,
} from '@/lib/predictDiscovery'

interface PredictDiscoverySidebarProps {
  /** Full list of markets (typically `allMarkets` from the Predict page). */
  markets: PredictionMarket[]
  /**
   * Invoked when the user clicks a "Hot topics" row. The page wires this
   * to its `setCategory` state so the market grid filters to that
   * category instantly.
   */
  onCategorySelect: (category: MarketCategory) => void
  /** Optional max counts — exposed primarily for tests. */
  breakingNewsLimit?: number
  hotTopicsLimit?: number
}

export function PredictDiscoverySidebar({
  markets,
  onCategorySelect,
  breakingNewsLimit = 3,
  hotTopicsLimit = 4,
}: PredictDiscoverySidebarProps) {
  // Memoize: selectors are pure but `markets` can be a large list and
  // these widgets re-render on every page render.
  const breakingNews = useMemo(
    () => selectBreakingNews(markets, breakingNewsLimit),
    [markets, breakingNewsLimit],
  )
  const hotTopics = useMemo(
    () => selectHotTopics(markets, hotTopicsLimit),
    [markets, hotTopicsLimit],
  )

  return (
    <aside
      role="complementary"
      aria-label="Predict market discovery"
      className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start"
    >
      <BreakingNewsWidget entries={breakingNews} />
      <HotTopicsWidget entries={hotTopics} onSelect={onCategorySelect} />
    </aside>
  )
}

/* ---------- Breaking news ---------- */

function BreakingNewsWidget({ entries }: { entries: BreakingNewsEntry[] }) {
  const headingId = 'predict-sidebar-breaking-news'
  return (
    <section
      role="region"
      aria-labelledby={headingId}
      className="rounded-xl border border-gray-700/30 bg-dark-100/60 p-4"
    >
      <h2
        id={headingId}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3"
      >
        <Newspaper className="w-4 h-4 text-goodgreen" aria-hidden="true" />
        Breaking news
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">Nothing trending yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entries.map(({ market }, idx) => (
            <li key={market.id}>
              <Link
                href={`/predict/${market.id}`}
                className="flex items-start gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-dark-200/60 focus:bg-dark-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/60 transition-colors"
              >
                <span
                  className="shrink-0 mt-0.5 inline-flex w-5 h-5 items-center justify-center rounded-md bg-dark-200 text-[10px] font-semibold text-gray-300"
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-white leading-snug line-clamp-2">
                    {market.question}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="text-goodgreen">
                      {Math.round(market.yesPrice * 100)}%
                    </span>
                    <span aria-hidden="true">•</span>
                    <span>{formatVolume(market.volume)} vol</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ---------- Hot topics ---------- */

function HotTopicsWidget({
  entries,
  onSelect,
}: {
  entries: HotTopicEntry[]
  onSelect: (category: MarketCategory) => void
}) {
  const headingId = 'predict-sidebar-hot-topics'
  return (
    <section
      role="region"
      aria-labelledby={headingId}
      className="rounded-xl border border-gray-700/30 bg-dark-100/60 p-4"
    >
      <h2
        id={headingId}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3"
      >
        <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" />
        Hot topics
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">Nothing trending yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entries.map(({ category, total, count }) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => onSelect(category)}
                className="w-full flex items-center justify-between gap-3 rounded-lg px-2 py-2 -mx-2 text-left hover:bg-dark-200/60 focus:bg-dark-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/60 transition-colors"
              >
                <span className="text-sm text-white truncate">{category}</span>
                <span className="shrink-0 flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="text-gray-300">{formatVolume(total)}</span>
                  <span aria-hidden="true">•</span>
                  <span>{count} {count === 1 ? 'market' : 'markets'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
