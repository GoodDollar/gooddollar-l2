import { useMemo, useState } from 'react'
import type { Stock } from '@/lib/stockData'
import { formatStockPrice } from '@/lib/stockData'
import { isNoData, pctOrDash } from '@/lib/formatNoData'

type MoversMode = 'gainers' | 'losers'

function formatEventDate(offsetDays: number): string {
  const now = new Date()
  const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildFallbackHeadlines(stocks: Stock[]) {
  return stocks.slice(0, 5).map((stock, idx) => ({
    id: `headline-${stock.ticker}`,
    ticker: stock.ticker,
    title: `${stock.ticker} ${stock.change24h >= 0 ? 'momentum turns positive' : 'pulls back after recent run'}`,
    source: idx % 2 === 0 ? 'Market Wire' : 'Tech Ledger',
    age: `${idx + 1}h ago`,
  }))
}

export function MarketIntelligencePanel({
  stocks,
  globalStocks,
  isLive,
  isLoading,
  onSelectTicker,
}: {
  /** Filtered stock set — drives the per-symbol Top Movers section. */
  stocks: Stock[]
  /**
   * Unfiltered stock set — drives the Upcoming Earnings + News Flow sections,
   * which intentionally stay global so an "Automotive" filter doesn't blank
   * the news/earnings calendar. Falls back to `stocks` for callers that
   * haven't migrated yet.
   */
  globalStocks?: Stock[]
  isLive: boolean
  isLoading: boolean
  onSelectTicker: (ticker: string) => void
}) {
  const earningsSource = globalStocks ?? stocks
  const headlinesSource = globalStocks ?? stocks
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

  const earnings = useMemo(() => {
    return earningsSource.slice(0, 5).map((stock, idx) => ({
      ticker: stock.ticker,
      date: formatEventDate(idx + 1),
      period: `Q${(idx % 4) + 1} FY${new Date().getFullYear()}`,
    }))
  }, [earningsSource])

  const headlines = useMemo(() => buildFallbackHeadlines(headlinesSource), [headlinesSource])
  const isDemo = !isLive
  const hasData = stocks.length > 0
  const hasGlobalData = (globalStocks ?? stocks).length > 0

  return (
    <section className="mb-4 rounded-2xl border border-gray-700/20 bg-dark-100 p-3 sm:p-4" aria-label="Market Intelligence">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Market Intelligence</h2>
          <p className="text-xs text-gray-400">Top movers, upcoming earnings, and a quick news flow.</p>
        </div>
        {isDemo && (
          <span className="rounded-md border border-yellow-500/25 bg-yellow-500/10 px-2 py-1 text-[10px] font-medium text-yellow-300">
            Demo intelligence data
          </span>
        )}
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
            <div className="space-y-1.5" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-8 rounded-lg bg-dark-50/30" />
              ))}
            </div>
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
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-300">Upcoming Earnings</h3>
          {isFiltered && (
            <p
              className="mb-2 text-[10px] text-gray-500"
              data-testid="earnings-global-caption"
            >
              Always shows all markets · filters apply to Browse table and Rebalance dashboard.
            </p>
          )}
          {isLoading ? (
            <div className="space-y-1.5" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-8 rounded-lg bg-dark-50/30" />
              ))}
            </div>
          ) : !hasGlobalData ? (
            <p className="text-xs text-gray-500">No earnings events available.</p>
          ) : (
            <ul className="space-y-1.5">
              {earnings.map((event) => (
                <li key={`${event.ticker}-${event.period}`}>
                  <button
                    type="button"
                    onClick={() => onSelectTicker(event.ticker)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-1.5 text-xs hover:border-goodgreen/30 hover:text-white"
                  >
                    <span className="font-medium text-gray-200">{event.ticker}</span>
                    <span className="text-gray-400">{event.date} · {event.period}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-gray-700/20 bg-dark-50/30 p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-300">News Flow</h3>
          {isFiltered && (
            <p
              className="mb-2 text-[10px] text-gray-500"
              data-testid="news-global-caption"
            >
              Always shows all markets · filters apply to Browse table and Rebalance dashboard.
            </p>
          )}
          {isLoading ? (
            <div className="space-y-1.5" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-8 rounded-lg bg-dark-50/30" />
              ))}
            </div>
          ) : !hasGlobalData ? (
            <p className="text-xs text-gray-500">No headlines available.</p>
          ) : (
            <ul className="space-y-2">
              {headlines.map((item) => (
                <li key={item.id} className="rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-2 text-xs">
                  <button type="button" onClick={() => onSelectTicker(item.ticker)} className="w-full text-left">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-200">{item.ticker}</span>
                      <span className="text-[10px] text-gray-500">{item.age}</span>
                    </div>
                    <p className="text-gray-300">{item.title}</p>
                    <p className="mt-1 text-[10px] text-gray-500">{item.source} · {formatStockPrice(headlinesSource.find((s) => s.ticker === item.ticker)?.price ?? 0)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}
