'use client'

import { AxisHealth, AxisKey, AxisState } from './proofAxes'
import { useProofPipelineAxesContext } from './ProofPipelineAxesProvider'

type Tone = 'unknown' | 'healthy' | 'degraded'

const REASON_BY_AXIS: Record<AxisKey, string> = {
  quotes: 'price-service unreachable',
  onChain: 'no on-chain prices',
  hedgeProof: 'hedge-proof missing',
}

interface NodeSpec {
  id: string
  label: string
  axis: AxisKey
  subtitle?: string
}

interface EdgeSpec {
  id: string
  axis: AxisKey
}

const NODES: readonly NodeSpec[] = [
  { id: 'etoro', label: 'eToro', axis: 'quotes', subtitle: 'demo' },
  { id: 'price-service', label: 'price-service', axis: 'quotes' },
  { id: 'oracle-signer', label: 'oracle-signer', axis: 'onChain' },
  { id: 'chain', label: 'chain', axis: 'onChain' },
  { id: 'frontend', label: 'frontend', axis: 'onChain' },
  { id: 'demo-hedge', label: 'demo hedge', axis: 'hedgeProof' },
]

const EDGES: readonly EdgeSpec[] = [
  { id: 'etoro-price-service', axis: 'quotes' },
  { id: 'price-service-oracle-signer', axis: 'onChain' },
  { id: 'oracle-signer-chain', axis: 'onChain' },
  { id: 'chain-frontend', axis: 'onChain' },
  { id: 'frontend-demo-hedge', axis: 'hedgeProof' },
]

const TONE_NODE_CLASS: Record<Tone, string> = {
  healthy: 'border-green-500/40 bg-green-500/10 text-green-200',
  degraded: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-100',
  unknown: 'border-white/10 bg-white/5 text-gray-400 animate-pulse',
}

const TONE_EDGE_CLASS: Record<Tone, string> = {
  healthy: 'text-green-400',
  degraded: 'text-yellow-400',
  unknown: 'text-white/40',
}

function axisToTone(axis: AxisHealth): Tone {
  switch (axis) {
    case 'healthy':
      return 'healthy'
    case 'degraded':
      return 'degraded'
    case 'unknown':
      return 'unknown'
  }
}

/**
 * Visual prominence of each axis state on the pipeline-flow diagram.
 * Lower values dominate higher ones because the page reads worst-case
 * tones first (degraded/unknown surfaces before healthy). Used by
 * `dominantUpstreamTone` to pick the upstream tone the terminal
 * `demo-hedge` segment should inherit when it would otherwise look
 * orphaned — see #0047.
 */
const TONE_PROMINENCE: Record<AxisHealth, number> = {
  unknown: 0,
  degraded: 1,
  healthy: 2,
}

function dominantUpstreamTone(quotes: AxisHealth, onChain: AxisHealth): AxisHealth {
  return TONE_PROMINENCE[quotes] <= TONE_PROMINENCE[onChain] ? quotes : onChain
}

interface ResolvedAxis {
  axis: AxisHealth
  /** True iff the trailing hedge-proof segment inherited an upstream tone instead of its own. */
  subordinated: boolean
  /** True iff the underlying hedgeProof axis is healthy (only meaningful for the hedgeProof segment). */
  ok: boolean
}

/**
 * Pick the rendered axis state for a single node/edge segment. The
 * upstream axes (`quotes`, `onChain`) always paint their own state;
 * the trailing `hedgeProof` segment subordinates to the dominant
 * upstream tone when upstream is non-healthy so the terminal node
 * stays visually connected to the chain. Underlying truth survives
 * via the `ok` flag, which drives a small indicator dot on the
 * subordinated node — see #0047.
 */
function resolveAxisForSegment(axis: AxisKey, axes: AxisState): ResolvedAxis {
  if (axis !== 'hedgeProof') {
    return { axis: axes[axis], subordinated: false, ok: axes[axis] === 'healthy' }
  }
  const upstream = dominantUpstreamTone(axes.quotes, axes.onChain)
  const ok = axes.hedgeProof === 'healthy'
  if (upstream === 'healthy') return { axis: axes.hedgeProof, subordinated: false, ok }
  return { axis: upstream, subordinated: true, ok }
}

/**
 * Visualises the eToro → price-service → oracle-signer → chain →
 * frontend → demo-hedge pipeline. Reads axis health from
 * `ProofPipelineAxesProvider` so the flow node tones can never
 * disagree with the AlivenessRollup chip row above — see task
 * lane6-pipeline-flow-onchain-nodes-render-unknown-while-rollup-says-degraded
 * (0050).
 */
export function PipelineFlowDiagram() {
  const { axes } = useProofPipelineAxesContext()

  const failedReasons = (Object.keys(axes) as AxisKey[])
    .filter((axis) => axes[axis] === 'degraded')
    .map((axis) => REASON_BY_AXIS[axis])

  return (
    <section
      aria-label="Pipeline flow"
      data-testid="pipeline-flow-diagram"
      className="rounded-2xl border border-white/10 bg-dark-100/40 px-4 py-3"
    >
      <ol className="flex flex-wrap items-center gap-y-2 text-xs">
        {NODES.map((node, idx) => {
          const resolved = resolveAxisForSegment(node.axis, axes)
          const edge = EDGES[idx]
          const edgeResolved = edge ? resolveAxisForSegment(edge.axis, axes) : null
          return (
            <FlowNode
              key={`node-${node.id}`}
              spec={node}
              tone={axisToTone(resolved.axis)}
              showHedgeProofIndicator={node.id === 'demo-hedge' && resolved.subordinated && resolved.ok}
              trailingEdge={
                edge && edgeResolved
                  ? { spec: edge, tone: axisToTone(edgeResolved.axis) }
                  : null
              }
            />
          )
        })}
      </ol>
      {failedReasons.length > 0 && (
        <p
          data-testid="pipeline-flow-degradation"
          className="mt-2 text-xs text-yellow-200/80"
        >
          {failedReasons.join(' · ')}
        </p>
      )}
    </section>
  )
}

function FlowNode({
  spec,
  tone,
  trailingEdge,
  showHedgeProofIndicator,
}: {
  spec: NodeSpec
  tone: Tone
  trailingEdge: { spec: EdgeSpec; tone: Tone } | null
  showHedgeProofIndicator: boolean
}) {
  return (
    <li
      data-testid={`pipeline-node-${spec.id}`}
      data-tone={tone}
      className="inline-flex items-center"
    >
      <span
        className={`inline-flex items-baseline gap-1.5 rounded-lg border px-3 py-1.5 ${TONE_NODE_CLASS[tone]}`}
      >
        <span className="font-mono uppercase tracking-wider">{spec.label}</span>
        {spec.subtitle && (
          <span className="text-[10px] uppercase tracking-wider text-gray-400">{spec.subtitle}</span>
        )}
        {showHedgeProofIndicator && (
          <span
            aria-hidden
            data-testid={`pipeline-node-${spec.id}-indicator`}
            className="ml-1 inline-block h-1.5 w-1.5 self-center rounded-full bg-green-400/80"
          />
        )}
      </span>
      {trailingEdge && (
        <span
          aria-hidden
          data-testid={`pipeline-edge-${trailingEdge.spec.id}`}
          data-tone={trailingEdge.tone}
          className={`mx-1.5 text-base leading-none sm:mx-2 ${TONE_EDGE_CLASS[trailingEdge.tone]}`}
        >
          →
        </span>
      )}
    </li>
  )
}
