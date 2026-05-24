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
import { Newspaper, Flame, Clock } from 'lucide-react'
import type { PredictionMarket, MarketCategory } from '@/lib/predictData'
import { formatVolume } from '@/lib/predictData'
import {
  selectBreakingNews,
  selectHotTopics,
  selectRecentlyResolvedTopics,
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
  // Fallback for the end-of-cycle state: if the active list is empty but
  // resolved markets exist, surface a clearly-labelled "RECENTLY RESOLVED"
  // widget that links into the archive view, instead of letting the
  // sidebar tint resolved categories as active hot markets (task 0015).
  const resolvedTopics = useMemo(
    () => (hotTopics.length === 0 ? selectRecentlyResolvedTopics(markets, hotTopicsLimit) : []),
    [hotTopics, markets, hotTopicsLimit],
  )

  return (
    <aside
      role="complementary"
      aria-label="Predict market discovery"
      className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start"
    >
      <BreakingNewsWidget entries={breakingNews} />
      {hotTopics.length > 0 ? (
        <HotTopicsWidget entries={hotTopics} onSelect={onCategorySelect} />
      ) : resolvedTopics.length > 0 ? (
        <RecentlyResolvedTopicsWidget entries={resolvedTopics} />
      ) : (
        <HotTopicsWidget entries={hotTopics} onSelect={onCategorySelect} />
      )}
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
      data-testid="hot-topics-widget"
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
        <p className="text-sm text-gray-500 py-2" data-testid="hot-topics-empty">
          No hot topics yet — waiting for new oracle markets.
        </p>
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

/* ---------- Recently resolved (fallback for end-of-cycle state) ---------- */

function RecentlyResolvedTopicsWidget({ entries }: { entries: HotTopicEntry[] }) {
  const headingId = 'predict-sidebar-recently-resolved'
  return (
    <section
      role="region"
      aria-labelledby={headingId}
      data-testid="recently-resolved-widget"
      className="rounded-xl border border-gray-700/30 bg-dark-100/60 p-4"
    >
      <h2
        id={headingId}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3"
      >
        <Clock className="w-4 h-4 text-gray-400" aria-hidden="true" />
        Recently resolved
      </h2>
      <p className="text-[11px] text-gray-500 mb-3 leading-snug">
        New oracle markets are coming. In the meantime, browse archived markets by category.
      </p>
      <ul className="flex flex-col gap-1" data-testid="recently-resolved-list">
        {entries.map(({ category, total, count }) => (
          <li key={category}>
            <Link
              href={`/predict?view=archive&category=${encodeURIComponent(category)}`}
              data-testid={`recently-resolved-row-${category}`}
              className="w-full flex items-center justify-between gap-3 rounded-lg px-2 py-2 -mx-2 text-left border border-gray-700/40 bg-dark-200/30 hover:bg-dark-200/60 focus:bg-dark-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/60 transition-colors text-gray-300"
            >
              <span className="text-sm truncate">{category}</span>
              <span className="shrink-0 flex items-center gap-2 text-[11px] text-gray-500">
                <span className="text-gray-400">{formatVolume(total)}</span>
                <span aria-hidden="true">•</span>
                <span>{count} resolved</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
