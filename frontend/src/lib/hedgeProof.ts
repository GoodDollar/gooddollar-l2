/**
 * Frontend mirror of the hedge-engine proof types and the
 * "no-op" sentinel detector. Kept lockstep with
 * `backend/hedge-engine/src/hedge-proof.ts` so the proof page can
 * recognise the engine's below-threshold sentinel and render a
 * distinct "no hedge needed" card instead of a misleading green
 * BUY $0.00 row.
 *
 * The two modules don't share a package; a backend unit test asserts
 * `NO_OP_ORDER_ID === 'no-op'` as a rename guard for this mirror.
 */
export interface ExposureSnapshot {
  netDelta: number
  absExposure: number
  blockNumber: number
}

export interface HedgeProof {
  runId: string
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  notionalUsd: number
  timestamp: number
  beforeExposure: ExposureSnapshot
  afterExposure: ExposureSnapshot
  dryRun: boolean
  etoroMode: string
  realTradingEnabled: boolean
  etoroOrderId?: string
  error?: string
}

export const NO_OP_ORDER_ID = 'no-op' as const

export function isNoOpProof(proof: HedgeProof): boolean {
  return (
    proof.orderId === NO_OP_ORDER_ID &&
    proof.notionalUsd === 0 &&
    proof.beforeExposure.netDelta === proof.afterExposure.netDelta &&
    proof.beforeExposure.blockNumber === proof.afterExposure.blockNumber
  )
}
