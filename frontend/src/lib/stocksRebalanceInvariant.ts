export type RebalanceProduct = 'amm' | 'perps' | 'predict' | 'lend' | 'yield'

export interface ProductSyncState {
  lastSyncedBlock: number | null
  divergencePct: number | null
}

export interface SymbolRebalanceStatus {
  symbol: string
  snapshotBlock: number | null
  products: Record<RebalanceProduct, ProductSyncState>
  stalePropagation: boolean
  secretLeak: boolean
  blockProof: number[]
}

export interface RebalanceGuardEvaluation {
  blocked: boolean
  reasons: string[]
  staleProducts: RebalanceProduct[]
  maxDivergencePct: number
  hasTwoBlockProof: boolean
}

const PRODUCTS: RebalanceProduct[] = ['amm', 'perps', 'predict', 'lend', 'yield']

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
