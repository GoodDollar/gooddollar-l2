'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { type ExposureSnapshot, type HedgeProof, isNoOpProof } from '@/lib/hedgeProof'
import { parseRunId } from '@/lib/parseRunId'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { MonoSourceAtom, PanelHeaderMeta } from './PanelHeaderMeta'
import { NextPollCountdown, RetryButton } from './PanelHeaderControls'
import { usePanelRetry } from './ProofPanelActionsProvider'
import { useProofPipelineAxesContext } from './ProofPipelineAxesProvider'
import { shortenSourcePath } from './panelHeaderMetaUtils'

// Shared chip family for the LastDemoHedge header row. All status pills
// (side, symbol, threshold, dry-run flag, real-trading flag) render
// through this helper so they share padding, weight, casing, and
// baseline. The `symbol` tone (one notch brighter than `neutral`) marks
// the row's primary identifier without breaking the chip rhythm — see
// #0044. Helper stays local to this file until a second panel needs it;
// see #0040.
type StatusTone = 'neutral' | 'buy' | 'sell' | 'accent' | 'safe' | 'symbol'

const STATUS_PILL_BASE =
  'rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider'

const STATUS_PILL_TONE: Record<StatusTone, string> = {
  neutral: 'bg-white/10 text-gray-200',
  buy: 'bg-green-500/10 text-green-300',
  sell: 'bg-red-500/10 text-red-300',
  accent: 'bg-accent/10 text-accent',
  safe: 'bg-green-500/10 text-green-300',
  symbol: 'bg-white/15 text-white',
}

function StatusPill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`${STATUS_PILL_BASE} ${STATUS_PILL_TONE[tone]}`}>{children}</span>
}

function SymbolLabel({ symbol, notionalUsd }: { symbol: string; notionalUsd?: number }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <StatusPill tone="symbol">{symbol}</StatusPill>
      {notionalUsd !== undefined && (
        <span className="font-mono text-xs text-gray-100">{formatUsd(notionalUsd)}</span>
      )}
    </span>
  )
}

interface ProofEnvelope {
  proof: HedgeProof
  source: string
}

const SHAPE_MISMATCH = 'SHAPE_MISMATCH'

function isExposure(v: unknown): v is ExposureSnapshot {
  if (typeof v !== 'object' || v === null) return false
  const e = v as Record<string, unknown>
  return (
    typeof e.netDelta === 'number' &&
    typeof e.absExposure === 'number' &&
    typeof e.blockNumber === 'number'
  )
}

function isHedgeProof(v: unknown): v is HedgeProof {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  return (
    typeof p.runId === 'string' &&
    typeof p.orderId === 'string' &&
    typeof p.symbol === 'string' &&
    (p.side === 'buy' || p.side === 'sell') &&
    typeof p.notionalUsd === 'number' &&
    typeof p.timestamp === 'number' &&
    isExposure(p.beforeExposure) &&
    isExposure(p.afterExposure) &&
    typeof p.dryRun === 'boolean' &&
    typeof p.etoroMode === 'string' &&
    typeof p.realTradingEnabled === 'boolean'
  )
}

function isProofEnvelope(v: unknown): v is ProofEnvelope {
  if (typeof v !== 'object' || v === null) return false
  const e = v as Record<string, unknown>
  return typeof e.source === 'string' && isHedgeProof(e.proof)
}

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; data: ProofEnvelope }
  | { status: 'missing'; message: string }
  | { status: 'error'; message: string }

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatRelative(ts: number): string {
  const ageMs = Math.max(0, Date.now() - ts)
  if (ageMs < 1_000) return 'just now'
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1_000)}s ago`
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m ago`
  return `${Math.floor(ageMs / 3_600_000)}h ago`
}

const RELATIVE_TICK_MS = 30_000

function RelativeTimestamp({ ms }: { ms: number }) {
  const [, setTick] = useState(0)
  const finite = Number.isFinite(ms) && ms !== 0

  useEffect(() => {
    if (!finite) return
    const id = setInterval(() => setTick((n) => n + 1), RELATIVE_TICK_MS)
    return () => clearInterval(id)
  }, [finite])

  if (!finite) {
    return <span data-testid="hedge-timestamp">—</span>
  }
  const date = new Date(ms)
  const iso = date.toISOString()
  const local = date.toLocaleString(undefined, { timeZoneName: 'short' })
  return (
    <span
      data-testid="hedge-timestamp"
      title={`${iso}\n${local}`}
      className="inline-flex flex-wrap items-baseline gap-1"
    >
      <span className="font-mono break-all text-gray-200">{formatRelative(ms)}</span>
      <span aria-hidden className="text-gray-500">·</span>
      <span className="font-mono text-gray-400">{iso.slice(11, 19)} UTC</span>
    </span>
  )
}

