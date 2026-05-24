'use client'

import { Fragment, type ReactNode } from 'react'
import {
  AxisHealth,
  AxisKey,
  AxisState,
  ResolvedAxis,
  describeAxisForFlowNode,
} from './proofAxes'
import { useProofPipelineAxesContext } from './ProofPipelineAxesProvider'

type Tone = 'unknown' | 'healthy' | 'degraded'

/**
 * Stable identifier for every pipeline-flow node. Surfaced as a literal
 * union so the `PANEL_BY_NODE` map below is exhaustive at compile time:
 * adding a new node id without a matching jump target becomes a type
 * error, not a runtime "this node points nowhere" surprise — see #0073.
 */
type NodeId =
  | 'etoro'
  | 'price-service'
  | 'oracle-signer'
  | 'chain'
  | 'frontend'
  | 'demo-hedge'

interface NodeJumpTarget {
  /** Stable `id` of the panel `<section>` this node jumps to. */
  anchor: string
  /** Screen-reader name appended to `aria-label="… jump to <name> panel"`. */
  humanName: string
}

/**
 * Per-node jump target for the flow diagram. Finer-grained than the
 * axis-keyed `PANEL_BY_AXIS` (which the rollup chip row still owns)
 * because two nodes that share the same `onChain` axis can still want
 * different panel destinations: `oracle-signer` is the WRITE side (its
 * output is the keeper's `PriceUpdated` events), `chain`/`frontend` are
 * the READ side (multicall over `getPriceData`). Pre-0073 all three
 * shared `#panel-onchain-oracle`, which made the OracleUpdatesPanel
 * unreachable from the diagram and conflated the keeper with its
 * read-side mirror — see task #0073.
 */
const PANEL_BY_NODE: Record<NodeId, NodeJumpTarget | null> = {
  etoro: null,
  'price-service': { anchor: 'panel-live-quotes', humanName: 'live quotes' },
  'oracle-signer': { anchor: 'panel-oracle-updates', humanName: 'recent oracle updates' },
  chain: { anchor: 'panel-onchain-oracle', humanName: 'on-chain oracle' },
  frontend: { anchor: 'panel-onchain-oracle', humanName: 'on-chain oracle' },
  'demo-hedge': { anchor: 'panel-last-hedge', humanName: 'last demo hedge' },
}

