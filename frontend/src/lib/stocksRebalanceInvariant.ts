export interface ProductSyncBlocks {
  amm: number
  perps: number
  prediction: number
  lend: number
  yield: number
}

export type RebalanceProduct = 'amm' | 'perps' | 'predict' | 'lend' | 'yield'

export interface ProductSyncState {
  lastSyncedBlock: number | null
  divergencePct: number | null
}

export interface SymbolRebalanceStatus {
  symbol: string
  snapshotBlock: number | null
  blockProof: number[]
  stalePropagation: boolean
  secretLeak: boolean
  products: Record<RebalanceProduct, ProductSyncState>
}

export interface RebalanceGuardEvaluation {
  blocked: boolean
  reasons: string[]
  staleProducts: RebalanceProduct[]
  maxDivergencePct: number
  hasTwoBlockProof: boolean
}

export interface RebalanceInvariantInput {
  symbol: string
  currentBlock: number
  oracleBlock: number
  normalizedPrice?: number | null
  oraclePrice?: number | null
  products: ProductSyncBlocks
  stalePropagation?: boolean
  secretLeakage?: boolean
}

export interface RebalanceInvariantResult {
  symbol: string
  currentBlock: number
  oracleBlock: number
  products: ProductSyncBlocks
  lastSyncedBlock: number
  blockSkew: number
  divergenceBps: number
  coherentBlock: boolean
  stopReasons: string[]
  riskIncreaseAllowed: boolean
}

export const DEFAULT_DIVERGENCE_STOP_BPS = 50

const PRODUCTS: RebalanceProduct[] = ['amm', 'perps', 'predict', 'lend', 'yield']

export function computeDivergenceBps(
  normalizedPrice?: number | null,
  oraclePrice?: number | null,
): number {
  if (!normalizedPrice || !oraclePrice || normalizedPrice <= 0 || oraclePrice <= 0) {
    return 0
  }
  const diff = Math.abs(normalizedPrice - oraclePrice)
  return (diff / normalizedPrice) * 10_000
}

export function evaluateRebalanceInvariant(
  input: RebalanceInvariantInput,
  divergenceStopBps = DEFAULT_DIVERGENCE_STOP_BPS,
): RebalanceInvariantResult {
  const syncedBlocks = [
    input.products.amm,
    input.products.perps,
    input.products.prediction,
    input.products.lend,
    input.products.yield,
  ]
  const lastSyncedBlock = Math.min(...syncedBlocks)
  const blockSkew = Math.max(0, input.currentBlock - lastSyncedBlock)
  const coherentBlock = syncedBlocks.every((b) => b === input.oracleBlock)
  const divergenceBps = computeDivergenceBps(input.normalizedPrice, input.oraclePrice)

  const stopReasons: string[] = []
  if (divergenceBps > divergenceStopBps) stopReasons.push('divergence_gt_0_5pct')
  if (input.stalePropagation || lastSyncedBlock < input.currentBlock) stopReasons.push('stale_propagation')
  if (!coherentBlock) stopReasons.push('cross_product_block_mismatch')
  if (input.secretLeakage) stopReasons.push('secret_leakage')

  return {
    symbol: input.symbol,
    currentBlock: input.currentBlock,
    oracleBlock: input.oracleBlock,
    products: input.products,
    lastSyncedBlock,
    blockSkew,
    divergenceBps,
    coherentBlock,
    stopReasons,
    riskIncreaseAllowed: stopReasons.length === 0,
  }
}

