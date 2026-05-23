'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { type ExposureSnapshot, type HedgeProof, isNoOpProof } from '@/lib/hedgeProof'
import { parseRunId } from '@/lib/parseRunId'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { MonoSourceAtom, PanelHeaderMeta } from './PanelHeaderMeta'
import { shortenSourcePath } from './panelHeaderMetaUtils'

// Shared chip family for the LastDemoHedge header row. All status pills
// (side, threshold, dry-run flag, real-trading flag) render through this
// helper so they share padding, weight, casing, and baseline. The helper
// stays local to this file until a second panel needs it; see #0040.
type StatusTone = 'neutral' | 'buy' | 'sell' | 'accent' | 'safe'

const STATUS_PILL_BASE =
  'rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider'

const STATUS_PILL_TONE: Record<StatusTone, string> = {
  neutral: 'bg-white/10 text-gray-200',
  buy: 'bg-green-500/10 text-green-300',
  sell: 'bg-red-500/10 text-red-300',
  accent: 'bg-accent/10 text-accent',
  safe: 'bg-green-500/10 text-green-300',
}

function StatusPill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`${STATUS_PILL_BASE} ${STATUS_PILL_TONE[tone]}`}>{children}</span>
}

function SymbolLabel({ symbol, notionalUsd }: { symbol: string; notionalUsd?: number }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="text-sm font-semibold text-white">{symbol}</span>
      {notionalUsd !== undefined && (
        <span className="font-mono text-sm text-gray-100">{formatUsd(notionalUsd)}</span>
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

interface LastDemoHedgePanelProps {
  endpoint?: string
  intervalMs?: number
}

async function readSanitisedMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown }
    if (typeof body?.message === 'string' && body.message.length > 0) {
      return body.message
    }
  } catch {
    // body wasn't JSON; fall through to the generic status message.
  }
  return `HTTP ${res.status}`
}

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
      className="font-mono break-all"
    >
      {formatRelative(ms)}
      <span aria-hidden className="ml-1 text-gray-500">
        · {iso.slice(11, 19)} UTC
      </span>
    </span>
  )
}

export function LastDemoHedgePanel({
  endpoint = '/api/hedge-proof/latest',
  intervalMs = 15_000,
}: LastDemoHedgePanelProps) {
  const [state, setState] = useState<FetchState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined

    const load = async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' })
        if (res.status === 404) {
          if (!cancelled) setState({ status: 'missing', message: 'No hedge proof recorded yet.' })
          return
        }
        if (!res.ok) {
          const sanitisedMessage = await readSanitisedMessage(res)
          if (!cancelled) setState({ status: 'error', message: sanitisedMessage })
          return
        }
        const raw = (await res.json()) as unknown
        if (!isProofEnvelope(raw)) throw new Error(SHAPE_MISMATCH)
        if (!cancelled) setState({ status: 'ok', data: raw })
      } catch (err) {
        if (!cancelled) {
          const ctx =
            err instanceof Error && err.message === SHAPE_MISMATCH
              ? 'hedge-proof-shape'
              : 'hedge-proof'
          setState({ status: 'error', message: sanitiseClientError(ctx, err) })
        }
      }
    }

    void load()
    timer = setInterval(() => void load(), intervalMs)
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [endpoint, intervalMs])

  return (
    <section
      id="panel-last-hedge"
      aria-labelledby="last-hedge-heading"
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <header className="mb-3 flex items-center justify-between gap-y-1">
        <h2 id="last-hedge-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Last Demo Hedge
        </h2>
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
            state.status === 'ok' ? (
              <span>{state.data.proof.dryRun ? 'dry-run' : 'demo trade'}</span>
            ) : undefined
          }
        />
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
        </div>
      )}

      {state.status === 'error' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200">
          <div className="font-semibold">Hedge proof unavailable</div>
          <div className="mt-1 text-yellow-300/80">{state.message}</div>
        </div>
      )}

      {state.status === 'ok' && (
        <ProofCard proof={state.data.proof} source={state.data.source} />
      )}
      </div>
    </section>
  )
}

function ProofCard({ proof, source }: { proof: HedgeProof; source: string }) {
  if (isNoOpProof(proof)) {
    return <NoOpCard proof={proof} source={source} />
  }
  return <HedgeCard proof={proof} source={source} />
}

function HedgeCard({ proof, source }: { proof: HedgeProof; source: string }) {
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

      <SourceFooter source={source} />
    </div>
  )
}

function NoOpCard({ proof, source }: { proof: HedgeProof; source: string }) {
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

      <SourceFooter source={source} />
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

function SourceFooter({ source }: { source: string }) {
  return (
    <div className="text-[10px] text-gray-600 break-all">source: <code>{source}</code></div>
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