/**
 * Render the last-demo-hedge card. Reads `{ lastHedgeProofPayload,
 * lastHedgeProofStatus, lastHedgeProofAt, cadenceMs, hedgeProofEndpoint,
 * retryHedgeProof }` from `ProofPipelineAxesProvider` so the panel
 * freshness, the rollup chip, and the flow diagram never disagree on
 * whether a proof is recorded in the same render frame. The shape
 * validation (`isProofEnvelope`) stays local because the hook hands the
 * panel raw payload bytes — a malformed-but-200 response surfaces as a
 * distinct error branch here (with the canonical sanitised string),
 * mirroring the contract `LiveQuotesPanel` adopted in #0051. See task
 * lane6-hedge-proof-duplicate-poller-collapse-to-axes-provider (#0062).
 */
export function LastDemoHedgePanel() {
  const {
    lastHedgeProofPayload,
    lastHedgeProofStatus,
    lastHedgeProofAt,
    cadenceMs,
    hedgeProofEndpoint,
    retryHedgeProof,
  } = useProofPipelineAxesContext()
  const { busy, fire: handleRetry } = usePanelRetry('hedgeProof', retryHedgeProof)

  const state: FetchState = useMemo(() => {
    if (lastHedgeProofStatus === 'loading') return { status: 'loading' }
    if (lastHedgeProofStatus === 'missing') {
      return { status: 'missing', message: 'No hedge proof recorded yet.' }
    }
    if (lastHedgeProofStatus === 'error') {
      return {
        status: 'error',
        message: sanitiseClientError('hedge-proof', new Error('hedge-proof fetch failed')),
      }
    }
    if (!isProofEnvelope(lastHedgeProofPayload)) {
      return {
        status: 'error',
        message: sanitiseClientError('hedge-proof-shape', new Error(SHAPE_MISMATCH)),
      }
    }
    return { status: 'ok', data: lastHedgeProofPayload }
  }, [lastHedgeProofStatus, lastHedgeProofPayload])

  return (
    <section
      id="panel-last-hedge"
      aria-labelledby="last-hedge-heading"
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-y-1">
        <h2 id="last-hedge-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Last Demo Hedge
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <PanelHeaderMeta
            source={
              state.status === 'ok' ? (
                <MonoSourceAtom
                  value={shortenSourcePath(state.data.source)}
                  title={state.data.source}
                />
              ) : undefined
            }
            cadence={
              <NextPollCountdown
                lastPollAt={lastHedgeProofAt}
                intervalMs={cadenceMs}
                busy={busy}
                testId="last-hedge-countdown"
              />
            }
          />
          <RetryButton
            onRetry={handleRetry}
            busy={busy}
            testId="last-hedge-retry"
            ariaLabel="Re-fetch the latest hedge proof"
          />
        </div>
      </header>

      <div className="flex-1">
      {state.status === 'loading' && (
        <div className="h-32 animate-pulse rounded bg-white/5" role="status" aria-label="Loading hedge proof" />
      )}

      {state.status === 'missing' && (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-gray-400">
          <div className="font-medium text-gray-300">No proof yet.</div>
          <div className="mt-1 text-xs text-gray-500">
            Run <code className="text-accent">npm run hedge:demo -- --dry-run</code> in
            <code className="text-accent"> backend/hedge-engine</code> to generate one.
          </div>
          <a
            href={hedgeProofEndpoint}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="hedge-proof-url-link"
            className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-gray-400 underline-offset-2 hover:text-accent hover:underline"
          >
            {hedgeProofEndpoint} <span aria-hidden>↗</span>
          </a>
        </div>
      )}

      {state.status === 'error' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">Hedge proof unavailable</div>
          <div className="mt-1 text-yellow-300/80">{state.message}</div>
          <a
            href={hedgeProofEndpoint}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="hedge-proof-url-link"
            className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-yellow-100 underline-offset-2 hover:underline"
          >
            {hedgeProofEndpoint} <span aria-hidden>↗</span>
          </a>
        </div>
      )}

      {state.status === 'ok' && <ProofCard proof={state.data.proof} />}
      </div>
    </section>
  )
}

