'use client'

import { useMemo, memo } from 'react'
import { getChartData } from '@/lib/chartData'
import { usePriceFeeds, getPrice } from '@/lib/usePriceFeeds'
import { useAttributedPrices } from '@/lib/useAttributedPrice'
import { PriceSourceBadge } from './PriceSourceBadge'

interface SwapPriceChartProps {
  inputSymbol: string
  outputSymbol: string
}

function formatRate(rate: number): string {
  if (rate >= 1_000_000) return rate.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (rate >= 1000) return rate.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (rate >= 1) return rate.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (rate >= 0.01) return rate.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return rate.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

/**
 * Landing-page hero rate + illustrative price chart.
 *
 * The drawn line is an intentionally illustrative synthetic walk
 * (`chartData.ts`) — it is NOT a real OHLC series. Because of that:
 *
 *  - We display the input symbol's `change24h` from `useAttributedPrice`
 *    so the percent next to the CoinGecko badge actually comes from
 *    CoinGecko (task 0035).
 *  - We do NOT render a `1D / 1W / 1M` selector — every selection used to
 *    re-derive a synthetic percent from `Math.random()` under a CoinGecko
 *    badge. The illustrative SVG is pinned to a single window.
 */
export const SwapPriceChart = memo(function SwapPriceChart({
  inputSymbol,
  outputSymbol,
}: SwapPriceChartProps) {
  // Canonical "what does this cost" lookup — same source the LandingPriceStrip
  // uses, so the visible rate matches the cards immediately below by
  // construction (task 0027).
  const attributed = useAttributedPrices([inputSymbol, outputSymbol])
  const inputAttr = attributed[inputSymbol]
  const outputAttr = attributed[outputSymbol]
  const inputPrice = inputAttr?.priceUsd ?? 0
  const outputPrice = outputAttr?.priceUsd ?? 0

  // Chart series stays on usePriceFeeds — the time-series array is
  // illustrative and never the source of the visible rate or percent.
  const { prices: feedPrices } = usePriceFeeds([inputSymbol])
  const seriesAnchor = getPrice(feedPrices, inputSymbol) || inputPrice

  const exchangeRate = outputPrice > 0 ? inputPrice / outputPrice : 0
  const bothUnknown = inputAttr?.source === 'unknown' && outputAttr?.source === 'unknown'
  const bothFallback = inputAttr?.source === 'fallback' && outputAttr?.source === 'fallback'
  const change24h = inputAttr?.change24h ?? null

  const chartData = useMemo(
    () => getChartData(inputSymbol, '1W', seriesAnchor),
    [inputSymbol, seriesAnchor],
  )

  const closePrices = useMemo(
    () => chartData.map(d => d.close / (outputPrice || 1)),
    [chartData, outputPrice],
  )

  const isPositive = (change24h ?? 0) >= 0
  const color = isPositive ? '#4ade80' : '#f87171'

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

    const line = coords.map(c => `${c.x},${c.y}`).join(' ')
    const area = `${coords[0].x},${h} ${line} ${coords[coords.length - 1].x},${h}`
    return { linePoints: line, areaPoints: area }
  }, [closePrices])

  if (bothUnknown || !exchangeRate) return null

  return (
    <div className="w-full max-w-[460px] mb-4">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div>
          <div className="text-sm text-gray-400 mb-0.5">
            1 {inputSymbol} = <span className="text-white font-medium">{formatRate(exchangeRate)} {outputSymbol}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            {change24h !== null && (
              <span
                data-testid="hero-change-percent"
                className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}
              >
                {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
              </span>
            )}
            {inputAttr && <PriceSourceBadge source={inputAttr.source} size="sm" />}
            {bothFallback && (
              <span className="text-[10px] text-amber-300/80" data-testid="hero-indicative">
                Indicative · live feed warming up
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-dark-100/50 rounded-xl border border-gray-700/15 p-3">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full"
          preserveAspectRatio="none"
          aria-label={`${inputSymbol}/${outputSymbol} price chart`}
        >
          {areaPoints && (
            <>
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill="url(#chartFill)" />
              <polyline
                points={linePoints}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      </div>
    </div>
  )
})
