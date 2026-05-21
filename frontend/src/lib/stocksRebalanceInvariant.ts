export interface ProductSyncBlocks {
  amm: number
  perps: number
  prediction: number
  lend: number
  yield: number
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
