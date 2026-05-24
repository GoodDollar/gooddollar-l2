'use client'

import {
  AxisKey,
  AxisState,
  PANEL_BY_AXIS,
  PanelLink,
  TOTAL_AXIS_COUNT,
  Verdict,
} from './proofAxes'
import { useProofNow } from './ProofNowProvider'
import { useProofPipelineAxesContext } from './ProofPipelineAxesProvider'

/**
 * Outer container className shared by every verdict branch (loading,
 * amber, red, green). Hoisted so a layout-shift regression in one
 * branch is impossible — the box height is pinned by `min-h` on every
 * branch.
 *
 * `min-h-[4.75rem]` matches the typical resolved height (chip row +
 * reason chips line + last-alive caption + `py-3`) so the page does
 * NOT reflow when the rollup transitions from skeleton to coloured
 * content.  See task lane6-pipeline-status-rollup-blank-during-panel-
 * first-paint (0059).
 */
const BANNER_OUTER_BASE_CLASS = 'rounded-2xl px-4 py-3 min-h-[4.75rem]'

const BANNER_TONE_CLASS: Record<Verdict, string> = {
  loading: 'border border-white/10 bg-dark-100/60',
  green: 'border border-green-500/30 bg-green-500/5',
  amber: 'border border-yellow-500/40 bg-yellow-500/5',
  red: 'border border-red-500/40 bg-red-500/10',
}

function bannerOuterClass(verdict: Verdict): string {
  return `${BANNER_OUTER_BASE_CLASS} ${BANNER_TONE_CLASS[verdict]}`
}

/**
 * Renders the AlivenessRollup chip + reason chips at the top of the
 * proof page. Pulls `{ axes, partialVerdict, resolvedAxisCount,
 * lastFullyAliveAt }` from `ProofPipelineAxesProvider` so the rollup,
 * the PipelineFlowDiagram, and any future axis-aware consumer always
 * agree on the same axis states in the same render frame — see task
 * lane6-pipeline-flow-onchain-nodes-render-unknown-while-rollup-says-degraded
 * (0050).
 *
 * Uses {@link useProofPipelineAxesContext}'s `partialVerdict` (not the
 * strict `verdict`) so the rollup commits to amber/red/green as soon
 * as ANY axis resolves, instead of flashing a blank skeleton bar
 * while the flow diagram and panels below render their per-axis
 * state — see task lane6-pipeline-status-rollup-blank-during-panel-
 * first-paint (0059).
 */
export function PipelineStatusBanner() {
  const { axes, partialVerdict, resolvedAxisCount, lastFullyAliveAt } =
    useProofPipelineAxesContext()
  return (
    <PipelineStatusView
      axes={axes}
      verdict={partialVerdict}
      resolvedAxisCount={resolvedAxisCount}
      lastFullyAliveAt={lastFullyAliveAt}
    />
  )
}

interface PipelineStatusViewProps {
  axes: AxisState
  verdict: Verdict
  resolvedAxisCount: number
  lastFullyAliveAt: number | null
}

function PipelineStatusView({
  axes,
  verdict,
  resolvedAxisCount,
  lastFullyAliveAt,
}: PipelineStatusViewProps) {
  if (verdict === 'loading') {
    return (
      <section
        aria-label="Pipeline status"
        data-testid="pipeline-status-banner"
        data-status="loading"
        className={bannerOuterClass(verdict)}
      >
        <div
          role="status"
          aria-label="Loading pipeline status"
          className="h-5 w-56 animate-pulse rounded bg-white/10"
        />
      </section>
    )
  }

  if (verdict === 'green') {
    return (
      <section
        aria-label="Pipeline status"
        data-testid="pipeline-status-banner"
        data-status="green"
        className={bannerOuterClass(verdict)}
      >
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-green-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden />
            Alive
          </span>
          <span className="text-xs text-gray-300">
            Live quotes fresh · on-chain oracle returning data · hedge-proof artifact present
          </span>
        </div>
        <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} />
      </section>
    )
  }

  const degradedEntries = (Object.keys(axes) as AxisKey[])
    .filter((axis) => axes[axis] === 'degraded')
    .map((axis) => PANEL_BY_AXIS[axis])

  if (verdict === 'red') {
    return (
      <section
        aria-label="Pipeline status"
        data-testid="pipeline-status-banner"
        data-status="red"
        className={bannerOuterClass(verdict)}
      >
        <div role="alert" key="red">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden />
              Cold
            </span>
            <span className="text-xs text-red-200">
              All upstreams unreachable; this release is not verifiable.
            </span>
          </div>
          <ReasonChips entries={degradedEntries} tone="red" />
          <RollupProgress resolvedAxisCount={resolvedAxisCount} />
          <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} />
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Pipeline status"
      data-testid="pipeline-status-banner"
      data-status="amber"
      className={bannerOuterClass(verdict)}
    >
      <div role="alert" key="amber">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
            Degraded
          </span>
          <span className="text-xs text-yellow-100/80">
            Pipeline partially alive — investigate the listed axes before shipping.
          </span>
        </div>
        <ReasonChips entries={degradedEntries} tone="amber" />
        <RollupProgress resolvedAxisCount={resolvedAxisCount} />
        <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} />
      </div>
    </section>
  )
}

