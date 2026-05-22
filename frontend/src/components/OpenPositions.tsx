'use client'

import { useState } from 'react'
import { formatPerpsPrice, type OpenPosition } from '@/lib/perpsData'
import { useOnChainPositions } from '@/lib/useOnChainPerps'
import { calculatePnLPercent, getLiqProximity, type LiqProximity } from '@/lib/perpUtils'

const LIQ_BADGE_STYLES: Record<LiqProximity, string> = {
  safe: '',
  warning: 'bg-yellow-500/15 text-yellow-400',
  danger: 'bg-orange-500/15 text-orange-400',
  critical: 'bg-red-500/15 text-red-300 animate-pulse',
}

const LIQ_BADGE_LABELS: Record<LiqProximity, string> = {
  safe: '',
  warning: 'Liq Near',
  danger: 'Liq Close',
  critical: 'Liq Imminent',
}

function LiqBadge({ proximity }: { proximity: LiqProximity }) {
  if (proximity === 'safe') return null
  return (
    <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${LIQ_BADGE_STYLES[proximity]}`}>
      {LIQ_BADGE_LABELS[proximity]}
    </span>
  )
}

function PositionRow({ pos }: { pos: OpenPosition }) {
  const [showClose, setShowClose] = useState(false)
  const [closing, setClosing] = useState(false)

  const pnlPercent = calculatePnLPercent(pos.entryPrice, pos.markPrice, pos.leverage, pos.side)
  const netValue = pos.margin + pos.unrealizedPnl
  const liqProximity = getLiqProximity(pos.markPrice, pos.liquidationPrice, pos.side)
  const isProfit = pos.unrealizedPnl >= 0
  const pnlColor = isProfit ? 'text-green-400' : 'text-red-400'

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setShowClose(false)
    }, 2000)
  }

  return (
    <div className="px-3 py-3 border-b border-gray-700/10 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{pos.pair}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${pos.side === 'long' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {pos.side.toUpperCase()} {pos.leverage}x
          </span>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${pnlColor}`}>
            {isProfit ? '+' : ''}{formatPerpsPrice(pos.unrealizedPnl)}
          </div>
          <div className={`text-[10px] font-medium ${pnlColor}`}>
            {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-[11px] mb-2">
        <div className="flex flex-col">
          <span className="text-gray-500">Entry Price</span>
          <span className="text-gray-300 font-medium">{formatPerpsPrice(pos.entryPrice)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Mark Price</span>
          <span className="text-white font-medium">{formatPerpsPrice(pos.markPrice)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Liq. Price</span>
          <span className="text-yellow-400 font-medium">
            {formatPerpsPrice(pos.liquidationPrice)}
            <LiqBadge proximity={liqProximity} />
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">Net Value</span>
          <span className="text-gray-200 font-medium">{formatPerpsPrice(netValue)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">Size <span className="text-gray-300 ml-0.5">{pos.size}</span></span>
          <span className="text-gray-500">Margin <span className="text-gray-300 ml-0.5">{formatPerpsPrice(pos.margin)}</span></span>
          <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-500 bg-dark-50/50">{pos.marginMode}</span>
        </div>

        <div>
          {showClose ? (
            <div className="flex gap-2">
              <button onClick={handleClose} disabled={closing}
                className="px-3 py-1 text-xs rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50">
                {closing ? 'Closing...' : 'Confirm'}
              </button>
              <button onClick={() => setShowClose(false)} className="px-3 py-1 text-xs rounded-lg text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowClose(true)} className="px-3 py-1 text-xs rounded-lg text-gray-400 hover:text-red-400 border border-gray-700/30 hover:border-red-500/30 transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function OpenPositions() {
  const { positions } = useOnChainPositions()

  if (positions.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-xs">
        No open positions
      </div>
    )
  }

  return (
    <div>
      {positions.map((pos, i) => (
        <PositionRow key={`${pos.pair}-${i}`} pos={pos} />
      ))}
    </div>
  )
}
