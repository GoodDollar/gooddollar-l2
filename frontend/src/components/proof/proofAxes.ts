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

export interface PanelLink {
  /** Human-readable failure reason rendered in the rollup chip. */
  reason: string
  /** Stable `id` of the corresponding panel `<section>` — drives the chip's jump anchor. */
  anchor: string
}

/**
 * Canonical mapping from axis to (failure-reason copy, panel anchor id).
 * The single source of truth for the rollup's reason chips and any
 * future axis-aware consumer (e.g. the in-page jump-link table). Lifted
 * out of `PipelineStatusBanner` and `PipelineFlowDiagram` so a future
 * copy edit ("price-service unreachable" → "live-quotes feed unreachable")
 * lands in one place — see task lane6-pipeline-flow-trailing-degradation-
 * text-duplicates-rollup-chips (0052).
 */
export const PANEL_BY_AXIS: Record<AxisKey, PanelLink> = {
  quotes: { reason: 'price-service unreachable', anchor: 'panel-live-quotes' },
  onChain: { reason: 'no on-chain prices', anchor: 'panel-onchain-oracle' },
  hedgeProof: { reason: 'hedge-proof missing', anchor: 'panel-last-hedge' },
}

export function reasonForAxis(axis: AxisKey): string {
  return PANEL_BY_AXIS[axis].reason
}

/**
 * Rendered axis state for a single pipeline-flow segment.
 *
 * - `axis` is the AxisHealth value that drives the per-tone class on the
 *   pill (green/yellow/gray).
 * - `subordinated` is true iff the trailing hedgeProof segment inherited
 *   an upstream tone instead of its own — see #0047.
 * - `ok` is the underlying axis truth for the subordinated case (always
 *   `axis === 'healthy'` when not subordinated).
 *
 * Lifted out of `PipelineFlowDiagram.tsx` so `describeAxisForFlowNode`
 * (the helper that powers the per-node tooltip / aria-label) can read
 * it without a circular import — see #0055.
 */
export interface ResolvedAxis {
  axis: AxisHealth
  subordinated: boolean
  ok: boolean
}

/**
 * User-facing word for each AxisHealth state. `unknown` renders as
 * `loading first read` because that's the same vocabulary the rollup
 * banner already uses on first paint ("Loading pipeline status"). The
 * `Record<AxisHealth, string>` type makes the mapping exhaustive — adding
 * a new AxisHealth value would be a compile-time error here.
 */
const STATE_WORD: Record<AxisHealth, string> = {
  healthy: 'healthy',
  degraded: 'degraded',
  unknown: 'loading first read',
}

/**
 * Compose the per-node status sentence shown as both the native browser
 * tooltip (`title=`) and the screen-reader accessible name (`aria-label=`)
 * on every pipeline-flow pill — see #0055.
 *
 * Shape:
 *   - healthy: `"<label>: healthy"`
 *   - degraded: `"<label>: degraded — <reason>"` (reason from `PANEL_BY_AXIS`)
 *   - loading: `"<label>: loading first read"`
 *   - subordinated hedgeProof: `"<label>: <underlying-state> (mirroring upstream tone)"`
 *     where `<underlying-state>` is `healthy` when `resolved.ok` is true,
 *     else `degraded — <hedge-proof reason>`. The borrowed upstream tone
 *     is NOT what the user wants surfaced here — the helper names the
 *     underlying truth so the green indicator dot's meaning is explicit.
 */
export function describeAxisForFlowNode(
  nodeLabel: string,
  resolved: ResolvedAxis,
  axisKey: AxisKey,
): string {
  if (resolved.subordinated) {
    const underlying = resolved.ok
      ? STATE_WORD.healthy
      : `${STATE_WORD.degraded} — ${PANEL_BY_AXIS[axisKey].reason}`
    return `${nodeLabel}: ${underlying} (mirroring upstream tone)`
  }
  if (resolved.axis === 'degraded') {
    return `${nodeLabel}: ${STATE_WORD.degraded} — ${PANEL_BY_AXIS[axisKey].reason}`
  }
  return `${nodeLabel}: ${STATE_WORD[resolved.axis]}`
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
