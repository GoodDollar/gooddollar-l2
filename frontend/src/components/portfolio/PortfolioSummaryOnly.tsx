'use client'

import { useMemo } from 'react'
import { formatStockPrice, formatLargeNumber } from '@/lib/stockData'
import { useOnChainPredictSummary } from '@/lib/useOnChainPredict'
import { useOnChainHoldings } from '@/lib/useOnChainStocks'
import { useOnChainPositions, useOnChainAccountSummary } from '@/lib/useOnChainPerps'
import { SummaryCard } from '@/components/ui'

export function PortfolioSummaryOnly() {
  const { holdings: stockHoldings } = useOnChainHoldings()
  const predictSummary = useOnChainPredictSummary()
  const { positions: perpsPositions } = useOnChainPositions()
  const { summary: perpsAccount } = useOnChainAccountSummary()

  // Compute stock summary from on-chain holdings
  const stockSummary = useMemo(() => {
    const totalValue = stockHoldings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0)
    const totalCost = stockHoldings.reduce((sum, h) => sum + h.shares * h.avgCost, 0)
    return { totalValue, unrealizedPnl: totalValue - totalCost }
  }, [stockHoldings])

  const totalPerpsPnl = perpsPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0)

  const totalValue = stockSummary.totalValue + predictSummary.currentValue + perpsAccount.equity
  const totalPnl = stockSummary.unrealizedPnl + predictSummary.unrealizedPnl + totalPerpsPnl
  const totalPositions = stockHoldings.length + perpsPositions.length + predictSummary.totalPositions

  const pnlColor = totalPnl >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
      <SummaryCard label="Total Value" value={formatLargeNumber(totalValue)} />
      <SummaryCard
        label="Unrealized P&L"
        value={`${totalPnl >= 0 ? '+' : ''}${formatStockPrice(totalPnl)}`}
        color={pnlColor}
      />
      <SummaryCard label="Active Positions" value={String(totalPositions)} />
    </div>
  )
}