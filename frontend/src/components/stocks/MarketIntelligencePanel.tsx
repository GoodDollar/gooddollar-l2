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
   * Live-feed flag retained on the prop API for forward compatibility
   * with a real news/earnings adapter — currently only Top Movers is
   * gated by oracle freshness, so the value is no longer read inside
   * this panel.
   */
  isLive?: boolean
  isLoading: boolean
  onSelectTicker: (ticker: string) => void
}) {
  const isFiltered = !!globalStocks && globalStocks.length > stocks.length
  const [mode, setMode] = useState<MoversMode>('gainers')

  // Only consider symbols whose 24h change actually came from a live feed.
  // The seed dataset uses 0 as a "no oracle update" sentinel; ranking on it
  // produces a fake "top movers" list of 5 identical +0.00% rows.
  const liveMovers = useMemo(
    () => stocks.filter((s) => !isNoData(s.change24h)),
    [stocks],
  )
  const hasLiveMovers = liveMovers.length > 0

  const movers = useMemo(() => {
    if (liveMovers.length === 0) return []

    if (mode === 'gainers') {
      return [...liveMovers]
        .filter((stock) => stock.change24h >= 0)
        .sort((a, b) => b.change24h - a.change24h)
        .slice(0, 5)
    }

    return [...liveMovers]
      .filter((stock) => stock.change24h < 0)
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 5)
  }, [mode, liveMovers])

  const hasData = stocks.length > 0

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
          {isLoading ? (
            <LoadingSkeleton />
          ) : !hasData ? (
            <p className="text-xs text-gray-500">No movers available.</p>
          ) : !hasLiveMovers ? (
            <p className="text-xs text-gray-500" data-testid="top-movers-empty">
              No movers yet, waiting for live feed.
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
