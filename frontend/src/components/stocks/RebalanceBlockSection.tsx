'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useThrottledBlockNumber } from '@/hooks/useThrottledBlockNumber'
import {
  evaluateRebalanceGuard,
  type SymbolRebalanceStatus,
} from '@/lib/stocksRebalanceInvariant'
import { RebalanceErrorBoundary } from '@/components/stocks/RebalanceErrorBoundary'
import dynamic from 'next/dynamic'

const RebalanceSyncPanel = dynamic(
  () => import('@/components/stocks/RebalanceSyncPanel').then(mod => ({ default: mod.RebalanceSyncPanel })),
  { ssr: false, loading: () => <div className="h-20 bg-dark-50/30 rounded-2xl animate-pulse mt-4" /> },
)

interface Props {
  symbolRebalanceStatus: SymbolRebalanceStatus
  onRiskBlockReasonChange: (reason: string | null) => void
}

export function RebalanceBlockSection({ symbolRebalanceStatus, onRiskBlockReasonChange }: Props) {
  const currentBlock = useThrottledBlockNumber()

  const rebalanceGuard = useMemo(
    () => evaluateRebalanceGuard(symbolRebalanceStatus, currentBlock),
    [symbolRebalanceStatus, currentBlock],
  )

  const riskBlockReason = rebalanceGuard.blocked
    ? rebalanceGuard.reasons[0] ?? 'Sync required'
    : null

  const prevReasonRef = useRef(riskBlockReason)
  useEffect(() => {
    if (prevReasonRef.current !== riskBlockReason) {
      prevReasonRef.current = riskBlockReason
      onRiskBlockReasonChange(riskBlockReason)
    }
  }, [riskBlockReason, onRiskBlockReasonChange])

  useEffect(() => {
    onRiskBlockReasonChange(riskBlockReason)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RebalanceErrorBoundary>
      <RebalanceSyncPanel
        status={symbolRebalanceStatus}
        guard={rebalanceGuard}
        currentBlock={currentBlock}
      />
    </RebalanceErrorBoundary>
  )
}
