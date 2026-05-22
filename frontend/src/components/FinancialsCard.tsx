'use client'

import { useState } from 'react'
import { getStockFinancials, formatLargeNumber } from '@/lib/stockData'
import type { QuarterlyFinancial } from '@/lib/stockData'

interface FinancialsCardProps {
  ticker: string
}

function EpsBadge({ actual, estimate }: { actual: number; estimate: number }) {
  const beat = actual >= estimate
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
      beat ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
    }`}>
      {beat ? '✓ Beat' : '✗ Miss'}
    </span>
  )
}

function RevenueBar({ quarter, maxRevenue }: { quarter: QuarterlyFinancial; maxRevenue: number }) {
  const pct = (quarter.revenue / maxRevenue) * 100
  return (
    <div className="flex items-end gap-1.5 flex-1 min-w-0">
      <div className="flex flex-col items-center flex-1">
        <div className="w-full bg-gray-800 rounded-sm overflow-hidden h-16 flex items-end">
          <div
            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm transition-all"
            style={{ height: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">
          {quarter.quarter.replace('20', "'")}
        </span>
      </div>
    </div>
  )
}

export function FinancialsCard({ ticker }: FinancialsCardProps) {
  const [expanded, setExpanded] = useState(false)
  const financials = getStockFinancials(ticker)

  if (!financials) return null

  const { nextEarningsDate, quarters } = financials
  const maxRevenue = Math.max(...quarters.map(q => q.revenue))
  const lastQuarter = quarters[0]

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-white">Financials & Earnings</h3>
          <span className="text-xs text-gray-500">
            Next: {nextEarningsDate}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-800/60">
          {/* Earnings summary */}
          <div className="pt-3 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500">Last Quarter ({lastQuarter.quarter})</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-white font-medium">
                  EPS ${lastQuarter.eps.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  vs est. ${lastQuarter.epsEstimate.toFixed(2)}
                </span>
                <EpsBadge actual={lastQuarter.eps} estimate={lastQuarter.epsEstimate} />
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Revenue</span>
              <p className="text-sm text-white font-medium">
                {formatLargeNumber(lastQuarter.revenue)}
              </p>
            </div>
          </div>

          {/* Revenue bar chart */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Quarterly Revenue</p>
            <div className="flex gap-2">
              {[...quarters].reverse().map(q => (
                <RevenueBar key={q.quarter} quarter={q} maxRevenue={maxRevenue} />
              ))}
            </div>
          </div>

          {/* EPS history */}
          <div>
            <p className="text-xs text-gray-500 mb-2">EPS History</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quarters.map(q => (
                <div key={q.quarter} className="bg-gray-800/40 rounded-lg px-2.5 py-2">
                  <span className="text-[10px] text-gray-500 block">{q.quarter}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-white font-medium">${q.eps.toFixed(2)}</span>
                    <EpsBadge actual={q.eps} estimate={q.epsEstimate} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
