export type SyncProduct = 'amm' | 'perps' | 'prediction' | 'lend' | 'yield'

export interface ProductSyncState {
  lastSyncedBlock: number
  value?: number
}

export interface QuoteSyncPayload {
  symbol: string
  lastUpdateMs: number
  confidence: number
  oracleBlock?: number
  divergenceBps?: number
  productSync?: Partial<Record<SyncProduct, ProductSyncState>>
}

export interface SymbolSyncSnapshot {
  symbol: string
  oracleBlock: number
  divergenceBps: number
  stale: boolean
  productSync: Record<SyncProduct, ProductSyncState>
}

export interface RiskGateResult {
  allowRiskIncrease: boolean
  stopCode: 'none' | 'lagging-sync' | 'divergence' | 'stale-propagation'
  reason: string | null
}

export const SYNC_PRODUCTS: SyncProduct[] = ['amm', 'perps', 'prediction', 'lend', 'yield']
export const DIVERGENCE_STOP_BPS = 50
export const STALE_QUOTE_STOP_MS = 120_000

const KNOWN_STOCK_SYMBOLS = new Set([
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NFLX', 'AMD', 'COIN', 'JPM', 'V', 'DIS',
])

function normalizeBlock(block: number | undefined, fallback: number): number {
  if (!Number.isFinite(block) || !block || block < 1) return fallback
  return Math.floor(block)
}

function normalizeProductSync(
  oracleBlock: number,
  provided?: Partial<Record<SyncProduct, ProductSyncState>>,
): Record<SyncProduct, ProductSyncState> {
  const out = {} as Record<SyncProduct, ProductSyncState>
  for (const product of SYNC_PRODUCTS) {
    const state = provided?.[product]
    out[product] = {
      lastSyncedBlock: normalizeBlock(state?.lastSyncedBlock, oracleBlock),
      value: state?.value,
    }
  }
  return out
}

export function buildSymbolSyncSnapshot(quote: QuoteSyncPayload, now = Date.now()): SymbolSyncSnapshot {
  const inferredOracleBlock = Math.max(1, Math.floor(now / 12_000))
  const oracleBlock = normalizeBlock(quote.oracleBlock, inferredOracleBlock)
  const stale = quote.lastUpdateMs > STALE_QUOTE_STOP_MS
  const divergenceBps = Number.isFinite(quote.divergenceBps) ? Math.max(0, quote.divergenceBps ?? 0) : 0
  return {
    symbol: quote.symbol,
    oracleBlock,
    divergenceBps,
    stale,
    productSync: normalizeProductSync(oracleBlock, quote.productSync),
  }
}

export function evaluateRiskIncrease(snapshot: SymbolSyncSnapshot, product: SyncProduct): RiskGateResult {
  if (snapshot.stale) {
    return {
      allowRiskIncrease: false,
      stopCode: 'stale-propagation',
      reason: `Trading paused: ${snapshot.symbol} price data is too old to trade safely.`,
    }
  }
  if (snapshot.divergenceBps > DIVERGENCE_STOP_BPS) {
    return {
      allowRiskIncrease: false,
      stopCode: 'divergence',
      reason: `Trading paused: ${snapshot.symbol} price is out of range. Please wait for prices to stabilize.`,
    }
  }
  const productState = snapshot.productSync[product]
  if (productState.lastSyncedBlock < snapshot.oracleBlock) {
    return {
      allowRiskIncrease: false,
      stopCode: 'lagging-sync',
      reason: `Trading paused: ${product} price data is updating. Please wait a moment.`,
    }
  }
  return {
    allowRiskIncrease: true,
    stopCode: 'none',
    reason: null,
  }
}

export function shouldRequireStrictSync(symbol: string | undefined): boolean {
  if (!symbol) return false
  return KNOWN_STOCK_SYMBOLS.has(symbol.toUpperCase())
}

