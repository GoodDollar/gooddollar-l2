'use client'

import { useEffect, useState } from 'react'
import { AxisState, Verdict } from './proofAxes'
import { useProofPipelineAxesContext } from './ProofPipelineAxesProvider'

interface PanelLink {
  reason: string
  anchor: string
}

const PANEL_BY_AXIS: Record<keyof AxisState, PanelLink> = {
  quotes: { reason: 'price-service unreachable', anchor: 'panel-live-quotes' },
  onChain: { reason: 'no on-chain prices', anchor: 'panel-onchain-oracle' },
  hedgeProof: { reason: 'hedge-proof missing', anchor: 'panel-last-hedge' },
}

/**
 * Renders the AlivenessRollup chip + reason chips at the top of the
 * proof page. Pulls `{ axes, verdict, lastFullyAliveAt }` from
 * `ProofPipelineAxesProvider` so the rollup, the PipelineFlowDiagram,
 * and any future axis-aware consumer always agree on the same axis
 * states in the same render frame — see task lane6-pipeline-flow-onchain-
 * nodes-render-unknown-while-rollup-says-degraded (0050).
 */
export function PipelineStatusBanner() {
  const { axes, verdict, lastFullyAliveAt } = useProofPipelineAxesContext()

  /**
   * Drives the 1s "Xs ago" tick under the degraded/red verdict line.
   * Pure presentation — does not own the underlying timestamp.
   */
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    if (lastFullyAliveAt === null) return
    if (verdict === 'green' || verdict === 'loading') return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [lastFullyAliveAt, verdict])

  return (
    <PipelineStatusView
      axes={axes}
      verdict={verdict}
      lastFullyAliveAt={lastFullyAliveAt}
      now={now}
    />
  )
}

interface PipelineStatusViewProps {
  axes: AxisState
  verdict: Verdict
  lastFullyAliveAt: number | null
  now: number
}

function PipelineStatusView({ axes, verdict, lastFullyAliveAt, now }: PipelineStatusViewProps) {
  if (verdict === 'loading') {
    return (
      <section
        aria-label="Pipeline status"
        data-testid="pipeline-status-banner"
        data-status="loading"
        className="rounded-2xl border border-white/10 bg-dark-100/60 px-4 py-3"
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
        className="rounded-2xl border border-green-500/30 bg-green-500/5 px-4 py-3"
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
        <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} now={now} />
      </section>
    )
  }

  const degradedEntries = (Object.keys(axes) as (keyof AxisState)[])
    .filter((axis) => axes[axis] === 'degraded')
    .map((axis) => PANEL_BY_AXIS[axis])

  if (verdict === 'red') {
    return (
      <section
        aria-label="Pipeline status"
        data-testid="pipeline-status-banner"
        data-status="red"
        className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3"
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
          <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} now={now} />
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Pipeline status"
      data-testid="pipeline-status-banner"
      data-status="amber"
      className="rounded-2xl border border-yellow-500/40 bg-yellow-500/5 px-4 py-3"
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
        <LastAliveLine verdict={verdict} lastFullyAliveAt={lastFullyAliveAt} now={now} />
      </div>
    </section>
  )
}

const LAST_ALIVE_TONE_CLASS: Record<'amber' | 'red', string> = {
  amber: 'mt-1 text-[11px] text-yellow-100/70',
  red: 'mt-1 text-[11px] text-red-200/70',
}

function LastAliveLine({
  verdict,
  lastFullyAliveAt,
  now,
}: {
  verdict: Verdict
  lastFullyAliveAt: number | null
  now: number
}) {
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
