import { calcUpsidePercent, type AnalystOutlook } from '@/lib/stockInsights'

function ConsensusBadge({ consensus }: { consensus: AnalystOutlook['consensus'] }) {
  const colorMap = {
    Bullish: 'text-green-300 bg-green-500/15 border-green-500/30',
    Neutral: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30',
    Bearish: 'text-red-300 bg-red-500/15 border-red-500/30',
  } as const
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colorMap[consensus]}`}>
      {consensus}
    </span>
  )
}

function TrendBadge({ trend }: { trend: AnalystOutlook['revisionTrend'] }) {
  const styleMap = {
    Up: 'text-green-300 bg-green-500/15 border-green-500/30',
    Flat: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
    Down: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  } as const

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${styleMap[trend]}`}>
      90d trend: {trend}
    </span>
  )
}

export function AnalystOutlookCard({
  currentPrice,
  outlook,
  isLoading,
}: {
  currentPrice: number
  outlook: AnalystOutlook | null
  isLoading: boolean
}) {
  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4 mb-4">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <h2 className="text-sm font-semibold text-white">Analyst Outlook</h2>
        {!isLoading && outlook && <ConsensusBadge consensus={outlook.consensus} />}
      </div>

      {isLoading ? (
        <div className="space-y-2.5" aria-label="Analyst outlook loading">
          <div className="h-3 w-28 rounded bg-dark-50/60 animate-pulse" />
          <div className="h-7 w-36 rounded bg-dark-50/60 animate-pulse" />
          <div className="h-3 w-44 rounded bg-dark-50/60 animate-pulse" />
        </div>
      ) : !outlook ? (
        <div className="rounded-xl border border-gray-700/30 bg-dark-50/30 px-3 py-2.5">
          <p className="text-xs text-gray-300">Analyst target data is unavailable for this symbol right now.</p>
          <p className="text-[11px] text-gray-500 mt-1">Try another ticker or check back later.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] text-gray-400">Target Mean</p>
              <p className="text-2xl font-bold text-white">${outlook.targetMean.toFixed(2)}</p>
            </div>
            <div className={`text-sm font-semibold ${calcUpsidePercent(currentPrice, outlook.targetMean) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {calcUpsidePercent(currentPrice, outlook.targetMean) >= 0 ? '+' : ''}
              {calcUpsidePercent(currentPrice, outlook.targetMean).toFixed(1)}%
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-gray-400">
            <span>Low ${outlook.targetLow.toFixed(2)}</span>
            <span>High ${outlook.targetHigh.toFixed(2)}</span>
          </div>

          <div className="mt-2 h-1.5 rounded-full bg-dark-50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400/70 to-goodgreen/80"
              style={{
                width: `${Math.max(8, Math.min(96, ((outlook.targetMean - outlook.targetLow) / Math.max(1, outlook.targetHigh - outlook.targetLow)) * 100))}%`,
              }}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-gray-700/30 bg-dark-50/40 p-2">
              <p className="text-gray-400">Analysts</p>
              <p className="mt-1 text-sm font-semibold text-white">{outlook.analystCount}</p>
            </div>
            <div className="rounded-lg border border-gray-700/30 bg-dark-50/40 p-2">
              <p className="text-gray-400">Ratings</p>
              <p className="mt-1 text-white">
                Buy {outlook.ratingDistribution.buy}% · Hold {outlook.ratingDistribution.hold}% · Sell {outlook.ratingDistribution.sell}%
              </p>
            </div>
          </div>

          <div className="mt-2.5">
            <TrendBadge trend={outlook.revisionTrend} />
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Consensus snapshot as of {outlook.asOf} · Source: {outlook.source}
          </p>
        </div>
      )}
    </div>
  )
}
