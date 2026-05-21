'use client'

import { useMemo } from 'react'

import { usePriceServiceStatus } from '@/lib/usePriceServiceStatus'
import {
  buildSymbolSyncSnapshot,
  evaluateRiskIncrease,
  shouldRequireStrictSync,
  type RiskGateResult,
  type SyncProduct,
} from '@/lib/symbolSyncInvariant'

export interface SymbolSyncGuardState extends RiskGateResult {
  loading: boolean
  hasSnapshot: boolean
}

export function useSymbolSyncGuard(symbol: string | undefined, product: SyncProduct): SymbolSyncGuardState {
  const { status, isLoading } = usePriceServiceStatus()

  return useMemo(() => {
    if (!symbol || !status) {
      return {
        allowRiskIncrease: !shouldRequireStrictSync(symbol),
        stopCode: shouldRequireStrictSync(symbol) ? 'lagging-sync' : 'none',
        reason: shouldRequireStrictSync(symbol)
          ? 'Blocked: missing symbol sync snapshot.'
          : null,
        loading: isLoading,
        hasSnapshot: false,
      }
    }

    const quote = status.quotes.find(q => q.symbol?.toUpperCase() === symbol.toUpperCase())
    if (!quote) {
      return {
        allowRiskIncrease: !shouldRequireStrictSync(symbol),
        stopCode: shouldRequireStrictSync(symbol) ? 'lagging-sync' : 'none',
        reason: shouldRequireStrictSync(symbol)
          ? `Blocked: no sync quote available for ${symbol}.`
          : null,
        loading: false,
        hasSnapshot: false,
      }
    }

    const snapshot = buildSymbolSyncSnapshot(quote, status.timestamp || Date.now())
    const gate = evaluateRiskIncrease(snapshot, product)
    return {
      ...gate,
      loading: false,
      hasSnapshot: true,
    }
  }, [symbol, product, status, isLoading])
}

