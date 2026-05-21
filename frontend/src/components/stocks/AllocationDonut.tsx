'use client'

import { useMemo } from 'react'

const COLORS = ['#19f39f', '#06b6d4', '#a78bfa', '#f59e0b', '#f87171', '#818cf8', '#34d399', '#e879f9']

interface Segment {
  ticker: string
  pct: number
}

interface AllocationDonutProps {
  segments: Segment[]
  size?: number
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function AllocationDonut({ segments, size = 160 }: AllocationDonutProps) {
  const arcs = useMemo(() => {
    let startAngle = 0
    return segments.map((seg, i) => {
      const sweep = (seg.pct / 100) * 360
      const arc = { ...seg, startAngle, endAngle: startAngle + Math.min(sweep, 359.9), color: COLORS[i % COLORS.length] as string }
      startAngle += sweep
      return arc
    })
  }, [segments])

  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * 0.6

  if (segments.length === 0) {
    return (
      <div data-testid="allocation-donut" className="flex flex-col items-center">
        <svg width={size} height={size} className="opacity-30">
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#374151" strokeWidth={outerR - innerR} />
        </svg>
        <p className="text-xs text-gray-500 mt-2">No positions</p>
      </div>
    )
  }

  return (
    <div data-testid="allocation-donut" className="flex flex-col items-center">
      <svg width={size} height={size}>
        {arcs.map(arc => (
          <path
            key={arc.ticker}
            d={describeArc(cx, cy, (outerR + innerR) / 2, arc.startAngle, arc.endAngle)}
            fill="none"
            stroke={arc.color}
            strokeWidth={outerR - innerR}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {arcs.map(arc => (
          <div key={arc.ticker} className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: arc.color }} />
            <span className="text-gray-300">{arc.ticker}</span>
            <span className="text-gray-500">{arc.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
