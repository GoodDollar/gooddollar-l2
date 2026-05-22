import type { StockNewsItem } from '@/lib/stockInsights'

function relativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime()
  const deltaHours = Math.round(deltaMs / 3_600_000)
  if (deltaHours < 1) return 'Just now'
  if (deltaHours < 24) return `${deltaHours}h ago`
  const days = Math.round(deltaHours / 24)
  return `${days}d ago`
}

const tagClass: Record<StockNewsItem['tag'], string> = {
  Earnings: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
  Guidance: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  Macro: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  Product: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
}

export function NewsEventsPanel({
  ticker,
  isLoading,
  error,
  items,
}: {
  ticker: string
  isLoading: boolean
  error: string | null
  items: StockNewsItem[]
}) {
  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4">
      <h2 className="text-sm font-semibold text-white mb-3">News & Events</h2>

      {isLoading ? (
        <div className="space-y-2" aria-label="News loading">
          <div className="h-14 rounded-xl bg-dark-50/50 animate-pulse" />
          <div className="h-14 rounded-xl bg-dark-50/50 animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-700/30 bg-dark-50/30 px-3 py-2.5">
          <p className="text-xs text-gray-300">No recent catalysts for {ticker} yet.</p>
          <p className="text-[11px] text-gray-500 mt-1">Check back later for earnings, macro, and product updates.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.slice(0, 5).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-gray-700/30 bg-dark-50/20 hover:bg-dark-50/35 transition-colors px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${tagClass[item.tag]}`}>{item.tag}</span>
                <span className="text-[11px] text-gray-500">{relativeTime(item.publishedAt)}</span>
              </div>
              <p className="text-sm text-gray-100 leading-snug">{item.headline}</p>
              <p className="text-[11px] text-gray-400 mt-1">{item.source}</p>
            </a>
          ))}
        </div>
      )}

      <p className="text-[10px] text-gray-500 mt-3 text-right">News powered by GoodChain</p>
    </div>
  )
}
