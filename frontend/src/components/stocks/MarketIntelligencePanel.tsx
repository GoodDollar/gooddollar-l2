import { useMemo, useState } from 'react'
import type { Stock } from '@/lib/stockData'
import { hasLiveOracleChange } from '@/lib/oracleHonesty'

type MoversMode = 'gainers' | 'losers'

export function MarketIntelligencePanel({
  stocks,
  isLive,
  isLoading,
  onSelectTicker,
}: {
  stocks: Stock[]
  isLive: boolean
  isLoading: boolean
  onSelectTicker: (ticker: string) => void
}) {
  const [mode, setMode] = useState<MoversMode>('gainers')

  const movers = useMemo(() => {
    const eligible = stocks.filter((stock) => hasLiveOracleChange(stock))
    if (mode === 'gainers') {
      return [...eligible]
        .filter((stock) => stock.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h)
        .slice(0, 5)
    }
    return [...eligible]
      .filter((stock) => stock.change24h < 0)
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 5)
  }, [mode, stocks])

  const isDemo = !isLive
  const hasData = stocks.length > 0

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
          ) : movers.length === 0 ? (
            <div
              className="rounded-lg border border-dashed border-gray-700/30 px-3 py-4 text-center text-xs text-gray-500"
              data-testid="top-movers-empty"
            >
              No movers to show — oracle feed degraded.
            </div>
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
                    <span className={stock.change24h > 0 ? 'text-green-400' : 'text-red-400'}>
                      {stock.change24h > 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-gray-700/20 bg-dark-50/30 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">Upcoming Earnings</h3>
          <div
            className="rounded-lg border border-dashed border-gray-700/30 px-3 py-4 text-center text-xs text-gray-500"
            data-testid="earnings-empty"
          >
            No earnings calendar wired yet — upcoming earnings dates will appear here once a real provider is connected. None of this is fabricated.
          </div>
        </article>

        <article className="rounded-xl border border-gray-700/20 bg-dark-50/30 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">News Flow</h3>
          <div
            className="rounded-lg border border-dashed border-gray-700/30 px-3 py-4 text-center text-xs text-gray-500"
            data-testid="news-flow-empty"
          >
            No cross-ticker news feed yet — headlines will appear here once a real news provider is wired. None of this is fabricated.
          </div>
        </article>
      </div>
    </section>
  )
}
