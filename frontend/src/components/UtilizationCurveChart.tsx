'use client'

import { useMemo } from 'react'
import type { LendReserve } from '@/lib/lendData'
import { getRateAtUtilization, getUtilizationRate, formatAPY } from '@/lib/lendData'

const W = 320
const H = 180
const PAD = { top: 20, right: 16, bottom: 32, left: 48 }
const CHART_W = W - PAD.left - PAD.right
const CHART_H = H - PAD.top - PAD.bottom
const STEPS = 100

interface Props {
  reserve: LendReserve
  dimmed?: boolean
}

export default function UtilizationCurveChart({ reserve, dimmed = false }: Props) {
  const currentUtil = getUtilizationRate(reserve)

  const { borrowPath, supplyPath, maxRate, kinkX, kinkBorrowY, currentX, currentBorrowY, currentSupplyY } = useMemo(() => {
    let peak = 0
    const borrowPts: [number, number][] = []
    const supplyPts: [number, number][] = []

    for (let i = 0; i <= STEPS; i++) {
      const u = i / STEPS
      const { borrowAPY, supplyAPY } = getRateAtUtilization(reserve, u)
      borrowPts.push([u, borrowAPY])
      supplyPts.push([u, supplyAPY])
      if (borrowAPY > peak) peak = borrowAPY
      if (supplyAPY > peak) peak = supplyAPY
    }

    peak = Math.max(peak, 0.01)
    const ceilRate = Math.ceil(peak * 10) / 10

    const toSvg = (pts: [number, number][]): string =>
      pts
        .map(([u, r], i) => {
          const x = PAD.left + u * CHART_W
          const y = PAD.top + CHART_H - (r / ceilRate) * CHART_H
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')

    const kX = PAD.left + reserve.optimalUtilization * CHART_W
    const kBorrow = getRateAtUtilization(reserve, reserve.optimalUtilization).borrowAPY
    const kY = PAD.top + CHART_H - (kBorrow / ceilRate) * CHART_H

    const cU = Math.min(currentUtil, 1)
    const cX = PAD.left + cU * CHART_W
    const { borrowAPY: cBorrow, supplyAPY: cSupply } = getRateAtUtilization(reserve, cU)
    const cBY = PAD.top + CHART_H - (cBorrow / ceilRate) * CHART_H
    const cSY = PAD.top + CHART_H - (cSupply / ceilRate) * CHART_H

    return {
      borrowPath: toSvg(borrowPts),
      supplyPath: toSvg(supplyPts),
      maxRate: ceilRate,
      kinkX: kX,
      kinkBorrowY: kY,
      currentX: cX,
      currentBorrowY: cBY,
      currentSupplyY: cSY,
    }
  }, [reserve, currentUtil])

  const yTicks = useMemo(() => {
    const count = 4
    return Array.from({ length: count + 1 }, (_, i) => {
      const rate = (i / count) * maxRate
      const y = PAD.top + CHART_H - (i / count) * CHART_H
      return { rate, y }
    })
  }, [maxRate])

  const xTicks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className={`rounded-xl border border-gray-700/40 bg-gray-800/30 p-3 ${dimmed ? 'opacity-40' : ''}`}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Interest Rate Model
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map(({ y }, i) => (
          <line key={`yg-${i}`} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#374151" strokeWidth={0.5} />
        ))}
        {xTicks.map((u, i) => {
          const x = PAD.left + u * CHART_W
          return <line key={`xg-${i}`} x1={x} y1={PAD.top} x2={x} y2={PAD.top + CHART_H} stroke="#374151" strokeWidth={0.5} />
        })}

        {/* Optimal utilization zone */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={reserve.optimalUtilization * CHART_W}
          height={CHART_H}
          fill="#10b981"
          opacity={0.04}
        />

        {/* Kink line */}
        <line
          x1={kinkX}
          y1={PAD.top}
          x2={kinkX}
          y2={PAD.top + CHART_H}
          stroke="#6b7280"
          strokeWidth={0.8}
          strokeDasharray="3,3"
        />

        {/* Supply APY curve */}
        <path d={supplyPath} fill="none" stroke="#10b981" strokeWidth={1.5} opacity={0.7} />

        {/* Borrow APY curve */}
        <path d={borrowPath} fill="none" stroke="#f59e0b" strokeWidth={1.8} />

        {/* Current utilization marker */}
        {currentUtil > 0 && (
          <>
            <line
              x1={currentX}
              y1={PAD.top}
              x2={currentX}
              y2={PAD.top + CHART_H}
              stroke="#818cf8"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            <circle cx={currentX} cy={currentBorrowY} r={3} fill="#f59e0b" stroke="#1f2937" strokeWidth={1} />
            <circle cx={currentX} cy={currentSupplyY} r={3} fill="#10b981" stroke="#1f2937" strokeWidth={1} />
          </>
        )}

        {/* Kink dot */}
        <circle cx={kinkX} cy={kinkBorrowY} r={2.5} fill="#6b7280" stroke="#1f2937" strokeWidth={0.8} />

        {/* Y-axis labels */}
        {yTicks.map(({ rate, y }, i) => (
          <text key={`yl-${i}`} x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize={8} fill="#9ca3af">
            {(rate * 100).toFixed(0)}%
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((u, i) => {
          const x = PAD.left + u * CHART_W
          return (
            <text key={`xl-${i}`} x={x} y={PAD.top + CHART_H + 14} textAnchor="middle" fontSize={8} fill="#9ca3af">
              {(u * 100).toFixed(0)}%
            </text>
          )
        })}

        {/* Axis titles */}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={8} fill="#6b7280">
          Utilization
        </text>
        <text
          x={8}
          y={PAD.top + CHART_H / 2}
          textAnchor="middle"
          fontSize={8}
          fill="#6b7280"
          transform={`rotate(-90, 8, ${PAD.top + CHART_H / 2})`}
        >
          APY
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="text-[9px] text-gray-400">Borrow</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-[9px] text-gray-400">Supply</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-indigo-400 inline-block" />
            <span className="text-[9px] text-gray-400">Current</span>
          </span>
        </div>
        {currentUtil > 0 && (
          <span className="text-[9px] text-gray-500">
            {(currentUtil * 100).toFixed(1)}% util · Borrow {formatAPY(getRateAtUtilization(reserve, currentUtil).borrowAPY)}
          </span>
        )}
      </div>
    </div>
  )
}
