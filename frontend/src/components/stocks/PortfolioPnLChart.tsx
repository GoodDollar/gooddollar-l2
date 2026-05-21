'use client'

import { useMemo } from 'react'
import { formatStockPrice } from '@/lib/stockData'

type TrendRange = '1W' | '1M' | '3M' | '1Y'
const RANGES: TrendRange[] = ['1W', '1M', '3M', '1Y']

function buildPath(values: number[], width: number, height: number, padding = 8): string {
  if (values.length === 0) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)
  return values.map((v, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * (width - padding * 2)
    const y = padding + (1 - (v - min) / range) * (height - padding * 2)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

function buildAreaPath(values: number[], width: number, height: number, padding = 8): string {
  if (values.length === 0) return ''
  const linePath = buildPath(values, width, height, padding)
  const lastX = padding + ((values.length - 1) / Math.max(values.length - 1, 1)) * (width - padding * 2)
  const firstX = padding
  return `${linePath} L${lastX.toFixed(1)} ${height} L${firstX.toFixed(1)} ${height} Z`
}

interface PortfolioPnLChartProps {
  values: number[]
  range: TrendRange
  onRangeChange: (range: TrendRange) => void
  currentValue: number
  unrealizedPnl: number
  height?: number
}

export function PortfolioPnLChart({ values, range, onRangeChange, currentValue, unrealizedPnl, height = 200 }: PortfolioPnLChartProps) {
  const width = 400
  const linePath = useMemo(() => buildPath(values, width, height), [values, width, height])
  const areaPath = useMemo(() => buildAreaPath(values, width, height), [values, width, height])
  const isPositive = unrealizedPnl >= 0
  const strokeColor = isPositive ? '#19f39f' : '#f87171'
  const fillColor = isPositive ? 'rgba(25,243,159,0.08)' : 'rgba(248,113,113,0.08)'

  return (
    <div data-testid="portfolio-pnl-chart">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl font-bold text-white">{formatStockPrice(currentValue)}</div>
          <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : '-'}{formatStockPrice(Math.abs(unrealizedPnl))}
          </div>
        </div>
        <div className="flex gap-0.5 rounded-lg bg-dark-50/60 p-0.5">
          {RANGES.map(r => (
            <button key={r} type="button" onClick={() => onRangeChange(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${range === r ? 'bg-dark-200 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl border border-gray-700/20 bg-dark-50/30" style={{ height }} preserveAspectRatio="none" role="img" aria-label={`Portfolio P&L chart ${range}`}>
        <path d={areaPath} fill={fillColor} />
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
