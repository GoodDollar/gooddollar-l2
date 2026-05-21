import { calcUpsidePercent, type AnalystOutlook, type AnalystRatingDistribution } from '@/lib/stockInsights'

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

type Bucket = {
  key: keyof AnalystRatingDistribution
  label: string
  segmentClass: string
  legendDotClass: string
  legendLabelClass: string
}

const BUCKETS: Bucket[] = [
  {
    key: 'strongBuy',
    label: 'Strong Buy',
    segmentClass: 'bg-emerald-500',
    legendDotClass: 'bg-emerald-500',
    legendLabelClass: 'text-emerald-300',
  },
  {
    key: 'buy',
    label: 'Buy',
    segmentClass: 'bg-green-400',
    legendDotClass: 'bg-green-400',
    legendLabelClass: 'text-green-300',
  },
  {
    key: 'hold',
    label: 'Hold',
    segmentClass: 'bg-yellow-400',
    legendDotClass: 'bg-yellow-400',
    legendLabelClass: 'text-yellow-200',
  },
  {
    key: 'sell',
    label: 'Sell',
    segmentClass: 'bg-orange-400',
    legendDotClass: 'bg-orange-400',
    legendLabelClass: 'text-orange-200',
  },
  {
    key: 'strongSell',
    label: 'Strong Sell',
    segmentClass: 'bg-red-500',
    legendDotClass: 'bg-red-500',
    legendLabelClass: 'text-red-300',
  },
]

function RatingDistributionBar({
  ratings,
  analystCount,
}: {
  ratings: AnalystRatingDistribution
  analystCount: number
}) {
  const total = Math.max(1, analystCount)
  return (
    <div className="mt-3" data-testid="analyst-rating-distribution">
      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
        <span>Based on {analystCount} analysts</span>
        <span className="text-gray-500">Last 90 days</span>
      </div>
      <div
        className="flex h-2 rounded-full overflow-hidden bg-dark-50/60 ring-1 ring-white/5"
        role="img"
        aria-label="Analyst ratings distribution"
      >
        {BUCKETS.map(bucket => {
          const value = ratings[bucket.key]
          const widthPct = (value / total) * 100
          if (widthPct <= 0) return null
          return (
            <div
              key={bucket.key}
              className={`${bucket.segmentClass} h-full`}
              style={{ width: `${widthPct}%` }}
              title={`${bucket.label}: ${value}`}
            />
          )
        })}
      </div>
      <ul className="mt-2.5 grid grid-cols-5 gap-1.5 text-[10px]">
        {BUCKETS.map(bucket => {
          const value = ratings[bucket.key]
          return (
            <li key={bucket.key} className="flex flex-col items-center text-center">
              <span className={`w-2 h-2 rounded-full ${bucket.legendDotClass} mb-1`} aria-hidden="true" />
              <span className={`font-semibold leading-tight ${bucket.legendLabelClass}`}>
                {bucket.label}
              </span>
              <span className="text-gray-300 font-mono mt-0.5">{value}</span>
            </li>
          )
        })}
      </ul>
    </div>
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
          {(() => {
            const upsidePercent = calcUpsidePercent(currentPrice, outlook.targetMean)
            const targetDelta = outlook.targetMean - currentPrice
            const targetDeltaLabel = `${targetDelta >= 0 ? '+' : '-'}$${Math.abs(targetDelta).toFixed(2)}`
            return (
              <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] text-gray-400">Target Mean</p>
              <p className="text-2xl font-bold text-white">${outlook.targetMean.toFixed(2)}</p>
            </div>
            <div className={`text-sm font-semibold ${upsidePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {upsidePercent >= 0 ? '+' : ''}
              {upsidePercent.toFixed(1)}%
            </div>
          </div>

          <p className={`mt-1 text-xs ${targetDelta >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {targetDeltaLabel} vs live
          </p>

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

          <RatingDistributionBar ratings={outlook.ratings} analystCount={outlook.analystCount} />

          <div className="mt-3 grid gap-1 text-[11px] text-gray-400">
            <p>Confidence: <span className="text-gray-200">{outlook.confidence || 'Unavailable'}</span></p>
            <p>Source: <span className="text-gray-200">{outlook.source || 'Unavailable'}</span></p>
            <p>Refreshed: <span className="text-gray-200">{outlook.refreshedAt || 'Unavailable'}</span></p>
          </div>

          <p className="mt-3 text-[11px] text-gray-500">Consensus snapshot as of {outlook.asOf}</p>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
