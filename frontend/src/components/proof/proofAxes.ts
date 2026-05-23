/**
 * Shared types, predicates, and verdict derivation for the proof page's
 * pipeline-axis machinery. Lifted out of `PipelineStatusBanner.tsx` and
 * `PipelineFlowDiagram.tsx` (which previously each carried byte-identical
 * copies) so the AlivenessRollup and the PipelineFlowDiagram cannot
 * disagree about what "healthy / degraded / unknown" means for any axis.
 *
 * See task lane6-pipeline-flow-onchain-nodes-render-unknown-while-rollup-says-degraded
 * (0050) for the contradiction this module is the root fix for.
 */

export type AxisHealth = 'unknown' | 'healthy' | 'degraded'

export interface AxisState {
  quotes: AxisHealth
  onChain: AxisHealth
  hedgeProof: AxisHealth
}

export type AxisKey = keyof AxisState

export type Verdict = 'loading' | 'green' | 'amber' | 'red'

/**
 * The price-service `/quotes` response is structurally valid for the
 * banner/flow's reachability purposes if it carries at least one quote
 * whose `cacheAge` is within the staleness threshold. Looser than
 * `LiveQuotesPanel`'s `isQuotesResponse` (which validates every row
 * shape for table rendering): here we only need to know whether the
 * service is producing fresh data, not whether every row renders.
 */
export function isFreshQuotes(payload: unknown, stalenessMs: number): boolean {
  if (typeof payload !== 'object' || payload === null) return false
  const r = payload as Record<string, unknown>
  const quotes = r.quotes
  if (typeof quotes !== 'object' || quotes === null || Array.isArray(quotes)) return false
  const values = Object.values(quotes as Record<string, unknown>)
  if (values.length === 0) return false
  let freshestAge = Number.POSITIVE_INFINITY
  for (const v of values) {
    if (typeof v !== 'object' || v === null) continue
    const q = v as Record<string, unknown>
    if (typeof q.cacheAge !== 'number') continue
    if (q.cacheAge < freshestAge) freshestAge = q.cacheAge
  }
  if (!Number.isFinite(freshestAge)) return false
  return freshestAge <= stalenessMs
}

/**
 * The on-chain probe is healthy iff `StocksPriceOracle.getPriceData(symbol)`
 * returns a non-zero price8 and a non-zero timestamp. Zeros mean either
 * "never written" or "explicitly cleared" — both surface as `degraded`.
 */
export function isHealthyOnChain(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false
  const r = data as Record<string, unknown>
  const price8 = r.price8
  const timestamp = r.timestamp
  if (typeof price8 !== 'bigint' || typeof timestamp !== 'bigint') return false
  return price8 > 0n && timestamp > 0n
}

export function deriveVerdict(axes: AxisState): Verdict {
  const values: AxisHealth[] = [axes.quotes, axes.onChain, axes.hedgeProof]
  let unknownCount = 0
  let healthyCount = 0
  let degradedCount = 0
  for (const v of values) {
    if (v === 'unknown') unknownCount += 1
    else if (v === 'healthy') healthyCount += 1
    else degradedCount += 1
  }
  if (unknownCount > 0) return 'loading'
  if (healthyCount === 3) return 'green'
  if (degradedCount === 3) return 'red'
  return 'amber'
}
