'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatStockPrice, type PortfolioHolding, type TradeRecord } from '@/lib/stockData'

function HoldingRow({ holding, onClick }: { holding: PortfolioHolding; onClick: () => void }) {
  const value = holding.shares * holding.currentPrice
  const cost = holding.shares * holding.avgCost
  const pnl = value - cost
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0

  return (
    <tr onClick={onClick} className="border-b border-gray-700/10 hover:bg-white/[0.04] cursor-pointer transition-colors">
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center text-[9px] font-bold text-goodgreen">
            {holding.ticker.slice(0, 2)}
          </div>
          <span className="font-medium text-white text-sm">{holding.ticker}</span>
        </div>
      </td>
      <td className="py-3 px-3 text-right text-white text-sm">{holding.shares.toFixed(2)}</td>
      <td className="py-3 px-3 text-right text-gray-300 text-sm hidden sm:table-cell">{formatStockPrice(holding.avgCost)}</td>
      <td className="py-3 px-3 text-right text-white text-sm">{formatStockPrice(holding.currentPrice)}</td>
      <td className="py-3 px-3 text-right text-white text-sm hidden sm:table-cell">{formatStockPrice(value)}</td>
      <td className={`py-3 px-3 text-right text-sm font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {pnl >= 0 ? '+' : ''}{formatStockPrice(pnl)}
        <span className="text-xs ml-1 opacity-70">({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
      </td>
    </tr>
  )
}

function TradeRow({ trade }: { trade: TradeRecord }) {
  const date = new Date(trade.timestamp)
  return (
    <tr className="border-b border-gray-700/10">
      <td className="py-3 px-3 text-sm text-white">{trade.ticker}</td>
      <td className="py-3 px-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.side === 'buy' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {trade.side.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-3 text-right text-gray-300 text-sm">{trade.shares.toFixed(2)}</td>
      <td className="py-3 px-3 text-right text-white text-sm">{formatStockPrice(trade.price)}</td>
      <td className="py-3 px-3 text-right text-gray-400 text-sm hidden sm:table-cell">
        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </td>
      <td className={`py-3 px-3 text-right text-sm font-medium ${trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-gray-500'}`}>
        {trade.pnl !== 0 ? `${trade.pnl > 0 ? '+' : ''}${formatStockPrice(trade.pnl)}` : '—'}
      </td>
    </tr>
  )
}

export function PortfolioTabs({
  holdings,
  trades,
  isDisconnected,
  isLoading,
}: {
  holdings: PortfolioHolding[]
  trades: TradeRecord[]
  isDisconnected: boolean
  isLoading: boolean
}) {
  const router = useRouter()

  return (
    <Tabs defaultValue="holdings" className="bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden">
      <TabsList className="w-full justify-start rounded-none border-b border-gray-700/20 bg-transparent p-0 h-auto">
        <TabsTrigger
          value="holdings"
          className="px-5 py-3 text-sm font-medium transition-colors rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-goodgreen data-[state=active]:shadow-none text-gray-400 hover:text-white"
        >
          Holdings ({holdings.length})
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="px-5 py-3 text-sm font-medium transition-colors rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-goodgreen data-[state=active]:shadow-none text-gray-400 hover:text-white"
        >
          History ({trades.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="holdings">
        {isDisconnected ? (
          <div className="py-16 text-center">
            <p className="text-gray-300 text-sm mb-1">Connect wallet to unlock your holdings timeline</p>
            <p className="text-gray-500 text-xs mb-4">Preview cards above show the metrics you will get after connection.</p>
            <Link href="/stocks" className="text-goodgreen text-sm hover:underline">Browse Stocks</Link>
          </div>
        ) : isLoading ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">Loading positions…</p>
          </div>
        ) : holdings.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-gray-400 text-sm mb-1">No positions yet</p>
            <p className="text-gray-600 text-xs mb-4">Start trading to build your portfolio</p>
            <Link href="/stocks" className="text-goodgreen text-sm hover:underline">Browse Stocks</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/30 text-gray-400">
                  <th className="text-left py-2.5 px-3 font-semibold">Stock</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Shares</th>
                  <th className="text-right py-2.5 px-3 font-semibold hidden sm:table-cell">Avg Cost</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Price</th>
                  <th className="text-right py-2.5 px-3 font-semibold hidden sm:table-cell">Value</th>
                  <th className="text-right py-2.5 px-3 font-semibold">P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <HoldingRow key={h.ticker} holding={h} onClick={() => router.push(`/stocks/${h.ticker}`)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="history">
        {isDisconnected ? (
          <div className="py-16 text-center">
            <p className="text-gray-300 text-sm mb-1">Connect wallet to unlock trade history and UBI impact timeline</p>
            <p className="text-gray-500 text-xs">You can keep exploring markets before connecting.</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No trade history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/30 text-gray-400">
                  <th className="text-left py-2.5 px-3 font-semibold">Stock</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Side</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Shares</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Price</th>
                  <th className="text-right py-2.5 px-3 font-semibold hidden sm:table-cell">Date</th>
                  <th className="text-right py-2.5 px-3 font-semibold">P&L</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => <TradeRow key={t.id} trade={t} />)}
              </tbody>
            </table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
