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
    const strictSyncRequired = shouldRequireStrictSync(symbol)

    // Crypto perps (BTC/ETH/SOL/etc.) are backed by the on-chain perps oracle,
    // not the equity-price propagation service used for strict stock gating.
    // Do not block valid devnet/test-funded market orders just because the
    // generic price-service status contains a lagging quote for the same symbol.
    if (!strictSyncRequired) {
      return {
        allowRiskIncrease: true,
        stopCode: 'none' as const,
        reason: null,
        loading: false,
        hasSnapshot: false,
      }
    }

    if (!symbol || !status) {
      return {
        allowRiskIncrease: false,
        stopCode: 'lagging-sync' as const,
        reason: 'Price data is not yet available. Please wait.',
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
          ? `No price data available for ${symbol}. Please wait.`
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