export function toInvariantInputFromStatus(symbol: string, currentBlock: number, raw: unknown): RebalanceInvariantInput {
  const data = (raw ?? {}) as {
    oracleBlock?: number
    normalizedPrice?: number
    oraclePrice?: number
    stalePropagation?: boolean
    secretLeakage?: boolean
    products?: Partial<ProductSyncBlocks>
  }

  const oracleBlock = Number.isFinite(data.oracleBlock) ? Number(data.oracleBlock) : currentBlock
  const products: ProductSyncBlocks = {
    amm: Number.isFinite(data.products?.amm) ? Number(data.products?.amm) : oracleBlock,
    perps: Number.isFinite(data.products?.perps) ? Number(data.products?.perps) : oracleBlock,
    prediction: Number.isFinite(data.products?.prediction) ? Number(data.products?.prediction) : oracleBlock,
    lend: Number.isFinite(data.products?.lend) ? Number(data.products?.lend) : oracleBlock,
    yield: Number.isFinite(data.products?.yield) ? Number(data.products?.yield) : oracleBlock,
  }

  return {
    symbol,
    currentBlock,
    oracleBlock,
    normalizedPrice: data.normalizedPrice,
    oraclePrice: data.oraclePrice,
    stalePropagation: Boolean(data.stalePropagation),
    secretLeakage: Boolean(data.secretLeakage),
    products,
  }
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function parseProductState(raw: unknown): ProductSyncState {
  const data = (raw ?? {}) as { lastSyncedBlock?: unknown; divergencePct?: unknown }
  return {
    lastSyncedBlock: toFiniteNumber(data.lastSyncedBlock),
    divergencePct: toFiniteNumber(data.divergencePct),
  }
}

export function buildSymbolRebalanceStatus(
  symbol: string,
  statusPayload: unknown,
): SymbolRebalanceStatus {
  const payload = (statusPayload ?? {}) as {
    rebalance?: {
      symbols?: Record<string, {
        snapshotBlock?: unknown
        products?: Partial<Record<RebalanceProduct, unknown>>
        stalePropagation?: unknown
        secretLeak?: unknown
        blockProof?: unknown
      }>
    }
  }
  const raw = payload.rebalance?.symbols?.[symbol]
  const products = Object.fromEntries(
    PRODUCTS.map((key) => [key, parseProductState(raw?.products?.[key])]),
  ) as Record<RebalanceProduct, ProductSyncState>

  const rawProof = Array.isArray(raw?.blockProof) ? raw?.blockProof : []
  const blockProof = rawProof
    .map((v) => toFiniteNumber(v))
    .filter((v): v is number => v !== null)

  return {
    symbol,
    snapshotBlock: toFiniteNumber(raw?.snapshotBlock),
    products,
    stalePropagation: !!raw?.stalePropagation,
    secretLeak: !!raw?.secretLeak,
    blockProof,
  }
}

export function humanizeRiskReason(reason: string): string {
  if (reason === 'divergence_gt_0_5pct' || (reason.includes('exceeds') && reason.includes('stop rule'))) {
    return 'Price discrepancy detected — verifying'
  }
  if (reason === 'stale_propagation' || reason.includes('Stale propagation')) {
    return 'Price data refreshing'
  }
  if (reason === 'cross_product_block_mismatch' || reason.includes('Awaiting same-block sync')) {
    return 'Price feeds syncing'
  }
  if (reason === 'secret_leakage' || reason.includes('Secret leakage') || reason.includes('secretLeak')) {
    return 'System check in progress'
  }
  if (reason.includes('Two-block oracle sync proof')) {
    return 'Prices are being verified'
  }
  if (reason.includes('Current block unavailable')) {
    return 'Waiting for network confirmation'
  }
  return 'Trading temporarily paused'
}

export function evaluateRebalanceGuard(
  symbolStatus: SymbolRebalanceStatus,
  currentBlock: number | null,
): RebalanceGuardEvaluation {
  const reasons: string[] = []
  const staleProducts: RebalanceProduct[] = []
  let maxDivergencePct = 0

  for (const product of PRODUCTS) {
    const state = symbolStatus.products[product]
    const lastSynced = state.lastSyncedBlock
    if (currentBlock !== null && (lastSynced === null || lastSynced < currentBlock)) {
      staleProducts.push(product)
    }
    if (typeof state.divergencePct === 'number' && state.divergencePct > maxDivergencePct) {
      maxDivergencePct = state.divergencePct
    }
  }

  if (currentBlock === null) {
    reasons.push('Current block unavailable — sync proof required before trading')
  }

  const hasTwoBlockProof = symbolStatus.blockProof.some((value, idx, arr) =>
    idx > 0 && value === arr[idx - 1] + 1,
  )
  if (!hasTwoBlockProof) {
    reasons.push('Two-block oracle sync proof missing')
  }

  if (staleProducts.length > 0) {
    reasons.push(`Awaiting same-block sync for: ${staleProducts.join(', ')}`)
  }
  if (maxDivergencePct > 0.5) {
    reasons.push(`Divergence ${maxDivergencePct.toFixed(2)}% exceeds 0.50% stop rule`)
  }
  if (symbolStatus.stalePropagation) {
    reasons.push('Stale propagation detected across products')
  }
  if (symbolStatus.secretLeak) {
    reasons.push('Secret leakage flag raised by risk monitor')
  }

  return {
    blocked: reasons.length > 0,
    reasons,
    staleProducts,
    maxDivergencePct,
    hasTwoBlockProof,
  }
}
