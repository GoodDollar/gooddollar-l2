import { useMemo } from 'react'
import type { OHLCData, Timeframe } from '@/lib/chartData'

type Signal = 'Bullish' | 'Neutral' | 'Bearish'

interface TrendSummary {
  signal: Signal
  changePct: number
  spreadPct: number
}

function computeTrendSummary(chartData: readonly OHLCData[]): TrendSummary | null {
  if (!chartData.length) return null
  const first = chartData[0]?.close ?? 0
  const last = chartData[chartData.length - 1]?.close ?? 0
  if (first <= 0 || last <= 0) return null
  const changePct = ((last - first) / first) * 100
  let signal: Signal = 'Neutral'
  if (changePct > 2) signal = 'Bullish'
  if (changePct < -2) signal = 'Bearish'
  const high = Math.max(...chartData.map((point) => point.high))
  const low = Math.min(...chartData.map((point) => point.low))
  const spreadPct = first > 0 ? ((high - low) / first) * 100 : 0
  return { signal, changePct, spreadPct }
}

interface TrendSummaryCardProps {
  chartData: readonly OHLCData[]
  timeframe: Timeframe
  isLive: boolean
}

export function TrendSummaryCard({ chartData, timeframe, isLive }: TrendSummaryCardProps) {
  const summary = useMemo(() => (isLive ? computeTrendSummary(chartData) : null), [chartData, isLive])
  return (
    <div className="rounded-xl border border-gray-700/30 bg-dark-50/20 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2">Trend Summary</h3>
      {!summary ? (
        <p className="text-xs text-gray-500" data-testid="trend-summary-empty">
          {isLive
            ? 'Trend signal unavailable while chart data loads.'
            : 'Trend signal unavailable — oracle feed degraded. Chart candles are illustrative.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2">
            <div className="text-gray-500">Signal</div>
            <div
              className={`mt-1 font-semibold ${summary.signal === 'Bullish' ? 'text-green-400' : summary.signal === 'Bearish' ? 'text-red-400' : 'text-gray-200'}`}
            >
              {summary.signal}
            </div>
          </div>
          <div className="rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2">
            <div className="text-gray-500">{timeframe} move</div>
            <div className={`mt-1 font-semibold ${summary.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.changePct >= 0 ? '+' : ''}{summary.changePct.toFixed(2)}%
            </div>
          </div>
          <div className="rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2">
            <div className="text-gray-500">Range spread</div>
            <div className="mt-1 font-semibold text-gray-200">{summary.spreadPct.toFixed(2)}%</div>
          </div>
        </div>
      )}
    </div>
  )
}
