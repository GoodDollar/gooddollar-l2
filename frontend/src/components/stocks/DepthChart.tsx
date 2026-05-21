'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import { computeDepthCurve, type DepthPoint } from '@/lib/computeDepthCurve'
import { formatStockPrice } from '@/lib/stockData'

interface DepthChartProps {
  oraclePrice: number
  height?: number
}

function formatSize(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

export function DepthChart({ oraclePrice, height = 280 }: DepthChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{ x: number; y: number; point: DepthPoint; side: 'buy' | 'sell' } | null>(null)

  const curve = useMemo(
    () => computeDepthCurve({ oraclePrice, steps: 50 }),
    [oraclePrice]
  )

  const padding = { top: 20, right: 16, bottom: 32, left: 60 }
  const chartWidth = 600
  const chartHeight = height
  const innerW = chartWidth - padding.left - padding.right
  const innerH = chartHeight - padding.top - padding.bottom

  const priceMin = curve.sellPoints[curve.sellPoints.length - 1].price
  const priceMax = curve.buyPoints[curve.buyPoints.length - 1].price
  const priceRange = priceMax - priceMin

  const scaleX = useCallback((size: number) => {
    return padding.left + (size / curve.maxSize) * innerW
  }, [curve.maxSize, innerW, padding.left])

  const scaleY = useCallback((price: number) => {
    return padding.top + innerH - ((price - priceMin) / priceRange) * innerH
  }, [innerH, padding.top, priceMin, priceRange])

  const oracleY = scaleY(oraclePrice)

  const buyPath = useMemo(() => {
    const points = curve.buyPoints.map(p => `${scaleX(p.size)},${scaleY(p.price)}`).join(' L ')
    const lastX = scaleX(curve.maxSize)
    const baseY = scaleY(oraclePrice)
    return `M ${scaleX(0)},${baseY} L ${points} L ${lastX},${baseY} Z`
  }, [curve, scaleX, scaleY, oraclePrice])

  const sellPath = useMemo(() => {
    const points = curve.sellPoints.map(p => `${scaleX(p.size)},${scaleY(p.price)}`).join(' L ')
    const lastX = scaleX(curve.maxSize)
    const baseY = scaleY(oraclePrice)
    return `M ${scaleX(0)},${baseY} L ${points} L ${lastX},${baseY} Z`
  }, [curve, scaleX, scaleY, oraclePrice])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * chartWidth
    const svgY = ((e.clientY - rect.top) / rect.height) * chartHeight

    const sizeRatio = Math.max(0, Math.min(1, (svgX - padding.left) / innerW))
    const index = Math.round(sizeRatio * 50)
    const clampedIdx = Math.max(0, Math.min(50, index))

    const isBuySide = svgY < oracleY
    const point = isBuySide ? curve.buyPoints[clampedIdx] : curve.sellPoints[clampedIdx]
    setHover({ x: svgX, y: svgY, point, side: isBuySide ? 'buy' : 'sell' })
  }, [chartWidth, chartHeight, padding.left, innerW, oracleY, curve])

  const sizeLabels = [0, 0.25, 0.5, 0.75, 1].map(r => ({
    x: scaleX(r * curve.maxSize),
    label: formatSize(r * curve.maxSize),
  }))

  const priceTicks = 5
  const priceLabels = Array.from({ length: priceTicks }, (_, i) => {
    const price = priceMin + (priceRange * i) / (priceTicks - 1)
    return { y: scaleY(price), label: formatStockPrice(price) }
  })

  return (
    <div data-testid="depth-chart" className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Buy area (above oracle line) */}
        <path d={buyPath} fill="rgba(239, 68, 68, 0.15)" stroke="rgb(239, 68, 68)" strokeWidth="1.5" />

        {/* Sell area (below oracle line) */}
        <path d={sellPath} fill="rgba(34, 197, 94, 0.15)" stroke="rgb(34, 197, 94)" strokeWidth="1.5" />

        {/* Oracle price reference line */}
        <line
          x1={padding.left}
          y1={oracleY}
          x2={chartWidth - padding.right}
          y2={oracleY}
          stroke="rgb(156, 163, 175)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        <text x={chartWidth - padding.right + 4} y={oracleY + 3} fontSize="9" fill="rgb(156, 163, 175)">
          Oracle
        </text>

        {/* Y-axis price labels */}
        {priceLabels.map((tick, i) => (
          <text key={i} x={padding.left - 6} y={tick.y + 3} fontSize="9" fill="rgb(107, 114, 128)" textAnchor="end">
            {tick.label}
          </text>
        ))}

        {/* X-axis size labels */}
        {sizeLabels.map((tick, i) => (
          <text key={i} x={tick.x} y={chartHeight - 8} fontSize="9" fill="rgb(107, 114, 128)" textAnchor="middle">
            {tick.label}
          </text>
        ))}

        {/* X-axis label */}
        <text x={chartWidth / 2} y={chartHeight - 0} fontSize="9" fill="rgb(75, 85, 99)" textAnchor="middle">
          Trade Size (USD)
        </text>

        {/* Hover crosshair */}
        {hover && (
          <>
            <line x1={hover.x} y1={padding.top} x2={hover.x} y2={chartHeight - padding.bottom} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx={hover.x} cy={scaleY(hover.point.price)} r="4" fill={hover.side === 'buy' ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'} />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          className="absolute pointer-events-none bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg z-10"
          style={{
            left: `${Math.min((hover.x / chartWidth) * 100, 75)}%`,
            top: `${Math.min((hover.y / chartHeight) * 100, 60)}%`,
          }}
        >
          <div className="text-gray-400">
            Size: <span className="text-white font-medium">${formatSize(hover.point.size)}</span>
          </div>
          <div className="text-gray-400">
            Price: <span className="text-white font-medium">{formatStockPrice(hover.point.price)}</span>
          </div>
          <div className="text-gray-400">
            Impact:{' '}
            <span className={hover.point.impact >= 0 ? 'text-red-400' : 'text-green-400'}>
              {hover.point.impact >= 0 ? '+' : ''}{hover.point.impact.toFixed(3)}%
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 px-2 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-400/30 border border-red-400" />
          <span>Buy Impact (cost)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-400/30 border border-green-400" />
          <span>Sell Impact (receive)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-0 border-t border-dashed border-gray-400" />
          <span>Oracle Price</span>
        </div>
      </div>
    </div>
  )
}
