'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Lane 5 — demo hedge proof surface.
 *
 * Fetches `/api/hedge/status` (which proxies the hedge-engine's
 * `/hedge/snapshot`, `/hedge/receipts?limit=5`, and `/hedge/proof/latest`
 * routes) and renders a compact, polished card on the analytics page so
 * operators can verify that the demo hedge loop is healthy and recent
 * receipts exist.
 *
 * Failure modes are surfaced honestly — the spec forbids hiding degraded
 * services. The card shows distinct loading, empty, error, breaker-tripped,
 * and kill-switch-engaged states.
 */

interface HedgeReceipt {
  v: number
  id: string
  timestamp: number
  symbol: string
  side: 'buy' | 'sell' | 'noop'
  notionalUsd: number
  success: boolean
  error?: string
  etoroOrderId?: string
  beforeExposure: number
  afterExposure: number
  dryRun: boolean
  mode: 'sandbox' | 'real' | 'demo' | 'unknown'
}

interface CapSnapshot {
  dailyNotionalUsd: number
  dailyOrders: number
  cycleOrders: number
  dayKey: string
}

interface BreakerState {
  tripped: boolean
  reason?: string
  detail?: string
}

interface SnapshotPayload {
  timestamp: number
  hedgesExecuted: { success: boolean }[]
}

interface ProofPointer {
  path: string
  timestamp: number
  summary: string
}

interface HedgeStatusResponse {
  snapshot: SnapshotPayload | null
  capSnapshot: CapSnapshot | null
  breakerState: BreakerState | null
  killSwitchEngaged: boolean
  receipts: HedgeReceipt[]
  proof: ProofPointer | null
}

const POLL_INTERVAL_MS = 10_000

function shortId(id: string): string {
  if (!id) return '—'
  return id.length <= 8 ? id : id.slice(0, 8)
}

