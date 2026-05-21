'use client'

import { useState } from 'react'

type TabId = 'about' | 'how' | 'guides'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'about', label: 'About' },
  { id: 'how', label: 'How to Buy' },
  { id: 'guides', label: 'Guides' },
]

export function StockResearchHub({
  ticker,
  companyName,
  sector,
  summary,
}: {
  ticker: string
  companyName: string
  sector: string
  summary: string
}) {
  const [activeTab, setActiveTab] = useState<TabId>('about')

  return (
    <section className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4" aria-label="Stock research hub">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-white">Research Hub</h2>
        <span className="text-[11px] text-gray-500">{ticker}</span>
      </div>

      <div role="tablist" aria-label="Stock research tabs" className="flex flex-wrap gap-1.5 mb-4">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active ? 'bg-goodgreen/15 text-goodgreen ring-1 ring-goodgreen/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'about' && (
        <div className="space-y-2 text-sm text-gray-300">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Company Context</p>
          {summary ? (
            <p>{summary}</p>
          ) : (
            <p>Research context for {ticker} is loading. Check back for a fuller business profile.</p>
          )}
          <p>
            <span className="text-gray-500">Sector:</span> {sector}
          </p>
          <p>
            <span className="text-gray-500">Ticker:</span> {ticker} ({companyName})
          </p>
        </div>
      )}

      {activeTab === 'how' && (
        <div className="space-y-2 text-sm text-gray-300">
          <p className="text-xs text-gray-500 uppercase tracking-wide">How To Buy {ticker}</p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Connect your wallet from the top-right action.</li>
            <li>Use the Buy/Sell rail on this page to choose side and order type.</li>
            <li>Set size, review fees and UBI contribution, then submit.</li>
          </ol>
        </div>
      )}

      {activeTab === 'guides' && (
        <div className="space-y-2 text-sm text-gray-300">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Top Guides</p>
          <ul className="space-y-1.5">
            <li className="rounded-lg border border-gray-700/30 bg-dark-50/35 px-3 py-2">Trading checklist: confirm trend, liquidity, and order side.</li>
            <li className="rounded-lg border border-gray-700/30 bg-dark-50/35 px-3 py-2">Risk primer: size positions for volatility and stop discipline.</li>
            <li className="rounded-lg border border-gray-700/30 bg-dark-50/35 px-3 py-2">Synthetic stocks 101: oracle pricing and route mechanics.</li>
          </ul>
        </div>
      )}
    </section>
  )
}
