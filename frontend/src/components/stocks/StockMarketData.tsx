'use client'

import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { OrderBook } from '@/components/OrderBook'
import { RecentTrades } from '@/components/RecentTrades'
import { useStockTrades } from '@/lib/useStockTrades'

interface StockMarketDataProps {
  markPrice: number
  symbol?: string
}

const TABS = [
  { id: 'orderbook' as const, label: 'Order Book' },
  { id: 'trades' as const, label: 'Trades' },
]

type TabId = (typeof TABS)[number]['id']

const RECENT_TRADES_LIMIT = 20

export function StockMarketData({ markPrice, symbol }: StockMarketDataProps) {
  const [activeTab, setActiveTab] = useState<TabId>('orderbook')
  const { address } = useAccount()
  const { trades } = useStockTrades(address)
  const symbolTrades = useMemo(() => {
    if (!symbol) return trades.slice(0, RECENT_TRADES_LIMIT)
    return trades.filter(t => t.ticker === symbol).slice(0, RECENT_TRADES_LIMIT)
  }, [trades, symbol])

  return (
    <div className="mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
      <div className="flex border-b border-gray-700/20" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-goodgreen bg-goodgreen/5'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-0">
        {activeTab === 'orderbook' && <OrderBook markPrice={markPrice} />}
        {activeTab === 'trades' && (
          <RecentTrades trades={symbolTrades} symbol={symbol} markPrice={markPrice} />
        )}
      </div>
    </div>
  )
}