function ProofCard({ proof }: { proof: HedgeProof }) {
  if (isNoOpProof(proof)) {
    return <NoOpCard proof={proof} />
  }
  return <HedgeCard proof={proof} />
}

function HedgeCard({ proof }: { proof: HedgeProof }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={proof.side === 'buy' ? 'buy' : 'sell'}>{proof.side}</StatusPill>
        <SymbolLabel symbol={proof.symbol} notionalUsd={proof.notionalUsd} />
        {proof.dryRun && <StatusPill tone="accent">DRY-RUN</StatusPill>}
        {!proof.realTradingEnabled && (
          <StatusPill tone="safe">real trading: false</StatusPill>
        )}
      </div>

      <ProofMeta proof={proof} />

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <div className="mb-1 text-xs uppercase tracking-wider text-gray-500">netDelta (before → after)</div>
        <div className="flex items-baseline gap-3 font-mono">
          <span className="text-gray-200">{formatUsd(proof.beforeExposure.netDelta)}</span>
          <span className="text-gray-500">→</span>
          <span className="text-gray-200">{formatUsd(proof.afterExposure.netDelta)}</span>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          block #{proof.beforeExposure.blockNumber} → #{proof.afterExposure.blockNumber}
        </div>
      </div>
    </div>
  )
}

function NoOpCard({ proof }: { proof: HedgeProof }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="neutral">Below-threshold tick</StatusPill>
        <SymbolLabel symbol={proof.symbol} />
        {proof.dryRun && <StatusPill tone="accent">DRY-RUN</StatusPill>}
        {!proof.realTradingEnabled && (
          <StatusPill tone="safe">real trading: false</StatusPill>
        )}
      </div>

      <p className="text-xs text-gray-400">
        No hedge needed — exposure stayed inside the configured threshold; the engine
        still recorded a proof so the pipeline is observable.
      </p>

      <ProofMeta proof={proof} />

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-400">
        netDelta unchanged at{' '}
        <span className="font-mono text-gray-200">{formatUsd(proof.beforeExposure.netDelta)}</span>{' '}
        · block #{proof.beforeExposure.blockNumber}
      </div>
    </div>
  )
}

function ProofMeta({ proof }: { proof: HedgeProof }) {
  return (
    <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
      <Field label="orderId" value={proof.etoroOrderId ?? proof.orderId} mono />
      <FieldNode label="runId">
        <RunIdValue raw={proof.runId} />
      </FieldNode>
      <FieldNode label="timestamp">
        <RelativeTimestamp ms={proof.timestamp} />
      </FieldNode>
      <Field label="etoroMode" value={proof.etoroMode} />
    </dl>
  )
}

function RunIdValue({ raw }: { raw: string }) {
  const parsed = parseRunId(raw)
  if (parsed === null) {
    return (
      <span data-testid="hedge-runid" title={raw} className="font-mono break-all text-gray-200">
        {raw}
      </span>
    )
  }
  const wallclock = `${parsed.iso.slice(0, 10)} ${parsed.iso.slice(11, 19)} UTC`
  return (
    <span
      data-testid="hedge-runid"
      title={raw}
      className="inline-flex flex-wrap items-baseline gap-1"
    >
      <span className="font-mono text-gray-200">{wallclock}</span>
      <span aria-hidden className="text-gray-500">·</span>
      <span className="font-mono text-xs text-gray-400">{parsed.tag}</span>
      <CopyRunIdButton raw={raw} />
    </span>
  )
}

function CopyRunIdButton({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false)
  const onClick = () => {
    void navigator.clipboard
      .writeText(raw)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1_500)
      })
      .catch(() => {
        // Insecure origin / browser without clipboard support. The
        // `title=` tooltip remains the user's fallback; no console
        // noise, no UI alert.
      })
  }
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="hedge-runid-copy"
      aria-label={copied ? 'runId copied to clipboard' : 'Copy raw runId to clipboard'}
      className="ml-1 inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-300 hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-accent"
    >
      {copied ? 'copied' : 'copy'}
    </button>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className={`mt-0.5 text-gray-200 ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  )
}

function FieldNode({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-200">{children}</dd>
    </div>
  )
}
