'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { formatNotionalUsd } from '@/lib/format-notional'
import { buildHedgeErrorHeadline } from '@/lib/hedge-error'

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

type HedgeMode = 'sandbox' | 'real' | 'demo' | 'unknown'

interface DegradedFlags {
  receipts?: string
  proof?: string
}

interface HedgeStatusResponse {
  snapshot: SnapshotPayload | null
  capSnapshot: CapSnapshot | null
  breakerState: BreakerState | null
  killSwitchEngaged: boolean
  mode: HedgeMode | null
  receipts: HedgeReceipt[]
  proof: ProofPointer | null
  degraded?: DegradedFlags
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

function isoTitle(ms: number | undefined): string | undefined {
  if (!ms || !Number.isFinite(ms)) return undefined
  return new Date(ms).toISOString()
}

// "Healthy converged" → the most recent poll *was* the most recent tick;
// collapse the two timestamps into a single compact freshness line. When
// they diverge (engine error path keeps polling but stops ticking) render
// both so the operator can see at a glance which value is actually stale.
const HEALTHY_CONVERGED_TOLERANCE_MS = 1_500

function renderFreshnessText(input: {
  lastTickAt: number | null
  lastPolledAt: number | null
  pollIntervalMs: number
}): string {
  const tickStr = input.lastTickAt === null ? 'never' : timeAgo(input.lastTickAt)
  const polledStr = input.lastPolledAt === null ? '—' : timeAgo(input.lastPolledAt)
  const autoRefresh = `auto-refresh ${Math.round(input.pollIntervalMs / 1000)}s`
  const healthyConverged =
    input.lastTickAt !== null &&
    input.lastPolledAt !== null &&
    Math.abs(input.lastPolledAt - input.lastTickAt) < HEALTHY_CONVERGED_TOLERANCE_MS
  if (healthyConverged) return `Last tick ${tickStr} · ${autoRefresh}`
  return `Last tick ${tickStr} · last polled ${polledStr}`
}

interface ExposureDeltaParts {
  display: string
  deltaSigned: string
  deltaClass: string
}

function formatExposureDelta(before: number, after: number): ExposureDeltaParts {
  const delta = after - before
  const display = `${before} → ${after}`
  if (!Number.isFinite(delta) || delta === 0) {
    return { display, deltaSigned: '0', deltaClass: 'text-gray-500' }
  }
  if (delta > 0) {
    return { display, deltaSigned: `+${delta}`, deltaClass: 'text-goodgreen' }
  }
  return { display, deltaSigned: `−${Math.abs(delta)}`, deltaClass: 'text-red-300' }
}

type EngineStateLabel = 'ok' | 'degraded' | 'halted' | 'unreachable' | 'awaiting tick'

interface EngineSubLine {
  text: string
  mono?: boolean
  color?: string
}

interface EngineState {
  label: EngineStateLabel
  color: string
  sub: EngineSubLine
}

// Resolves the engine's display model in one place so the header pill, stat
// tile value, and sub-line copy can never disagree about severity.
// Exhaustive switch on EngineStateLabel forces deliberate handling when a
// new state is added.
function resolveEngineState(input: {
  snapshot: SnapshotPayload | null
  error: string | null
  breaker: BreakerState | null | undefined
  killSwitch: boolean
  pollIntervalMs: number
}): EngineState {
  const label = resolveEngineLabel(input)
  switch (label) {
    case 'ok':
      return {
        label,
        color: 'text-goodgreen',
        sub: { text: `last tick ${timeAgo(input.snapshot?.timestamp)}` },
      }
    case 'degraded':
      return {
        label,
        color: 'text-yellow-400',
        sub: { text: input.breaker?.reason ?? 'degraded', mono: true },
      }
    case 'halted':
      return {
        label,
        color: 'text-yellow-400',
        sub: { text: 'kill-switch engaged' },
      }
    case 'unreachable':
      return {
        label,
        color: 'text-red-400',
        sub: {
          text: `auto-retry ${Math.round(input.pollIntervalMs / 1000)}s`,
          color: 'text-red-400/80',
        },
      }
    case 'awaiting tick':
      return {
        label,
        color: 'text-gray-400',
        sub: { text: 'warming up' },
      }
  }
}

function resolveEngineLabel(input: {
  snapshot: SnapshotPayload | null
  error: string | null
  breaker: BreakerState | null | undefined
  killSwitch: boolean
}): EngineStateLabel {
  if (input.error && !input.snapshot) return 'unreachable'
  if (!input.snapshot) return 'awaiting tick'
  if (input.killSwitch) return 'halted'
  if (input.breaker?.tripped) return 'degraded'
  return 'ok'
}

function DegradedHint({ children }: { children: ReactNode }) {
  return (
    <span
      data-testid="hedge-degraded-hint"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
    >
      {children}
    </span>
  )
}

function ArrowPathIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'animate-spin' : undefined}
    >
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 4v4h-4" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 20v-4h4" />
    </svg>
  )
}

function CloudOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2l20 20" />
      <path d="M5.78 5.78A6 6 0 003 11a4 4 0 004 4h9.5" />
      <path d="M21 17.5a4 4 0 00-1.83-3.36" />
      <path d="M9 4.07A6 6 0 0119 8.5" />
    </svg>
  )
}

function AlertTriangleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 13l3-7h12l3 7" />
      <path d="M3 13v6h18v-6h-6a3 3 0 01-6 0H3z" />
    </svg>
  )
}

function EmptyReceiptsState({
  error,
  hasSnapshot,
  degradedReceipts,
  pollIntervalMs,
}: {
  error: string | null
  hasSnapshot: boolean
  degradedReceipts: string | undefined
  pollIntervalMs: number
}) {
  const baseClass =
    'flex items-start gap-2 px-1 py-2 text-xs min-h-[3rem]'
  if (error && !hasSnapshot) {
    return (
      <div
        data-testid="hedge-receipts-empty"
        className={`${baseClass} text-red-300`}
      >
        <span className="mt-0.5"><CloudOffIcon /></span>
        <span>
          No receipts to show: engine unreachable. Retrying every{' '}
          {Math.round(pollIntervalMs / 1000)}s.
        </span>
      </div>
    )
  }
  if (degradedReceipts) {
    return (
      <div
        data-testid="hedge-receipts-empty"
        className={`${baseClass} text-yellow-300`}
      >
        <span className="mt-0.5"><AlertTriangleIcon /></span>
        <span>
          No receipts visible: receipts source degraded ({degradedReceipts}).
        </span>
      </div>
    )
  }
  return (
    <div
      data-testid="hedge-receipts-empty"
      className={`${baseClass} text-gray-500`}
    >
      <span className="mt-0.5"><InboxIcon /></span>
      <span>
        No hedge activity yet. Receipts will appear here once the engine
        sends an order.
      </span>
    </div>
  )
}

