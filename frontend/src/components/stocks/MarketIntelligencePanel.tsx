import { useMemo, useState } from 'react'
import type { Stock } from '@/lib/stockData'
import { formatStockPrice } from '@/lib/stockData'

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
    if (stocks.length === 0) return []
    const sorted = [...stocks].sort((a, b) => b.change24h - a.change24h)
    const selected = mode === 'gainers' ? sorted.slice(0, 5) : sorted.slice(-5).reverse()
    return selected
  }, [mode, stocks])

  const earnings = useMemo(() => {
    return stocks.slice(0, 5).map((stock, idx) => ({
      ticker: stock.ticker,
      date: formatEventDate(idx + 1),
      period: `Q${(idx % 4) + 1} FY${new Date().getFullYear()}`,
    }))
  }, [stocks])

  const headlines = useMemo(() => buildFallbackHeadlines(stocks), [stocks])
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
            <p className="text-xs text-gray-500">Loading movers…</p>
          ) : !hasData ? (
            <p className="text-xs text-gray-500">No movers available.</p>
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
                      {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-gray-700/20 bg-dark-50/30 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">Upcoming Earnings</h3>
          {isLoading ? (
            <p className="text-xs text-gray-500">Loading earnings…</p>
          ) : !hasData ? (
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
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">News Flow</h3>
          {isLoading ? (
            <p className="text-xs text-gray-500">Loading headlines…</p>
          ) : !hasData ? (
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
                    <p className="mt-1 text-[10px] text-gray-500">{item.source} · {formatStockPrice(stocks.find((s) => s.ticker === item.ticker)?.price ?? 0)}</p>
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