function timeAgo(ms: number | undefined): string {
  if (!ms) return '—'
  const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

type EngineState =
  | { label: 'ok'; color: 'text-goodgreen' }
  | { label: 'degraded'; color: 'text-yellow-400' }
  | { label: 'halted'; color: 'text-yellow-400' }
  | { label: 'unreachable'; color: 'text-red-400' }
  | { label: 'awaiting tick'; color: 'text-gray-400' }

function resolveEngineState(input: {
  snapshot: SnapshotPayload | null
  error: string | null
  breaker: BreakerState | null | undefined
  killSwitch: boolean
}): EngineState {
  if (input.error && !input.snapshot) {
    return { label: 'unreachable', color: 'text-red-400' }
  }
  if (!input.snapshot) {
    return { label: 'awaiting tick', color: 'text-gray-400' }
  }
  if (input.killSwitch) return { label: 'halted', color: 'text-yellow-400' }
  if (input.breaker?.tripped) return { label: 'degraded', color: 'text-yellow-400' }
  return { label: 'ok', color: 'text-goodgreen' }
}

function ModeBadge({ mode }: { mode: HedgeReceipt['mode'] | undefined }) {
  const labelMap: Record<string, { label: string; cls: string }> = {
    demo: { label: 'demo', cls: 'bg-goodgreen/15 text-goodgreen border-goodgreen/30' },
    sandbox: { label: 'sandbox', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    real: { label: 'real', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
    unknown: { label: 'unknown', cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
  }
  const c = labelMap[mode ?? 'unknown']
  return (
    <span
      data-testid="hedge-mode-badge"
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${c.cls}`}
    >
      {c.label}
    </span>
  )
}

export default function HedgeStatusCard() {
  const [data, setData] = useState<HedgeStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOnce = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/hedge/status', { cache: 'no-store', signal })
      if (!res.ok && res.status !== 503) {
        throw new Error(`HTTP ${res.status}`)
      }
      const body = (await res.json()) as HedgeStatusResponse & { error?: string }
      if (body.error && !body.snapshot) {
        setError(body.error)
        setData(body)
      } else {
        setError(null)
        setData(body)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'unknown')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    void fetchOnce(ctrl.signal)
    const t = setInterval(() => void fetchOnce(), POLL_INTERVAL_MS)
    return () => {
      ctrl.abort()
      clearInterval(t)
    }
  }, [fetchOnce])

  const receipts = data?.receipts ?? []
  const mode = receipts[0]?.mode ?? 'demo'
  const breaker = data?.breakerState
  const cap = data?.capSnapshot
  const killSwitch = Boolean(data?.killSwitchEngaged)

  return (
    <section
      data-testid="hedge-status-card"
      className="bg-dark-100/50 rounded-xl border border-dark-50 p-5"
    >
      <header className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Demo hedge proof</h2>
          <ModeBadge mode={mode} />
          {data?.snapshot?.timestamp && (
            <span className="text-xs text-gray-500">
              Last tick {timeAgo(data.snapshot.timestamp)}
            </span>
          )}
        </div>
        {data?.proof && (
          <div className="flex items-center gap-2 flex-wrap">
            {data.proof.summary && (
              <span
                data-testid="hedge-proof-summary"
                className="text-xs text-gray-400 font-mono truncate max-w-[28ch]"
                title={data.proof.summary}
              >
                {data.proof.summary}
              </span>
            )}
            <a
              data-testid="hedge-proof-link"
              href="/api/hedge/proof/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-goodgreen hover:underline font-mono"
              title={data.proof.path}
            >
              latest proof →
            </a>
          </div>
        )}
      </header>

      {loading && !data && (
        <div data-testid="hedge-status-loading" className="space-y-2 animate-pulse">
          <div className="h-4 bg-dark-50 rounded w-1/3" />
          <div className="h-4 bg-dark-50 rounded w-2/3" />
          <div className="h-4 bg-dark-50 rounded w-1/2" />
        </div>
      )}

      {error && !data?.snapshot && (
        <div
          data-testid="hedge-status-error"
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300"
        >
          <span className="font-medium">Hedge engine unavailable:</span> {error}
        </div>
      )}

      {killSwitch && (
        <div
          data-testid="hedge-killswitch-callout"
          className="mb-3 bg-red-500/15 border border-red-500/40 rounded-lg p-3 text-sm text-red-200"
        >
          <strong>Kill switch engaged.</strong> No further orders will be sent
          until the kill-switch file is removed.
        </div>
      )}

      {breaker?.tripped && (
        <div
          data-testid="hedge-breaker-callout"
          className="mb-3 bg-yellow-500/15 border border-yellow-500/40 rounded-lg p-3 text-sm text-yellow-200"
        >
          <strong>Breaker tripped:</strong>{' '}
          <span className="font-mono">{breaker.reason}</span>
          {breaker.detail && <span className="text-yellow-300/80"> — {breaker.detail}</span>}
        </div>
      )}

      {data && !(error && !data.snapshot) && (
        (() => {
          const engineState = resolveEngineState({
            snapshot: data.snapshot,
            error,
            breaker,
            killSwitch,
          })
          const hasSnapshot = Boolean(data.snapshot)
          return (
            <div
              data-testid="hedge-stat-grid"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4"
            >
              <Stat
                label="Today's notional"
                value={cap ? `$${cap.dailyNotionalUsd.toFixed(2)}` : '—'}
                sub={cap ? `${cap.dailyOrders} orders` : hasSnapshot ? 'no caps' : 'awaiting tick'}
              />
              <Stat
                label="Cycle orders"
                value={cap ? `${cap.cycleOrders}` : '—'}
                sub={cap ? `day ${cap.dayKey}` : hasSnapshot ? '' : 'awaiting tick'}
              />
              <Stat
                label="Receipts visible"
                value={hasSnapshot ? `${receipts.length}` : '—'}
                sub={hasSnapshot ? 'newest 5' : 'awaiting tick'}
              />
              <Stat
                testId="hedge-engine-stat"
                label="Engine"
                value={engineState.label}
                color={engineState.color}
              />
            </div>
          )
        })()
      )}

      <div className="bg-dark-50 rounded-lg p-3 overflow-x-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Recent receipts</h3>
        {receipts.length === 0 ? (
          <p
            data-testid="hedge-receipts-empty"
            className="text-xs text-gray-500 py-2"
          >
            No hedge activity yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left py-1 pr-2">id</th>
                <th className="text-left py-1 pr-2">symbol</th>
                <th className="text-left py-1 pr-2">side</th>
                <th className="text-right py-1 pr-2">notional</th>
                <th className="text-left py-1">status</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr
                  key={r.id}
                  data-testid="hedge-receipt-row"
                  className="border-t border-dark-100 font-mono"
                >
                  <td className="py-1.5 pr-2 text-xs text-gray-300">{shortId(r.id)}</td>
                  <td className="py-1.5 pr-2 text-white">{r.symbol}</td>
                  <td className="py-1.5 pr-2 text-gray-300">{r.side}</td>
                  <td className="py-1.5 pr-2 text-right text-gray-200">
                    ${r.notionalUsd.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-xs">
                    {r.success ? (
                      <span className="text-goodgreen">ok</span>
                    ) : (
                      <span className="text-yellow-400">{r.error ?? 'failed'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  sub,
  color,
  testId,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  testId?: string
}) {
  return (
    <div className="bg-dark-50 rounded-xl p-3 flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span
        data-testid={testId}
        className={`text-lg font-bold ${color ?? 'text-white'}`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}
