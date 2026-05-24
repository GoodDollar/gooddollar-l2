'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  useFundingRateHistory,
  type FundingRange,
  type FundingRateSnapshot,
  type FundingRateStatus,
} from '@/lib/perpsHistoryData'
import { PriceSourceBadge } from '@/components/PriceSourceBadge'

const RANGES: { label: string; value: FundingRange }[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
]

function formatTime(ts: number, range: FundingRange): string {
  const d = new Date(ts)
  if (range === '24h') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (range === '7d') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatRate(rate: number): string {
  return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`
}

function formatAnnualized(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

interface TooltipData {
  x: number
  y: number
  snapshot: FundingRateSnapshot
  range: FundingRange
}

function BarChart({ data, range }: { data: readonly FundingRateSnapshot[]; range: FundingRange }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 200 })

  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setDimensions({ width: entry.contentRect.width, height: 200 })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { width, height } = dimensions
  const padding = { top: 16, right: 8, bottom: 24, left: 48 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const rates = data.map(d => d.rate)
  const maxAbs = Math.max(Math.abs(Math.min(...rates)), Math.abs(Math.max(...rates)), 0.00005)
  const yScale = (rate: number) => padding.top + chartH / 2 - (rate / maxAbs) * (chartH / 2)
  const zeroY = yScale(0)

  const barW = Math.max(1, (chartW / data.length) - 1)
  const gap = Math.max(0.5, (chartW - barW * data.length) / Math.max(data.length - 1, 1))

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left - padding.left
    const idx = Math.round(mouseX / ((barW + gap) || 1))
    const clamped = Math.max(0, Math.min(data.length - 1, idx))
    const snap = data[clamped]
    if (snap) {
      setTooltip({
        x: padding.left + clamped * (barW + gap) + barW / 2,
        y: yScale(snap.rate),
        snapshot: snap,
        range,
      })
    }
  }, [data, barW, gap, padding.left, range, yScale])

  const labelCount = range === '24h' ? 6 : range === '7d' ? 7 : 6
  const xLabels: { x: number; text: string }[] = []
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor((i / (labelCount - 1)) * (data.length - 1))
    const snap = data[idx]
    if (snap) {
      xLabels.push({
        x: padding.left + idx * (barW + gap) + barW / 2,
        text: formatTime(snap.timestamp, range),
      })
    }
  }

  const yTicks = [-maxAbs, -maxAbs / 2, 0, maxAbs / 2, maxAbs]

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left} x2={width - padding.right}
              y1={yScale(tick)} y2={yScale(tick)}
              stroke="rgba(255,255,255,0.06)" strokeDasharray={tick === 0 ? undefined : '2,3'}
            />
            <text
              x={padding.left - 4} y={yScale(tick) + 3}
              textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9}
            >
              {formatRate(tick)}
            </text>
          </g>
        ))}

        <line
          x1={padding.left} x2={width - padding.right}
          y1={zeroY} y2={zeroY}
          stroke="rgba(255,255,255,0.15)" strokeWidth={1}
        />

        {data.map((snap, i) => {
          const x = padding.left + i * (barW + gap)
          const barHeight = Math.abs(yScale(snap.rate) - zeroY)
          const barY = snap.rate >= 0 ? yScale(snap.rate) : zeroY
          const color = snap.rate >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
          return (
            <rect
              key={i}
              x={x} y={barY}
              width={barW} height={Math.max(barHeight, 0.5)}
              fill={color} opacity={0.8}
              rx={barW > 3 ? 1 : 0}
            />
          )
        })}

        {xLabels.map((lbl, i) => (
          <text key={i} x={lbl.x} y={height - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>
            {lbl.text}
          </text>
        ))}

        {tooltip && (
          <line
            x1={tooltip.x} x2={tooltip.x}
            y1={padding.top} y2={height - padding.bottom}
            stroke="rgba(255,255,255,0.2)" strokeDasharray="3,3"
          />
        )}
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-dark-50 border border-gray-700/40 rounded-lg px-3 py-2 text-xs shadow-xl z-10"
          style={{
            left: Math.min(tooltip.x, width - 180),
            top: Math.max(0, tooltip.y - 70),
          }}
        >
          <div className="text-gray-400 mb-1">
            {new Date(tooltip.snapshot.timestamp).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
            })}
          </div>
          <div className={`font-medium ${tooltip.snapshot.rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Rate: {formatRate(tooltip.snapshot.rate)}
          </div>
          <div className="text-gray-300">
            Annualized: {formatAnnualized(tooltip.snapshot.annualized)}
          </div>
        </div>
      )}
    </div>
  )
}

interface EmptyFundingChartProps {
  /** When `chain-offline` we render a Retry button; otherwise just copy. */
  status: FundingRateStatus
  onRetry: () => void
}

/**
 * Empty-state body shown when no live bars are available — either the
 * chain RPC is unreachable (`chain-offline`) or no indexer-backed series
 * is wired yet (`unknown`). Preserves the chart container's minimum
 * height so the surrounding layout doesn't jump as the status flips.
 *
 * The component accepts `'live'` for type symmetry with the parent's
 * `status` field, but is only mounted by the parent when the chart has
 * no bars to draw.
 */
function EmptyFundingChart({ status, onRetry }: EmptyFundingChartProps) {
  const message = status === 'chain-offline'
    ? 'No funding data — chain unreachable.'
    : 'No funding data yet.'

  return (
    <div
      data-testid="funding-rate-empty"
      data-status={status}
      role="status"
      className="flex flex-col items-center justify-center text-center px-4"
      style={{ minHeight: 200 }}
    >
      <div className="mb-3 text-sm text-gray-300">{message}</div>
      {status === 'chain-offline' && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-goodgreen px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-goodgreen-600 active:scale-[0.98]"
        >
          Retry now
        </button>
      )}
    </div>
  )
}

export function FundingRateChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<FundingRange>('7d')
  const { status, snapshots, refetch } = useFundingRateHistory(symbol, range)

  const hasBars = status === 'live' && snapshots.length > 0
  const avgRate = hasBars ? snapshots.reduce((s, d) => s + d.rate, 0) / snapshots.length : null
  const avgAnnualized = avgRate === null ? null : avgRate * 8760 * 100

  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/20">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold text-white">Funding Rate History</h3>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-gray-500">Avg:</span>
            {avgRate === null ? (
              <span className="text-gray-500" data-testid="funding-rate-avg">—</span>
            ) : (
              <span
                data-testid="funding-rate-avg"
                className={`font-medium ${avgRate >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {formatRate(avgRate)}
              </span>
            )}
            <span className="text-gray-600">|</span>
            {avgAnnualized === null ? (
              <span className="text-gray-500" data-testid="funding-rate-annualized">— ann.</span>
            ) : (
              <span
                data-testid="funding-rate-annualized"
                className={avgAnnualized >= 0 ? 'text-green-300' : 'text-red-300'}
              >
                {formatAnnualized(avgAnnualized)} ann.
              </span>
            )}
          </div>
          {hasBars && (
            <PriceSourceBadge source="chain-oracle" size="sm" />
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                range === r.value
                  ? 'bg-goodgreen/15 text-goodgreen'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 py-2">
        {hasBars ? (
          <BarChart data={snapshots} range={range} />
        ) : (
          <EmptyFundingChart status={status} onRetry={refetch} />
        )}
      </div>
    </div>
  )
}
