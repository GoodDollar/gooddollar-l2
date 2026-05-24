'use client'

import { useState } from 'react'
import { formatPerpsPrice, formatFundingRate } from '@/lib/perpsData'
import {
  useOpenOrders,
  useOrderHistory,
  useTradeHistory,
  useFundingHistory,
  type HistoryOpenOrder,
  type OrderHistoryItem,
  type TradeHistoryItem,
  type FundingHistoryItem,
} from '@/lib/perpsHistoryData'
import { ScrollStrip } from '@/components/ScrollStrip'
import { EmptyState } from '@/components/ui/empty-state'

// ─── Formatters ───────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function dateStr(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Side badge ───────────────────────────────────────────────────────────────

function SideBadge({ side, leverage }: { side: 'long' | 'short'; leverage?: number }) {
  const isLong = side === 'long'
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
      isLong ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
    }`}>
      {side.toUpperCase()}{leverage ? ` ${leverage}x` : ''}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    filled: 'bg-green-500/15 text-green-400',
    partial: 'bg-yellow-500/15 text-yellow-400',
    cancelled: 'bg-gray-500/15 text-gray-400',
    expired: 'bg-gray-500/15 text-gray-500',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${styles[status] ?? 'bg-gray-500/15 text-gray-400'}`}>
      {status}
    </span>
  )
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OpenOrdersPanel({ orders }: { orders: readonly HistoryOpenOrder[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        title="No open orders"
        description="Open limit & stop orders will appear here once the perps on-chain event indexer is wired and orders are placed via the ticket above."
      />
    )
  }
  // NOTE: the `Cancel` column was removed alongside the mock data drop in
  // task 0017 — the previous `<button>` had no onClick, so a click on a
  // user's "own" order silently did nothing. The real cancel wiring will
  // be added back when on-chain order indexing ships.
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700/20">
            <th className="text-left py-2 px-3 font-medium">Pair</th>
            <th className="text-left py-2 px-2 font-medium">Side</th>
            <th className="text-left py-2 px-2 font-medium">Type</th>
            <th className="text-right py-2 px-2 font-medium">Price</th>
            <th className="text-right py-2 px-2 font-medium">Size</th>
            <th className="text-right py-2 px-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-b border-gray-700/10 hover:bg-white/[0.02] transition-colors">
              <td className="py-2 px-3 text-white font-medium">{o.pair}</td>
              <td className="py-2 px-2"><SideBadge side={o.side} leverage={o.leverage} /></td>
              <td className="py-2 px-2 text-gray-400 capitalize">{o.type}</td>
              <td className="py-2 px-2 text-right text-white">{formatPerpsPrice(o.price)}</td>
              <td className="py-2 px-2 text-right text-white">{o.size}</td>
              <td className="py-2 px-3 text-right text-gray-500">{timeAgo(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrderHistoryPanel({ orders }: { orders: readonly OrderHistoryItem[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        title="No order history"
        description="Past orders will appear here once on-chain order events are indexed."
      />
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[600px]">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700/20">
            <th className="text-left py-2 px-3 font-medium">Pair</th>
            <th className="text-left py-2 px-2 font-medium">Side</th>
            <th className="text-left py-2 px-2 font-medium">Type</th>
            <th className="text-right py-2 px-2 font-medium">Price</th>
            <th className="text-right py-2 px-2 font-medium">Size</th>
            <th className="text-right py-2 px-2 font-medium">Filled</th>
            <th className="text-center py-2 px-2 font-medium">Status</th>
            <th className="text-right py-2 px-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-b border-gray-700/10 hover:bg-white/[0.02] transition-colors">
              <td className="py-2 px-3 text-white font-medium">{o.pair}</td>
              <td className="py-2 px-2"><SideBadge side={o.side} /></td>
              <td className="py-2 px-2 text-gray-400 capitalize">{o.type}</td>
              <td className="py-2 px-2 text-right text-white">{formatPerpsPrice(o.price)}</td>
              <td className="py-2 px-2 text-right text-white">{o.size}</td>
              <td className="py-2 px-2 text-right text-gray-300">{o.filledSize}/{o.size}</td>
              <td className="py-2 px-2 text-center"><StatusBadge status={o.status} /></td>
              <td className="py-2 px-3 text-right text-gray-500">{dateStr(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TradeHistoryPanel({ trades }: { trades: readonly TradeHistoryItem[] }) {
  if (trades.length === 0) {
    return (
      <EmptyState
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
        title="No trade history"
        description="Executed trades will appear here once on-chain fill events are indexed."
      />
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[560px]">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700/20">
            <th className="text-left py-2 px-3 font-medium">Pair</th>
            <th className="text-left py-2 px-2 font-medium">Side</th>
            <th className="text-right py-2 px-2 font-medium">Price</th>
            <th className="text-right py-2 px-2 font-medium">Size</th>
            <th className="text-right py-2 px-2 font-medium">Fee</th>
            <th className="text-right py-2 px-2 font-medium">P&L</th>
            <th className="text-right py-2 px-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.map(t => (
            <tr key={t.id} className="border-b border-gray-700/10 hover:bg-white/[0.02] transition-colors">
              <td className="py-2 px-3 text-white font-medium">{t.pair}</td>
              <td className="py-2 px-2"><SideBadge side={t.side} /></td>
              <td className="py-2 px-2 text-right text-white">{formatPerpsPrice(t.price)}</td>
              <td className="py-2 px-2 text-right text-white">{t.size}</td>
              <td className="py-2 px-2 text-right text-gray-400">{formatPerpsPrice(t.fee)}</td>
              <td className={`py-2 px-2 text-right font-medium ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {t.pnl >= 0 ? '+' : ''}{formatPerpsPrice(t.pnl)}
              </td>
              <td className="py-2 px-3 text-right text-gray-500">{dateStr(t.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FundingHistoryPanel({ payments }: { payments: readonly FundingHistoryItem[] }) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        title="No funding payments"
        description="Funding payments will appear here once on-chain funding events are indexed."
      />
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="text-gray-500 border-b border-gray-700/20">
            <th className="text-left py-2 px-3 font-medium">Pair</th>
            <th className="text-right py-2 px-2 font-medium">Rate</th>
            <th className="text-right py-2 px-2 font-medium">Position</th>
            <th className="text-right py-2 px-2 font-medium">Payment</th>
            <th className="text-right py-2 px-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(f => (
            <tr key={f.id} className="border-b border-gray-700/10 hover:bg-white/[0.02] transition-colors">
              <td className="py-2 px-3 text-white font-medium">{f.pair}</td>
              <td className={`py-2 px-2 text-right font-medium ${f.rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatFundingRate(f.rate)}
              </td>
              <td className="py-2 px-2 text-right text-gray-300">{f.positionSize}</td>
              <td className={`py-2 px-2 text-right font-medium ${f.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {f.amount >= 0 ? '+' : ''}{formatPerpsPrice(f.amount)}
              </td>
              <td className="py-2 px-3 text-right text-gray-500">{dateStr(f.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type HistoryTab = 'open-orders' | 'order-history' | 'trade-history' | 'funding-history'

const TAB_CONFIG: { id: HistoryTab; label: string }[] = [
  { id: 'open-orders', label: 'Open Orders' },
  { id: 'order-history', label: 'Order History' },
  { id: 'trade-history', label: 'Trade History' },
  { id: 'funding-history', label: 'Funding History' },
]

export function PerpsHistoryTabs() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('open-orders')
  const openOrders = useOpenOrders()
  const orderHistory = useOrderHistory()
  const tradeHistory = useTradeHistory()
  const fundingHistory = useFundingHistory()

  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
      <div className="border-b border-gray-700/20">
        <ScrollStrip
          className="flex"
          ariaLabel="Perps history tabs"
          fadeFromClass="from-dark-100"
        >
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-goodgreen border-goodgreen'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </ScrollStrip>
      </div>

      <div className="min-h-[120px]">
        {activeTab === 'open-orders' && <OpenOrdersPanel orders={openOrders} />}
        {activeTab === 'order-history' && <OrderHistoryPanel orders={orderHistory} />}
        {activeTab === 'trade-history' && <TradeHistoryPanel trades={tradeHistory} />}
        {activeTab === 'funding-history' && <FundingHistoryPanel payments={fundingHistory} />}
      </div>
    </div>
  )
}
