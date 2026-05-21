import {
  buildSymbolSyncSnapshot,
  evaluateRiskIncrease,
  SYNC_PRODUCTS,
  type SyncProduct,
} from '@/lib/symbolSyncInvariant'
import type { PriceServiceStatus, QuoteStatus } from '@/lib/usePriceServiceStatus'

export type DriftHealth = 'synced' | 'lagging' | 'stopped'

export interface DriftRow {
  symbol: string
  oracleBlock: number
  divergenceBps: number
  health: DriftHealth
  stopReason: string | null
  products: Record<SyncProduct, { lastSyncedBlock: number; status: 'ok' | 'lagging' }>
}

function productState(quote: QuoteStatus, product: SyncProduct, oracleBlock: number) {
  const lastSyncedBlock = quote.productSync?.[product]?.lastSyncedBlock ?? oracleBlock
  return {
    lastSyncedBlock,
    status: lastSyncedBlock < oracleBlock ? 'lagging' : 'ok',
  } as const
}

export function deriveDriftRow(quote: QuoteStatus, now = Date.now()): DriftRow {
  const snapshot = buildSymbolSyncSnapshot(quote, now)
  let health: DriftHealth = 'synced'
  let stopReason: string | null = null

  for (const product of SYNC_PRODUCTS) {
    const gate = evaluateRiskIncrease(snapshot, product)
    if (!gate.allowRiskIncrease) {
      if (gate.stopCode === 'divergence' || gate.stopCode === 'stale-propagation') {
        health = 'stopped'
        stopReason = gate.reason
        break
      }
      health = 'lagging'
      stopReason = gate.reason
    }
  }

  const products = {
    amm: productState(quote, 'amm', snapshot.oracleBlock),
    perps: productState(quote, 'perps', snapshot.oracleBlock),
    prediction: productState(quote, 'prediction', snapshot.oracleBlock),
    lend: productState(quote, 'lend', snapshot.oracleBlock),
    yield: productState(quote, 'yield', snapshot.oracleBlock),
  }

  return {
    symbol: quote.symbol,
    oracleBlock: snapshot.oracleBlock,
    divergenceBps: snapshot.divergenceBps,
    health,
    stopReason,
    products,
  }
}

export function deriveDriftRows(status: PriceServiceStatus | null, now = Date.now()): DriftRow[] {
  if (!status?.quotes?.length) return []
  return status.quotes.map((q) => deriveDriftRow(q, now))
}
