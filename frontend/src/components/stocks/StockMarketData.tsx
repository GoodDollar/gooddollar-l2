'use client'

import { useState } from 'react'
import { OrderBook } from '@/components/OrderBook'
import { RecentTrades } from '@/components/RecentTrades'

interface StockMarketDataProps {
  markPrice: number
}

const TABS = [
  { id: 'orderbook' as const, label: 'Order Book' },
  { id: 'trades' as const, label: 'Trades' },
]

type TabId = (typeof TABS)[number]['id']

export function StockMarketData({ markPrice }: StockMarketDataProps) {
  const [activeTab, setActiveTab] = useState<TabId>('orderbook')

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
        {activeTab === 'trades' && <RecentTrades markPrice={markPrice} />}
      </div>
    </div>
  )
}