interface NodeSpec {
  id: NodeId
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
 * Resolved render-time state for one node: everything the desktop and
 * mobile branches need to paint the pill, with no axis-state derivation
 * happening inside the per-variant JSX. Computed once at the diagram's
 * top level so the two variants cannot drift on tone, status copy, or
 * indicator visibility — see #0074.
 */
interface ResolvedNode {
  spec: NodeSpec
  tone: Tone
  statusSentence: string
  showHedgeProofIndicator: boolean
  /** Resolved trailing-edge target; `null` for the terminal `demo-hedge` node. */
  trailingEdge: { spec: EdgeSpec; tone: Tone } | null
}

function resolveNodesForRender(axes: AxisState): readonly ResolvedNode[] {
  return NODES.map((node, idx) => {
    const resolved = resolveAxisForSegment(node.axis, axes)
    const edge = EDGES[idx]
    const edgeResolved = edge ? resolveAxisForSegment(edge.axis, axes) : null
    return {
      spec: node,
      tone: axisToTone(resolved.axis),
      statusSentence: describeAxisForFlowNode(node.label, resolved, node.axis),
      showHedgeProofIndicator:
        node.id === 'demo-hedge' && resolved.subordinated && resolved.ok,
      trailingEdge:
        edge && edgeResolved
          ? { spec: edge, tone: axisToTone(edgeResolved.axis) }
          : null,
    }
  })
}

/**
 * Visualises the eToro → price-service → oracle-signer → chain →
 * frontend → demo-hedge pipeline. Reads axis health from
 * `ProofPipelineAxesProvider` so the flow node tones can never
 * disagree with the AlivenessRollup chip row above — see task
 * lane6-pipeline-flow-onchain-nodes-render-unknown-while-rollup-says-degraded
 * (0050).
 *
 * Renders two structural variants of the same node lineup so the
 * layout matches the viewport without producing orphaned trailing
 * arrows on either side (#0074):
 *  - **Desktop** (`sm:` and above): a horizontal `flex flex-wrap`
 *    strip with inline `→` arrows tucked inside each node's `<li>`
 *    (the #0031 fix that keeps the arrow attached to its source on
 *    wrap).
 *  - **Mobile** (below `sm:`): a vertical `flex flex-col` stack of
 *    nodes with standalone `↓` chevron `<li>` items between them; no
 *    arrow ever sits next to whitespace because each chevron is its
 *    own row.
 *
 * Both variants share the same per-node testid (`pipeline-node-<id>`)
 * and per-edge testid (`pipeline-edge-<id>`); tests scope queries
 * through the `pipeline-flow-desktop` / `pipeline-flow-mobile`
 * containers so the doubled DOM in jsdom does not break strict `getBy`
 * semantics. In production, CSS hides whichever container the active
 * viewport doesn't want.
 */
export function PipelineFlowDiagram() {
  const { axes } = useProofPipelineAxesContext()
  const resolved = resolveNodesForRender(axes)

  return (
    <section
      aria-label="Pipeline flow"
      data-testid="pipeline-flow-diagram"
      className="rounded-2xl border border-white/10 bg-dark-100/40 px-4 py-3"
    >
      <ol
        data-testid="pipeline-flow-mobile"
        data-variant="mobile"
        className="flex flex-col gap-2 text-xs sm:hidden"
      >
        {resolved.map((r, idx) => (
          <Fragment key={`mobile-${r.spec.id}`}>
            <FlowNode
              spec={r.spec}
              tone={r.tone}
              statusSentence={r.statusSentence}
              showHedgeProofIndicator={r.showHedgeProofIndicator}
              trailingEdge={null}
            />
            {idx < resolved.length - 1 && r.trailingEdge && (
              <MobileChevron edge={r.trailingEdge} />
            )}
          </Fragment>
        ))}
      </ol>
      <ol
        data-testid="pipeline-flow-desktop"
        data-variant="desktop"
        className="hidden flex-wrap items-center gap-y-2 text-xs sm:flex"
      >
        {resolved.map((r) => (
          <FlowNode
            key={`desktop-${r.spec.id}`}
            spec={r.spec}
            tone={r.tone}
            statusSentence={r.statusSentence}
            showHedgeProofIndicator={r.showHedgeProofIndicator}
            trailingEdge={r.trailingEdge}
          />
        ))}
      </ol>
      <ToneLegend />
    </section>
  )
}

/**
 * Standalone `↓` chevron for the mobile vertical stack. Renders its own
 * `<li>` so the previous node and the next node share no DOM ancestry
 * with the chevron — flex-wrap orphaning is structurally impossible
 * (the mobile stack does not wrap; each row is one item).
 */
function MobileChevron({ edge }: { edge: { spec: EdgeSpec; tone: Tone } }): ReactNode {
  return (
    <li
      role="presentation"
      data-testid={`pipeline-edge-${edge.spec.id}`}
      data-tone={edge.tone}
      className={`self-center text-base leading-none ${TONE_EDGE_CLASS[edge.tone]}`}
    >
      <span aria-hidden>↓</span>
    </li>
  )
}

/**
 * Inline three-entry tone legend mapping each pipeline-flow tone family
 * to its user-facing word — see #0057. The legend is descriptive
 * content, not interactive, and is wrapped in an `aria-label`-ed `<ul>`
 * so screen readers announce it as a single grouped region.
 *
 * Layout: on viewports ≥ sm the legend right-aligns on the same row as
 * the node strip wraps onto when there's space; on smaller viewports it
 * wraps below. The swatch uses a tiny ringed circle (not the node's
 * rounded-lg rectangle) so the visual primitive is clearly "swatch",
 * not "pill".
 */
function ToneLegend() {
  return (
    <ul
      aria-label="Pipeline tone legend"
      data-testid="pipeline-flow-legend"
      className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-gray-400 sm:mt-1 sm:justify-end"
    >
      <li className="inline-flex items-center gap-1.5" data-testid="pipeline-legend-healthy">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full border border-green-500/50 bg-green-500/20"
        />
        <span>healthy</span>
      </li>
      <li className="inline-flex items-center gap-1.5" data-testid="pipeline-legend-degraded">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full border border-yellow-500/50 bg-yellow-500/20"
        />
        <span>degraded</span>
      </li>
      <li className="inline-flex items-center gap-1.5" data-testid="pipeline-legend-loading">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full border border-white/15 bg-white/5"
        />
        <span>loading</span>
      </li>
      {/*
       * #0058 — fourth entry explains the small green indicator dot that
       * the demo-hedge pill renders when the hedgeProof axis is healthy
       * but upstream is degraded (subordinated tone per #0047). The
       * swatch deliberately uses the same `h-1.5 w-1.5` sizing as the
       * actual indicator on the pill (NOT the larger `h-2 w-2` of the
       * three tone entries above) so the visual link from legend to
       * indicator is pixel-accurate. The `sm:ml-2` separator keeps it
       * visually distinct from the three tone-family entries above.
       */}
      <li
        className="inline-flex items-center gap-1.5 sm:ml-2"
        data-testid="pipeline-legend-hedge-subordinated"
      >
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-green-400/80"
        />
        <span>hedge-proof healthy (mirroring upstream tone)</span>
      </li>
    </ul>
  )
}

const PILL_BASE_CLASS = 'inline-flex items-baseline gap-1.5 rounded-lg border px-3 py-1.5'

const PILL_INTERACTIVE_CLASS =
  'no-underline transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100 focus-visible:ring-accent/60'

function FlowNode({
  spec,
  tone,
  statusSentence,
  trailingEdge,
  showHedgeProofIndicator,
}: {
  spec: NodeSpec
  tone: Tone
  /** Per-node axis-state sentence ("price-service: healthy", etc.) — see #0055. */
  statusSentence: string
  trailingEdge: { spec: EdgeSpec; tone: Tone } | null
  showHedgeProofIndicator: boolean
}) {
  // Per-node jump target — finer-grained than `PANEL_BY_AXIS` so the
  // write-side (`oracle-signer` → OracleUpdatesPanel) and the read-side
  // (`chain`/`frontend` → OnChainOraclePanel) don't share one anchor
  // (#0073). `etoro` is intentionally `null` (no first-class panel).
  const jumpTarget = PANEL_BY_NODE[spec.id]
  const pillClass = `${PILL_BASE_CLASS} ${TONE_NODE_CLASS[tone]}`
  const pillContent = (
    <>
      <span className="font-mono uppercase tracking-wider">{spec.label}</span>
      {spec.subtitle && (
        <span className="text-[10px] uppercase tracking-wider text-gray-400">{spec.subtitle}</span>
      )}
      {showHedgeProofIndicator && (
        <span
          aria-hidden
          data-testid={`pipeline-node-${spec.id}-indicator`}
          title="hedge-proof axis healthy — pill colour mirrors upstream tone"
          className="ml-1 inline-block h-1.5 w-1.5 self-center rounded-full bg-green-400/80"
        />
      )}
    </>
  )

  return (
    <li
      data-testid={`pipeline-node-${spec.id}`}
      data-tone={tone}
      className="inline-flex items-center"
    >
      {jumpTarget ? (
        <a
          href={`#${jumpTarget.anchor}`}
          data-testid={`pipeline-node-${spec.id}-link`}
          className={`${pillClass} ${PILL_INTERACTIVE_CLASS}`}
          title={statusSentence}
          // When the node is an anchor, the aria-label overrides the
          // rendered text for screen readers — append the jump intent so
          // both halves are announced (axis state from #0055 plus the
          // panel-jump from #0054, now per-node from #0073).
          aria-label={`${statusSentence} — jump to ${jumpTarget.humanName} panel`}
        >
          {pillContent}
        </a>
      ) : (
        <span className={pillClass} title={statusSentence} aria-label={statusSentence}>
          {pillContent}
        </span>
      )}
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
