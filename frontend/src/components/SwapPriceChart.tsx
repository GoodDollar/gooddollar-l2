'use client'

import { useState, useMemo, memo } from 'react'
import { getChartData, type Timeframe } from '@/lib/chartData'
import { usePriceFeeds, getPrice } from '@/lib/usePriceFeeds'
import { formatAge } from '@/lib/formatAge'

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M']
const FRESH_WINDOW_MS = 60_000

interface SwapPriceChartProps {
  inputSymbol: string
  outputSymbol: string
}

function formatRate(rate: number): string {
  if (rate >= 1000) return rate.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (rate >= 1) return rate.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (rate >= 0.01) return rate.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return rate.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

type Freshness = 'live' | 'demo'

function AttributionPill({ freshness, ageMs }: { freshness: Freshness; ageMs: number | null }) {
  if (freshness === 'live') {
    return (
      <span
        data-testid="swap-attribution-pill"
        className="inline-flex items-center gap-1.5 rounded-full bg-goodgreen/10 px-2 py-0.5 text-[10px] font-medium text-goodgreen/90"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-goodgreen animate-pulse" />
        Live · last update {ageMs !== null ? formatAge(Math.max(0, ageMs)) : 'just now'}
      </span>
    )
  }
  return (
    <span
      data-testid="swap-attribution-pill"
      className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Demo · prices are illustrative
    </span>
  )
}

function ChangeCell({
  inputSymbol,
  change24h,
}: {
  inputSymbol: string
  change24h: number | null
}) {
  if (change24h === null) {
    return (
      <span data-testid="swap-change-cell" className="text-xs font-medium text-gray-500">
        — <span className="ml-1.5 font-normal">{inputSymbol} 24h</span>
      </span>
    )
  }
  const isPositive = change24h >= 0
  return (
    <span
      data-testid="swap-change-cell"
      className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}
    >
      {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
      <span className="text-gray-500 ml-1.5 font-normal">{inputSymbol} 24h</span>
    </span>
  )
}

export const SwapPriceChart = memo(function SwapPriceChart({
  inputSymbol,
  outputSymbol,
}: SwapPriceChartProps) {
  const { prices, quotes, isLive, lastUpdated, error } = usePriceFeeds([inputSymbol, outputSymbol])
  const inputPrice = getPrice(prices, inputSymbol)
  const outputPrice = getPrice(prices, outputSymbol)
  const [timeframe, setTimeframe] = useState<Timeframe>('1W')

  const exchangeRate = outputPrice > 0 ? inputPrice / outputPrice : 0

  // Freshness verdict drives both the attribution pill and the
  // change-cell em-dash decision. Stays in sync with the 60 s window
  // used by `useCryptoRailHealth` and the stocks-side badges so the
  // whole app speaks the same honesty vocabulary (tasks 0006 / 0048).
  const ageMs = lastUpdated ? Date.now() - lastUpdated.getTime() : null
  const isFresh = isLive && !error && ageMs !== null && ageMs < FRESH_WINDOW_MS
  const freshness: Freshness = isFresh ? 'live' : 'demo'

  // Read the live 24h change for the input symbol — the dominant mover
  // when the output is a stablecoin. `0` is treated as "no signal"
  // (matches the lane's `hasLiveOracleChange` helper used across
  // tasks 0035 / 0042); accepted false em-dash on a truly flat day is
  // consistent with sibling surfaces.
  const liveInputChange = quotes[inputSymbol]?.change24h
  const hasLiveChange =
    freshness === 'live' &&
    typeof liveInputChange === 'number' &&
    Number.isFinite(liveInputChange) &&
    liveInputChange !== 0
  const displayChange = hasLiveChange ? (liveInputChange as number) : null

  const chartData = useMemo(
    () => getChartData(inputSymbol, timeframe, inputPrice),
    [inputSymbol, timeframe, inputPrice],
  )

  const closePrices = useMemo(
    () => chartData.map((d) => d.close / (outputPrice || 1)),
    [chartData, outputPrice],
  )

  const sparklineColor =
    displayChange !== null && displayChange < 0 ? '#f87171' : '#4ade80'

  const w = 400
  const h = 100
  const pad = 2

  const { linePoints, areaPoints } = useMemo(() => {
    if (closePrices.length < 2) return { linePoints: '', areaPoints: '' }
    const min = Math.min(...closePrices)
    const max = Math.max(...closePrices)
    const range = max - min || 1
    const coords = closePrices.map((v, i) => ({
      x: pad + (i / (closePrices.length - 1)) * (w - pad * 2),
      y: pad + (1 - (v - min) / range) * (h - pad * 2),
    }))
    const line = coords.map((c) => `${c.x},${c.y}`).join(' ')
    const area = `${coords[0].x},${h} ${line} ${coords[coords.length - 1].x},${h}`
    return { linePoints: line, areaPoints: area }
  }, [closePrices])

  if (!exchangeRate) return null

  return (
    <div className="w-full max-w-[460px] mb-4">
      <div className="mb-2 px-1">
        <AttributionPill freshness={freshness} ageMs={ageMs} />
      </div>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div>
          <div className="text-sm text-gray-400 mb-0.5">
            1 {inputSymbol} ={' '}
            <span className="text-white font-medium">
              {formatRate(exchangeRate)} {outputSymbol}
            </span>
          </div>
          <ChangeCell inputSymbol={inputSymbol} change24h={displayChange} />
        </div>
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20'
                  : 'text-gray-500 hover:text-gray-300 bg-dark-100 border border-gray-700/20'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="relative bg-dark-100/50 rounded-xl border border-gray-700/15 p-3">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full opacity-[0.35]"
          preserveAspectRatio="none"
          aria-label={`${inputSymbol}/${outputSymbol} illustrative sparkline`}
        >
          {areaPoints && (
            <>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill="url(#chartFill)" />
              <polyline
                points={linePoints}
                fill="none"
                stroke={sparklineColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
        <span className="absolute bottom-2 right-3 text-[10px] text-gray-500 bg-dark-100/80 px-1.5 py-0.5 rounded">
          Sparkline illustrative
        </span>
      </div>
    </div>
  )
})