/**
 * "Computing N of M axes…" caption rendered when at least one axis
 * has reported but not all of them have. Disappears entirely once
 * every axis has resolved — at which point the rollup either matches
 * the strict {@link deriveVerdict} value or has already settled on a
 * degraded/cold verdict that the caption can't refine.
 */
function RollupProgress({ resolvedAxisCount }: { resolvedAxisCount: number }) {
  if (resolvedAxisCount <= 0 || resolvedAxisCount >= TOTAL_AXIS_COUNT) return null
  return (
    <p data-testid="rollup-progress" className="mt-1 text-[11px] text-gray-400">
      Computing {resolvedAxisCount} of {TOTAL_AXIS_COUNT} axes — banner refines as remaining
      axes report.
    </p>
  )
}

const LAST_ALIVE_TONE_CLASS: Record<'amber' | 'red', string> = {
  amber: 'mt-1 text-[11px] text-yellow-100/70',
  red: 'mt-1 text-[11px] text-red-200/70',
}

/**
 * Leaf component for the "Last fully alive" caption. Pulls the page-
 * scoped 1s tick from `useProofNow()` so the "Xs ago" value updates in
 * lockstep with the panel-header countdowns and only this leaf re-
 * renders per second — siblings (chip row, ReasonChips, RollupProgress)
 * stay stable across ticks. See task lane6-pipeline-status-banner-runs-
 * its-own-setinterval-1s-duplicate-of-proofnowprovider (#0068).
 */
function LastAliveLine({
  verdict,
  lastFullyAliveAt,
}: {
  verdict: Verdict
  lastFullyAliveAt: number | null
}) {
  const now = useProofNow()
  switch (verdict) {
    case 'loading':
      return null
    case 'green':
      return (
        <p data-testid="last-fully-alive" className="mt-1 text-[11px] text-green-200/80">
          Last fully alive: just now
        </p>
      )
    case 'amber':
    case 'red': {
      if (lastFullyAliveAt === null) {
        const stateWord = verdict === 'red' ? 'cold' : 'degraded'
        return (
          <p data-testid="last-fully-alive" className={LAST_ALIVE_TONE_CLASS[verdict]}>
            No all-green observation yet this session — the page has been in a {stateWord} state since it loaded.
          </p>
        )
      }
      const ago = Math.max(0, Math.round((now - lastFullyAliveAt) / 1000))
      const wallclock = new Date(lastFullyAliveAt).toISOString().slice(11, 19)
      return (
        <p data-testid="last-fully-alive" className={LAST_ALIVE_TONE_CLASS[verdict]}>
          Last fully alive: {wallclock} UTC · {ago}s ago
        </p>
      )
    }
  }
}

const CHIP_BASE_CLASS =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-100'

const CHIP_TONE_CLASS: Record<'amber' | 'red', string> = {
  amber: 'bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20 focus:ring-yellow-400/50',
  red: 'bg-red-500/15 text-red-200 hover:bg-red-500/25 focus:ring-red-400/50',
}

function ReasonChips({ entries, tone }: { entries: PanelLink[]; tone: 'amber' | 'red' }) {
  if (entries.length === 0) return null
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {entries.map((e) => (
        <li key={e.anchor}>
          <a
            href={`#${e.anchor}`}
            data-testid={`reason-chip-${e.anchor}`}
            className={`${CHIP_BASE_CLASS} ${CHIP_TONE_CLASS[tone]}`}
            aria-label={`Jump to ${e.reason}, opens the corresponding panel`}
          >
            <span>{e.reason}</span>
            <span aria-hidden>↓</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
