'use client'

import { useMemo } from 'react'
import { formatPerpsPrice } from '@/lib/perpsData'

interface OrderBookEntry {
  price: number
  size: number
  total: number
}

// Task 0097: Real CLOBs aggregate continuous-float prices to a displayed tick.
// `formatPerpsPrice` rounds prices >= $1000 to 2 decimals, so adjacent
// generated levels often collapse to the same display string and render as
// visual duplicates. Group consecutive entries that share a formatted-price
// key into one row whose size is the sum and whose total is the largest
// total of the merged group (the deepest member's total) — that preserves
// "rows farther from spread show greater depth" in either render ordering.
export function aggregateBookLevels(
  entries: OrderBookEntry[],
  format: (price: number) => string,
): OrderBookEntry[] {
  if (entries.length === 0) return []
  const out: OrderBookEntry[] = []
  let groupKey = format(entries[0].price)
  let groupPrice = entries[0].price
  let groupSize = entries[0].size
  let groupTotal = entries[0].total
  for (let i = 1; i < entries.length; i++) {
    const e = entries[i]
    const k = format(e.price)
    if (k === groupKey) {
      groupSize += e.size
      if (e.total > groupTotal) groupTotal = e.total
    } else {
      out.push({ price: groupPrice, size: groupSize, total: groupTotal })
      groupKey = k
      groupPrice = e.price
      groupSize = e.size
      groupTotal = e.total
    }
  }
  out.push({ price: groupPrice, size: groupSize, total: groupTotal })
  return out
}

// Exported for unit testing. Task 0082: bid and ask levels MUST be strictly
// monotonic in price. The per-level random jitter `i * tickSize * (1 + r*0.5)`
// can invert adjacent levels for i >= 3, so we sort explicitly after generation
// and recompute cumulative totals in render order (best-quote = smallest total,
// deepest level = largest total) instead of trusting push order.
export function generateOrderBook(
  midPrice: number,
  levels: number = 12,
): { bids: OrderBookEntry[]; asks: OrderBookEntry[]; spread: number } {
  const bids: OrderBookEntry[] = []
  const asks: OrderBookEntry[] = []

  const tickSize = midPrice > 1000 ? 1 : midPrice > 10 ? 0.01 : 0.0001

  for (let i = 1; i <= levels; i++) {
    const bidPrice = midPrice - i * tickSize * (1 + Math.random() * 0.5)
    const askPrice = midPrice + i * tickSize * (1 + Math.random() * 0.5)
    const bidSize = parseFloat((0.5 + Math.random() * 5).toFixed(3))
    const askSize = parseFloat((0.5 + Math.random() * 5).toFixed(3))
    bids.push({ price: bidPrice, size: bidSize, total: 0 })
    asks.push({ price: askPrice, size: askSize, total: 0 })
  }

  bids.sort((a, b) => b.price - a.price)
  asks.sort((a, b) => a.price - b.price)

  let bidSum = 0
  for (const b of bids) {
    bidSum += b.size
    b.total = bidSum
  }
  let askSum = 0
  for (const a of asks) {
    askSum += a.size
    a.total = askSum
  }

  const spread = asks[0].price - bids[0].price
  return { bids, asks: asks.reverse(), spread }
}

interface OrderBookProps {
  markPrice: number
}

// Render exactly this many rows on each side, so best bid and best ask
// are always visible (no scroll required). Six is enough vertical density
// to show meaningful depth without overflowing the sidebar.
const VISIBLE_ROWS = 6

export function OrderBook({ markPrice }: OrderBookProps) {
  const { visibleBids, visibleAsks, displaySpread, maxTotal } = useMemo(() => {
    const { bids, asks } = generateOrderBook(markPrice)
    // bids: best→deep order, asks: deep→best order (post-reverse).
    // Aggregate each side independently so adjacent levels that round to
    // the same display string collapse into one row.
    const aggBids = aggregateBookLevels(bids, formatPerpsPrice)
    const aggAsks = aggregateBookLevels(asks, formatPerpsPrice)
    const vBids = aggBids.slice(0, VISIBLE_ROWS) // first N = nearest the spread
    const vAsks = aggAsks.slice(-VISIBLE_ROWS) // last N = nearest the spread
    // Spread label must reflect the visible best quotes, otherwise the
    // displayed delta can disagree with the rows the user can actually see.
    const bestAsk = vAsks[vAsks.length - 1]?.price ?? 0
    const bestBid = vBids[0]?.price ?? 0
    const spread = Math.max(0, bestAsk - bestBid)
    const max = Math.max(
      vBids[vBids.length - 1]?.total ?? 0,
      vAsks[0]?.total ?? 0,
    )
    return { visibleBids: vBids, visibleAsks: vAsks, displaySpread: spread, maxTotal: max }
  }, [markPrice])

  return (
    <div className="text-xs">
      <div className="flex justify-between text-gray-500 px-2 py-1.5 border-b border-gray-700/20">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className="divide-y divide-gray-700/5">
        {visibleAsks.map((a, i) => (
          <div key={`a-${i}`} className="flex justify-between px-2 py-1 relative">
            <div className="absolute inset-y-0 right-0 bg-red-500/8 transition-all" style={{ width: `${(a.total / maxTotal) * 100}%` }} />
            <span className="text-red-400 z-10">{formatPerpsPrice(a.price)}</span>
            <span className="text-gray-300 z-10">{a.size.toFixed(3)}</span>
            <span className="text-gray-500 z-10">{a.total.toFixed(3)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center py-2 border-y border-gray-700/20 bg-dark-50/30">
        <span className="text-white font-semibold mr-2">{formatPerpsPrice(markPrice)}</span>
        <span className="text-gray-500 text-[10px]">Spread: {formatPerpsPrice(displaySpread)}</span>
      </div>

      <div className="divide-y divide-gray-700/5">
        {visibleBids.map((b, i) => (
          <div key={`b-${i}`} className="flex justify-between px-2 py-1 relative">
            <div className="absolute inset-y-0 right-0 bg-green-500/8 transition-all" style={{ width: `${(b.total / maxTotal) * 100}%` }} />
            <span className="text-green-400 z-10">{formatPerpsPrice(b.price)}</span>
            <span className="text-gray-300 z-10">{b.size.toFixed(3)}</span>
            <span className="text-gray-500 z-10">{b.total.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
