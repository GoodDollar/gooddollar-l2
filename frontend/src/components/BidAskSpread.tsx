'use client'

import { useRef, useEffect, useState } from 'react'
import { formatStockPrice, DEFAULT_STOCK_SPREAD_BPS } from '@/lib/stockData'

interface BidAskSpreadProps {
  price: number
  spreadBps?: number
}

export function BidAskSpread({ price, spreadBps = DEFAULT_STOCK_SPREAD_BPS }: BidAskSpreadProps) {
  const spreadFraction = spreadBps / 10_000
  const bid = price * (1 - spreadFraction / 2)
  const ask = price * (1 + spreadFraction / 2)
  const spreadCents = (ask - bid) * 100

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Bid</span>
        <span className="text-red-400 font-medium tabular-nums">{formatStockPrice(bid)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Ask</span>
        <span className="text-green-400 font-medium tabular-nums">{formatStockPrice(ask)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-600">Spread</span>
        <span className="text-gray-400 tabular-nums">{spreadCents.toFixed(1)}¢ ({spreadBps}bps)</span>
      </div>
    </div>
  )
}

type TickDirection = 'up' | 'down' | null

export function PriceWithTick({ price, className = '' }: { price: number; className?: string }) {
  const prevPriceRef = useRef(price)
  const [tick, setTick] = useState<TickDirection>(null)

  useEffect(() => {
    if (price !== prevPriceRef.current) {
      setTick(price > prevPriceRef.current ? 'up' : 'down')
      prevPriceRef.current = price
      const timer = setTimeout(() => setTick(null), 600)
      return () => clearTimeout(timer)
    }
  }, [price])

  const tickClass = tick === 'up'
    ? 'animate-tick-up'
    : tick === 'down'
      ? 'animate-tick-down'
      : ''

  return (
    <span className={`${className} ${tickClass} transition-colors duration-300`}>
      {formatStockPrice(price)}
    </span>
  )
}
