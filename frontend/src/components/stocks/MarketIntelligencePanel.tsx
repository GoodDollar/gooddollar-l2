import { useMemo, useState } from 'react'
import type { Stock } from '@/lib/stockData'
import { isNoData, pctOrDash } from '@/lib/formatNoData'

type MoversMode = 'gainers' | 'losers'

/**
 * Per-column source caption rendered under the Upcoming Earnings + News
 * Flow headers. The previous `Demo intelligence data` chip at the panel
 * level conflated the live Top Movers column with the two columns that
 * had no feed at all — this label keeps the source/timestamp invariant
 * (Lane 4 spec §This Lane) explicit per column.
 */
function FeedPendingCaption() {
  return (
    <p className="mt-0.5 text-[10px] text-gray-500">Source: feed pending</p>
  )
}

function formatAge(ms: number): string {
  if (ms < 1_000)       return 'just now'
  if (ms < 60_000)      return `${Math.floor(ms / 1_000)}s ago`
  if (ms < 3_600_000)   return `${Math.floor(ms / 60_000)}m ago`
  return `${Math.floor(ms / 3_600_000)}h ago`
}

/**
 * Source caption for the Top Movers column. Mirrors the sibling Earnings /
 * News captions when the oracle isn't live, and switches to an honest
 * `Source: oracle · Updated Xs ago` line when the page passes a fresh
 * `updatedAtMs`. Task 0028.
 */
function TopMoversSourceCaption({ isLive, updatedAtMs }: { isLive: boolean; updatedAtMs?: number }) {
  if (!isLive || updatedAtMs === undefined) return <FeedPendingCaption />
  const age = Math.max(0, Date.now() - updatedAtMs)
  return (
    <p className="mt-0.5 text-[10px] text-gray-500">
      Source: oracle · Updated {formatAge(age)}
    </p>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1.5" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse h-8 rounded-lg bg-dark-50/30" />
      ))}
    </div>
  )
}

export function MarketIntelligencePanel({
  stocks,
  globalStocks,
  isLive = false,
  updatedAtMs,
  isLoading,
  onSelectTicker,
}: {
  /** Filtered stock set — drives the per-symbol Top Movers section. */
  stocks: Stock[]
  /**
   * Unfiltered stock set — surfaces the cross-filter "Always shows all
   * markets" caption on the News + Earnings columns when the page is
   * filtered. Falls back to `stocks` for callers that haven't migrated
   * yet.
   */
  globalStocks?: Stock[]
  /**
   * Oracle-live signal from the page. When `false`, Top Movers refuses to
   * rank seed `change24h` rows — instead it surfaces the same
   * `Source: feed pending` caption the Earnings / News columns use, plus
   * an explicit per-mode empty state ("No gainers yet — waiting for live
   * feed."). Task 0028.
   */
  isLive?: boolean
  /**
   * Timestamp of the last successful oracle read in ms (e.g. `Date.now()`
   * at the moment `useOnChainStocks` returned `isLive: true`). Used to
   * render the `Updated Xs ago` line under the Top Movers heading.
   */
  updatedAtMs?: number
  isLoading: boolean
  onSelectTicker: (ticker: string) => void
}) {
  const isFiltered = !!globalStocks && globalStocks.length > stocks.length
  const [mode, setMode] = useState<MoversMode>('gainers')

  // Two-step gate, in priority order:
  //   1. `isLive === false` (oracle offline) — refuse to rank anything,
  //      regardless of what the seed dataset says. The page banner already
  //      tells the user the oracle is offline; ranking demo prices behind
  //      a "Top Movers" leaderboard contradicts that.
  //   2. `!isNoData(change24h)` — drop rows where the oracle returned a
  //      zero placeholder so a fresh chain reading isn't polluted by
  //      stale rows for symbols that haven't updated yet.
  const liveMovers = useMemo(
    () => (isLive ? stocks.filter((s) => !isNoData(s.change24h)) : []),
    [isLive, stocks],
  )

  const movers = useMemo(() => {
    if (liveMovers.length === 0) return []
    const direction = mode === 'gainers' ? 1 : -1
    return [...liveMovers]
      .filter((s) => (mode === 'gainers' ? s.change24h >= 0 : s.change24h < 0))
      .sort((a, b) => (b.change24h - a.change24h) * direction)
      .slice(0, 5)
  }, [mode, liveMovers])

  const hasData = stocks.length > 0
  const emptyTestId = mode === 'gainers' ? 'top-movers-empty-gainers' : 'top-movers-empty-losers'
  const emptyCopy = mode === 'gainers'
    ? 'No gainers yet — waiting for live feed.'
    : 'No losers yet — waiting for live feed.'

  return (
    <section
      className="mb-4 rounded-2xl border border-gray-700/20 bg-dark-100 p-3 sm:p-4"
      aria-label="Market Intelligence"
    >
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-white">Market Intelligence</h2>
        <p className="text-xs text-gray-400">Top movers, upcoming earnings, and a quick news flow.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-gray-700/20 bg-dark-50/30 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-300">Top Movers</h3>
            <div className="flex items-center gap-1 rounded-md border border-gray-700/25 bg-dark-100/70 p-1">
              <button
                type="button"
                onClick={() => setMode('gainers')}
                className={`rounded px-2 py-1 text-[11px] ${mode === 'gainers' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}
              >
                Gainers
              </button>
              <button
                type="button"
                onClick={() => setMode('losers')}
                className={`rounded px-2 py-1 text-[11px] ${mode === 'losers' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`}
              >
                Losers
              </button>
            </div>
          </div>
          <TopMoversSourceCaption isLive={isLive} updatedAtMs={updatedAtMs} />
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasData ? (
            <p className="text-xs text-gray-500">No movers available.</p>
          ) : movers.length === 0 ? (
            <p className="text-xs text-gray-500" data-testid={emptyTestId}>
              {emptyCopy}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {movers.map((stock) => (
                <li key={stock.ticker}>
                  <button
                    type="button"
                    onClick={() => onSelectTicker(stock.ticker)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-1.5 text-xs hover:border-goodgreen/30 hover:text-white"
                  >
                    <span className="font-medium text-gray-200">{stock.ticker}</span>
                    <span className={stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {pctOrDash(stock.change24h)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-gray-700/20 bg-dark-50/30 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-300">Upcoming Earnings</h3>
          <FeedPendingCaption />
          {isFiltered && (
            <p
              className="mt-2 text-[10px] text-gray-500"
              data-testid="earnings-global-caption"
            >
              Always shows all markets · filters apply to Browse table and Rebalance dashboard.
            </p>
          )}
          <div className="mt-2">
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <p className="text-xs text-gray-500" data-testid="earnings-empty">
                No earnings calendar yet — feed coming soon.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-gray-700/20 bg-dark-50/30 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-300">News Flow</h3>
          <FeedPendingCaption />
          {isFiltered && (
            <p
              className="mt-2 text-[10px] text-gray-500"
              data-testid="news-global-caption"
            >
              Always shows all markets · filters apply to Browse table and Rebalance dashboard.
            </p>
          )}
          <div className="mt-2">
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <p className="text-xs text-gray-500" data-testid="news-flow-empty">
                No headlines yet — news feed coming soon.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  )
}
