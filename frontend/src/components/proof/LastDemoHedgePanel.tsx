'use client'

import { useEffect, useState } from 'react'

interface HedgeProof {
  runId: string
  orderId: string
  symbol: string
  side: 'buy' | 'sell'
  notionalUsd: number
  timestamp: number
  beforeExposure: { netDelta: number; absExposure: number; blockNumber: number }
  afterExposure: { netDelta: number; absExposure: number; blockNumber: number }
  dryRun: boolean
  etoroMode: string
  realTradingEnabled: boolean
  etoroOrderId?: string
  error?: string
}

interface ProofEnvelope {
  proof: HedgeProof
  source: string
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

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatTs(ms: number): string {
  if (!Number.isFinite(ms) || ms === 0) return '—'
  return new Date(ms).toISOString()
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as ProofEnvelope
        if (!cancelled) setState({ status: 'ok', data })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', message: (err as Error).message })
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
      aria-labelledby="last-hedge-heading"
      className="rounded-2xl border border-white/10 bg-dark-100/60 p-5"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 id="last-hedge-heading" className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Last Demo Hedge
        </h2>
        <span className="text-xs text-gray-500">
          {state.status === 'ok' ? state.data.proof.dryRun ? 'dry-run' : 'demo trade' : '—'}
        </span>
      </header>

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
    </section>
  )
}

function ProofCard({ proof, source }: { proof: HedgeProof; source: string }) {
  const sideColor = proof.side === 'buy' ? 'text-green-300' : 'text-red-300'
  const sideBg = proof.side === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${sideBg} ${sideColor}`}>
          {proof.side}
        </span>
        <span className="text-base font-semibold text-white">{proof.symbol}</span>
        <span className="font-mono text-base text-gray-100">{formatUsd(proof.notionalUsd)}</span>
        {proof.dryRun && (
          <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">DRY-RUN</span>
        )}
        {!proof.realTradingEnabled && (
          <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-300">
            real trading: false
          </span>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <Field label="orderId" value={proof.etoroOrderId ?? proof.orderId} mono />
        <Field label="runId" value={proof.runId} mono />
        <Field label="timestamp" value={formatTs(proof.timestamp)} mono />
        <Field label="etoroMode" value={proof.etoroMode} />
      </dl>

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

      <div className="text-[10px] text-gray-600 break-all">source: <code>{source}</code></div>
    </div>
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