function ModeBadge({ mode }: { mode: HedgeMode }) {
  const labelMap: Record<HedgeMode, { label: string; cls: string }> = {
    demo: { label: 'demo', cls: 'bg-goodgreen/15 text-goodgreen border-goodgreen/30' },
    sandbox: { label: 'sandbox', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    real: { label: 'real', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
    unknown: { label: 'unknown', cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
  }
  const c = labelMap[mode]
  return (
    <span
      data-testid="hedge-mode-badge"
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${c.cls}`}
    >
      {c.label}
    </span>
  )
}

function resolveMode(data: HedgeStatusResponse | null, error: string | null): HedgeMode {
  if (!data || error) return 'unknown'
  if (data.mode === 'demo' || data.mode === 'sandbox' || data.mode === 'real') {
    return data.mode
  }
  return 'unknown'
}

interface EngineStatePillCopy {
  label: string
  cls: string
}

// Engine-state pill replaces the trading-mode badge in the header when the
// engine has gone into an abnormal state. The header severity now mirrors
// the body's red `ENGINE: unreachable` stat tile instead of contradicting
// it with a calm grey `unknown`. Exhaustive switch forces a deliberate
// copy decision when a new engine state is added.
function resolveEngineStatePill(state: EngineStateLabel): EngineStatePillCopy | null {
  switch (state) {
    case 'unreachable':
      return {
        label: 'engine down',
        cls: 'bg-red-500/15 text-red-300 border-red-500/30',
      }
    case 'halted':
      return {
        label: 'engine halted',
        cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      }
    case 'degraded':
      return {
        label: 'engine degraded',
        cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      }
    case 'ok':
    case 'awaiting tick':
      return null
  }
}

function HeaderStatusPill({
  engineState,
  mode,
  lastReceiptMode,
}: {
  engineState: EngineState
  mode: HedgeMode
  lastReceiptMode: string | undefined
}) {
  const pill = resolveEngineStatePill(engineState.label)
  const title = lastReceiptMode ? `last receipt mode: ${lastReceiptMode}` : undefined
  if (pill) {
    return (
      <span title={title}>
        <span
          data-testid="hedge-engine-state-pill"
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${pill.cls}`}
        >
          {pill.label}
        </span>
      </span>
    )
  }
  return (
    <span title={title}>
      <ModeBadge mode={mode} />
    </span>
  )
}

export interface HedgeStatusCardHandle {
  refresh: () => Promise<void>
}

interface ThrottleState {
  retryAt: number
}

function parseRetryAfterSeconds(
  header: string | null,
  body: { retryAfterSeconds?: number } | null,
): number {
  if (header) {
    const n = Number.parseInt(header, 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  if (body && Number.isFinite(body.retryAfterSeconds) && (body.retryAfterSeconds as number) > 0) {
    return body.retryAfterSeconds as number
  }
  return 5
}

const HedgeStatusCard = forwardRef<HedgeStatusCardHandle>(function HedgeStatusCard(_, ref) {
  const [data, setData] = useState<HedgeStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [throttle, setThrottle] = useState<ThrottleState | null>(null)
  const [throttleTick, setThrottleTick] = useState(0)
  // `lastPolledAt` updates after every resolved fetch (including error
  // shells that return 200 + `{error, snapshot: null}`). `lastTickAt`
  // only advances when we accept a real snapshot. Tracking them
  // separately lets the freshness label tell two distinct truths instead
  // of conflating "we reached the proxy" with "we have fresh engine
  // data".
  const [lastPolledAt, setLastPolledAt] = useState<number | null>(null)
  const [lastTickAt, setLastTickAt] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(0)

  // Race-condition guards: many call sites (mount, poll, header button,
  // retry button, imperative refresh) all write to the same state. Without
  // sequencing, a slow earlier response can clobber a fast newer one.
  //   - genRef:       monotonic call counter; only the latest call writes state.
  //   - abortRef:     latest controller so a new call cancels its predecessor
  //                   and unmount cancels whichever is in flight.
  //   - inFlightRef:  synchronous read for the poll guard. `isFetching` lags
  //                   by a render and is unsafe to read inside setInterval.
  const genRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const inFlightRef = useRef(false)

  const fetchOnce = useCallback(async (): Promise<void> => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const gen = ++genRef.current
    inFlightRef.current = true
    setIsFetching(true)
    try {
      const res = await fetch('/api/hedge/status', {
        cache: 'no-store',
        signal: ctrl.signal,
      })
      if (res.status === 429) {
        // Self-inflicted rate-limit from withApiRateLimit. Don't render the
        // red "engine unavailable" banner — surface a throttled state with
        // a live countdown so the operator knows it's their own clicks.
        const headerVal = res.headers.get('Retry-After')
        let body: { retryAfterSeconds?: number } | null = null
        try {
          body = (await res.json()) as { retryAfterSeconds?: number }
        } catch {
          body = null
        }
        if (gen !== genRef.current) return
        const seconds = parseRetryAfterSeconds(headerVal, body)
        setThrottle({ retryAt: Date.now() + seconds * 1000 })
        setError(null)
        return
      }
      if (!res.ok && res.status !== 503) {
        throw new Error(`HTTP ${res.status}`)
      }
      const body = (await res.json()) as HedgeStatusResponse & { error?: string }
      if (gen !== genRef.current) return
      setThrottle(null)
      const now = Date.now()
      setLastPolledAt(now)
      if (body.error && !body.snapshot) {
        setError(body.error)
        setData(body)
      } else {
        setError(null)
        setData(body)
        setLastTickAt(now)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (gen !== genRef.current) return
      setError(err instanceof Error ? err.message : 'unknown')
    } finally {
      if (gen === genRef.current) {
        inFlightRef.current = false
        setLoading(false)
        setIsFetching(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchOnce()
    const t = setInterval(() => {
      if (inFlightRef.current) return
      void fetchOnce()
    }, POLL_INTERVAL_MS)
    return () => {
      clearInterval(t)
      abortRef.current?.abort()
    }
  }, [fetchOnce])

  // Drives the "Updated Ns ago" copy in the row-2 metadata block. A 1 s
  // re-render is cheap for a single card and matches the analytics page-
  // level Refresh control's cadence.
  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 1_000)
    return () => clearInterval(t)
  }, [])

  // Countdown + auto-retry when throttled. Stores an absolute retryAt so
  // tab-switch / background-throttling don't drift the countdown.
  useEffect(() => {
    if (!throttle) return
    const tick = () => {
      const remaining = throttle.retryAt - Date.now()
      if (remaining <= 0) {
        setThrottle(null)
        void fetchOnce()
        return
      }
      setThrottleTick((n) => n + 1)
    }
    tick()
    const t = setInterval(tick, 250)
    return () => clearInterval(t)
  }, [throttle, fetchOnce])

  useImperativeHandle(ref, () => ({ refresh: () => fetchOnce() }), [fetchOnce])

  const throttleRemainingSeconds = throttle
    ? Math.max(0, Math.ceil((throttle.retryAt - Date.now()) / 1000))
    : 0
  // throttleTick / nowTick are read so React re-runs the render on every interval tick.
  void throttleTick
  void nowTick
  const isThrottled = throttle !== null
  const fetchBusy = isFetching || isThrottled

  const receipts = data?.receipts ?? []
  const mode = resolveMode(data, error)
  const lastReceiptMode = receipts[0]?.mode
  const breaker = data?.breakerState
  const cap = data?.capSnapshot
  const killSwitch = Boolean(data?.killSwitchEngaged)
  const hasSnapshot = Boolean(data?.snapshot)
  const showSkeleton = loading && !data
  const engineState = resolveEngineState({
    snapshot: data?.snapshot ?? null,
    error,
    breaker,
    killSwitch,
    pollIntervalMs: POLL_INTERVAL_MS,
  })

  return (
    <section
      data-testid="hedge-status-card"
      className="bg-dark-100/50 rounded-xl border border-dark-50 p-5"
    >
      <header className="mb-3">
        <div
          data-testid="hedge-header-row1"
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              Demo hedge proof
            </h2>
            <HeaderStatusPill
              engineState={engineState}
              mode={mode}
              lastReceiptMode={lastReceiptMode}
            />
          </div>
          <button
            type="button"
            data-testid="hedge-header-refresh-button"
            onClick={() => void fetchOnce()}
            disabled={fetchBusy}
            aria-label={
              isThrottled
                ? `Retry available in ${throttleRemainingSeconds} seconds`
                : isFetching
                ? 'Refreshing hedge status'
                : 'Refresh hedge status'
            }
            title={
              isThrottled
                ? `Retry available in ${throttleRemainingSeconds}s`
                : 'Refresh hedge status'
            }
            className="shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-dark-50 text-gray-300 hover:text-white hover:bg-dark-50 disabled:opacity-50"
          >
            <ArrowPathIcon spinning={isFetching && !isThrottled} />
            <span>
              {isThrottled
                ? `Retry in ${throttleRemainingSeconds}s`
                : isFetching
                ? 'Refreshing…'
                : 'Refresh'}
            </span>
          </button>
        </div>
        <div
          data-testid="hedge-header-row2"
          className="mt-2 flex items-center gap-2 flex-wrap text-xs"
        >
          <span data-testid="hedge-last-success" className="text-gray-500">
            {renderFreshnessText({
              lastTickAt,
              lastPolledAt,
              pollIntervalMs: POLL_INTERVAL_MS,
            })}
          </span>
          {data?.degraded?.proof && (
            <DegradedHint>proof: {data.degraded.proof}</DegradedHint>
          )}
          {data?.proof && (
            <div className="flex items-center gap-2 flex-wrap">
              {data.proof.summary && (
                <span
                  data-testid="hedge-proof-summary"
                  className="text-gray-400 font-mono truncate max-w-[28ch]"
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
                className="text-goodgreen hover:underline font-mono"
                title={data.proof.path}
              >
                latest proof →
              </a>
            </div>
          )}
        </div>
      </header>

      {isThrottled && (
        <div
          data-testid="hedge-status-throttled"
          className="mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200 flex items-center justify-between gap-3 flex-wrap"
        >
          <div>
            <span className="font-medium">Throttled.</span> Too many requests, retrying in{' '}
            <span data-testid="hedge-throttle-countdown" className="font-mono">
              {throttleRemainingSeconds}s
            </span>
            .
          </div>
          <button
            type="button"
            data-testid="hedge-retry-button"
            onClick={() => void fetchOnce()}
            disabled
            className="text-xs px-2.5 py-1 rounded-md border border-yellow-500/40 text-yellow-200 disabled:opacity-50"
          >
            Retry in {throttleRemainingSeconds}s
          </button>
        </div>
      )}

      {!isThrottled && error && !data?.snapshot && (
        <div
          data-testid="hedge-status-error"
          className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-medium">{buildHedgeErrorHeadline(error)}</span>
            <span className="text-red-300/80 text-xs">
              Auto-retrying every {Math.round(POLL_INTERVAL_MS / 1000)}s.
            </span>
          </div>
          <button
            type="button"
            data-testid="hedge-retry-button"
            onClick={() => void fetchOnce()}
            disabled={isFetching}
            className="text-xs px-2.5 py-1 rounded-md border border-red-500/40 text-red-200 hover:bg-red-500/10 disabled:opacity-50"
          >
            {isFetching ? 'Retrying…' : 'Retry'}
          </button>
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

      <div
        data-testid="hedge-stat-grid"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4"
      >
        {showSkeleton ? (
          <div
            data-testid="hedge-status-loading"
            className="col-span-2 sm:col-span-4 space-y-2 animate-pulse"
          >
            <div className="h-4 bg-dark-50 rounded w-1/3" />
            <div className="h-4 bg-dark-50 rounded w-2/3" />
            <div className="h-4 bg-dark-50 rounded w-1/2" />
          </div>
        ) : (
          <>
            <Stat
              label="Today's notional"
              value={cap ? formatNotionalUsd(cap.dailyNotionalUsd) : '—'}
              sub={cap ? `${cap.dailyOrders} orders` : hasSnapshot ? 'no caps' : 'awaiting tick'}
            />
            <Stat
              label="Cycle orders"
              value={cap ? `${cap.cycleOrders}` : '—'}
              sub={cap ? `day ${cap.dayKey}` : hasSnapshot ? 'no data' : 'awaiting tick'}
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
              sub={engineState.sub.text}
              subColor={engineState.sub.color}
              subMono={engineState.sub.mono}
              subTestId="hedge-engine-stat-sub"
            />
          </>
        )}
      </div>

      <div className="bg-dark-50 rounded-lg p-3 overflow-x-auto">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-sm font-medium text-gray-300">Recent receipts</h3>
          {data?.degraded?.receipts && (
            <DegradedHint>receipts source degraded: {data.degraded.receipts}</DegradedHint>
          )}
        </div>
        {receipts.length === 0 ? (
          <EmptyReceiptsState
            error={error}
            hasSnapshot={Boolean(data?.snapshot)}
            degradedReceipts={data?.degraded?.receipts}
            pollIntervalMs={POLL_INTERVAL_MS}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left py-1 pr-2">time</th>
                <th className="text-left py-1 pr-2">id</th>
                <th className="text-left py-1 pr-2">symbol</th>
                <th className="text-left py-1 pr-2">side</th>
                <th className="text-right py-1 pr-2">notional</th>
                <th className="text-left py-1 pr-2">exposure Δ</th>
                <th className="text-left py-1">status</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => {
                const delta = formatExposureDelta(r.beforeExposure, r.afterExposure)
                return (
                  <tr
                    key={r.id}
                    data-testid="hedge-receipt-row"
                    title={r.id}
                    className="border-t border-dark-100 font-mono"
                  >
                    <td
                      className="py-1.5 pr-2 text-xs text-gray-300"
                      title={isoTitle(r.timestamp)}
                    >
                      {timeAgo(r.timestamp)}
                    </td>
                    <td className="py-1.5 pr-2 text-xs text-gray-300">
                      <div>{shortId(r.id)}</div>
                      <div
                        data-testid="hedge-receipt-etoro-id"
                        className="text-gray-500"
                      >
                        eToro: <span className="text-gray-400">{r.etoroOrderId ?? '—'}</span>
                      </div>
                    </td>
                    <td className="py-1.5 pr-2 text-white">{r.symbol}</td>
                    <td className="py-1.5 pr-2 text-gray-300">{r.side}</td>
                    <td className="py-1.5 pr-2 text-right text-gray-200">
                      {formatNotionalUsd(r.notionalUsd)}
                    </td>
                    <td
                      data-testid="hedge-receipt-exposure-delta"
                      className="py-1.5 pr-2 text-xs text-gray-300"
                    >
                      <div>{delta.display}</div>
                      <div className={delta.deltaClass}>({delta.deltaSigned})</div>
                    </td>
                    <td className="py-1.5 text-xs">
                      {r.success ? (
                        <span className="text-goodgreen">ok</span>
                      ) : (
                        <span className="text-yellow-400">{r.error ?? 'failed'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
})

HedgeStatusCard.displayName = 'HedgeStatusCard'
export default HedgeStatusCard

function Stat({
  label,
  value,
  sub,
  color,
  testId,
  subColor,
  subMono,
  subTestId,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  testId?: string
  subColor?: string
  subMono?: boolean
  subTestId?: string
}) {
  const subClasses = [
    'text-xs',
    subColor ?? 'text-gray-500',
    subMono ? 'font-mono truncate max-w-[14ch]' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="bg-dark-50 rounded-xl p-3 flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span
        data-testid={testId}
        className={`text-lg font-bold ${color ?? 'text-white'}`}
      >
        {value}
      </span>
      {sub && (
        <span data-testid={subTestId} className={subClasses}>
          {sub}
        </span>
      )}
    </div>
  )
}
