'use client'

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { formatExposureDelta } from '@/lib/format-exposure-delta'
import { formatNotionalUsd } from '@/lib/format-notional'
import { buildHedgeErrorHeadline, classifyClientError } from '@/lib/hedge-error'
import { useIntervalWhileVisible } from '@/lib/useIntervalWhileVisible'
import { usePollWhileVisible } from '@/lib/usePollWhileVisible'
import {
  AlertTriangleIcon,
  ArrowPathIcon,
  InboxIcon,
} from './HedgeStatusCard/icons'

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

// Owns its own 1 s ticker so the parent card does not reconcile every
// second just to advance the "Last tick Xs ago" copy. Once the inputs
// are older than 60 s the rendered string only changes once per minute,
// so we slow the ticker to 30 s to avoid pure-overhead renders.
const FRESHNESS_STALE_MS = 60_000
const FRESHNESS_FAST_INTERVAL_MS = 1_000
const FRESHNESS_SLOW_INTERVAL_MS = 30_000

function FreshnessLabel({
  lastTickAt,
  lastPolledAt,
  pollIntervalMs,
}: {
  lastTickAt: number | null
  lastPolledAt: number | null
  pollIntervalMs: number
}) {
  const [, setTick] = useState(0)
  const now = Date.now()
  const tickStale = lastTickAt === null || now - lastTickAt >= FRESHNESS_STALE_MS
  const polledStale = lastPolledAt === null || now - lastPolledAt >= FRESHNESS_STALE_MS
  const intervalMs =
    tickStale && polledStale ? FRESHNESS_SLOW_INTERVAL_MS : FRESHNESS_FAST_INTERVAL_MS
  useIntervalWhileVisible(() => setTick((n) => n + 1), intervalMs)
  return (
    <span data-testid="hedge-last-success" className="text-gray-500">
      {renderFreshnessText({ lastTickAt, lastPolledAt, pollIntervalMs })}
    </span>
  )
}

// Owns its own 250 ms countdown ticker. Calls back on expiry so the
// parent can clear its throttle state and trigger the next fetch.
//
// `usePollWhileVisible` semantics fit exactly: the callback runs on
// mount (catches deadline-already-past), every 250 ms while visible,
// pauses while hidden, and fires once on visibility-return (so a
// deadline that elapsed during the hidden window expires immediately on
// return). See task 0041.
function ThrottleCountdown({
  retryAt,
  onExpire,
}: {
  retryAt: number
  onExpire: () => void
}) {
  const [, setTick] = useState(0)
  usePollWhileVisible(() => {
    if (retryAt - Date.now() <= 0) {
      onExpire()
      return
    }
    setTick((n) => n + 1)
  }, 250)
  const remaining = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
  return (
    <span data-testid="hedge-throttle-countdown" className="font-mono">
      {remaining}s
    </span>
  )
}

type EngineStateLabel = 'ok' | 'degraded' | 'halted' | 'unreachable' | 'awaiting tick'

interface EngineSubLine {
  text: string
  mono?: boolean
  color?: string
}

interface EngineState {
  label: EngineStateLabel
  // Short single-word presentation label rendered inside the stat tile.
  // Decoupled from `label` so a long-form internal state (e.g. "unreachable",
  // "awaiting tick") never overflows the ~121-px mobile tile. The header
  // pill keeps the long-form copy via `resolveEngineStatePill`.
  statLabel: string
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
        statLabel: 'ok',
        color: 'text-goodgreen',
        sub: { text: `last tick ${timeAgo(input.snapshot?.timestamp)}` },
      }
    case 'degraded':
      return {
        label,
        statLabel: 'degraded',
        color: 'text-yellow-400',
        sub: { text: input.breaker?.reason ?? 'degraded', mono: true },
      }
    case 'halted':
      return {
        label,
        statLabel: 'halted',
        color: 'text-yellow-400',
        sub: { text: 'kill-switch engaged' },
      }
    case 'unreachable':
      return {
        label,
        statLabel: 'down',
        color: 'text-red-400',
        sub: {
          text: `auto-retry ${Math.round(input.pollIntervalMs / 1000)}s`,
          color: 'text-red-400/80',
        },
      }
    case 'awaiting tick':
      return {
        label,
        statLabel: 'awaiting',
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

// Owns its own minute-resolution ticker so the receipts panel header
// re-renders the staleness label "stale 2m ago" without the parent
// card reconciling on every second. Reuses the same isolation pattern
// as `FreshnessLabel` (#0031).
function StaleChip({ sinceMs }: { sinceMs: number }) {
  const [, setTick] = useState(0)
  useIntervalWhileVisible(() => setTick((n) => n + 1), 30_000)
  const minutes = Math.max(0, Math.floor((Date.now() - sinceMs) / 60_000))
  const label = minutes <= 0 ? 'stale just now' : `stale ${minutes}m ago`
  return (
    <span
      data-testid="hedge-receipts-stale"
      className="text-xs rounded-md px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30"
    >
      {label}
    </span>
  )
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

// Centered icon-over-text empty state. Sits inside a `min-h-[7rem]`
// reserved wrapper (see render below) so the receipts panel stays the
// same height whether empty or populated — no layout jump when the first
// receipt arrives. The 28-px icon and two-line copy give the empty
// state real vertical presence next to the populated table.
const EMPTY_RECEIPTS_BASE_CLASS =
  'flex flex-col items-center justify-center gap-2 text-center py-6 text-xs'

function EmptyReceiptsState({
  error,
  hasSnapshot,
  degradedReceipts,
}: {
  error: string | null
  hasSnapshot: boolean
  degradedReceipts: string | undefined
}) {
  if (error && !hasSnapshot) {
    // When the top error banner already carries the canonical
    // "Hedge engine unreachable / retrying" copy, this empty state
    // reverts to its functional "no receipts" role so the card does not
    // shout the same incident twice. The 28-px icon + headline/sub
    // structure from #0025 is preserved.
    return (
      <div
        data-testid="hedge-receipts-empty"
        className={`${EMPTY_RECEIPTS_BASE_CLASS} text-gray-500`}
      >
        <InboxIcon size={28} />
        <div className="font-medium text-sm text-gray-300">No receipts to show</div>
        <div>Engine offline (see banner above).</div>
      </div>
    )
  }
  if (degradedReceipts) {
    return (
      <div
        data-testid="hedge-receipts-empty"
        className={`${EMPTY_RECEIPTS_BASE_CLASS} text-yellow-300`}
      >
        <AlertTriangleIcon size={28} />
        <div className="font-medium text-sm">Receipts source degraded</div>
        <div className="text-yellow-300/80 font-mono">{degradedReceipts}</div>
      </div>
    )
  }
  return (
    <div
      data-testid="hedge-receipts-empty"
      className={`${EMPTY_RECEIPTS_BASE_CLASS} text-gray-500`}
    >
      <InboxIcon size={28} />
      <div className="font-medium text-sm text-gray-300">No hedge activity yet</div>
      <div>Receipts will appear here once the engine sends an order.</div>
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
      className={`inline-flex items-center whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md text-xs font-medium border ${c.cls}`}
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
          className={`inline-flex items-center whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md text-xs font-medium border ${pill.cls}`}
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
  // `lastPolledAt` updates after every resolved fetch (including error
  // shells that return 200 + `{error, snapshot: null}`). `lastTickAt`
  // only advances when we accept a real snapshot. Tracking them
  // separately lets the freshness label tell two distinct truths instead
  // of conflating "we reached the proxy" with "we have fresh engine
  // data".
  const [lastPolledAt, setLastPolledAt] = useState<number | null>(null)
  const [lastTickAt, setLastTickAt] = useState<number | null>(null)
  // `lastGood` is the most recent healthy envelope. When the engine
  // flaps, the live `data` flips to the engine-down shell (so the
  // engine tile / pill / banner stay accurate) but `lastGood` keeps
  // feeding the cap tiles, receipts table, and proof link so the
  // operator never loses diagnostic context. `staleSinceMs` marks the
  // *first* unhealthy poll after the most recent healthy one — it
  // resets to null on recovery.
  const [lastGood, setLastGood] = useState<HedgeStatusResponse | null>(null)
  const [staleSinceMs, setStaleSinceMs] = useState<number | null>(null)

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
      // Always parse the body — every non-2xx response from
      // /api/hedge/status returns a JSON envelope with a useful `error`
      // string (503 engine-down, 502 upstream-error, 502 malformed). The
      // legacy `throw new Error(`HTTP ${status}`)` discarded the
      // server-composed message and surfaced a stack-trace-shaped
      // banner instead. Any genuine non-JSON body is caught here and
      // routed through `classifyClientError` so the banner reads as a
      // single branded sentence regardless of upstream shape.
      let body: (HedgeStatusResponse & { error?: string }) | null = null
      let parseFailed = false
      try {
        body = (await res.json()) as HedgeStatusResponse & { error?: string }
      } catch {
        parseFailed = true
      }
      if (gen !== genRef.current) return
      setThrottle(null)
      const now = Date.now()
      setLastPolledAt(now)
      const markStale = () => setStaleSinceMs((prev) => prev ?? now)
      if (parseFailed) {
        setError(classifyClientError(new SyntaxError('parse failed')))
        markStale()
        return
      }
      if (!res.ok) {
        const reason = body?.error ?? `upstream error (HTTP ${res.status})`
        setError(reason)
        if (res.status === 503 && body) setData(body)
        markStale()
        return
      }
      const envelope = body!
      if (envelope.error && !envelope.snapshot) {
        setError(envelope.error)
        setData(envelope)
        markStale()
      } else {
        setError(null)
        setData(envelope)
        setLastGood(envelope)
        setStaleSinceMs(null)
        setLastTickAt(now)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (gen !== genRef.current) return
      setError(classifyClientError(err))
      setStaleSinceMs((prev) => prev ?? Date.now())
    } finally {
      if (gen === genRef.current) {
        inFlightRef.current = false
        setLoading(false)
        setIsFetching(false)
      }
    }
  }, [])

  // Poll only while the tab is visible so background tabs stop fanning
  // out hedge-engine snapshot/receipts/proof requests for nobody. Skip
  // when a fetch is still in flight so a slow upstream doesn't stack
  // concurrent aborts → re-fetches.
  const pollOnce = useCallback((): void => {
    if (inFlightRef.current) return
    void fetchOnce()
  }, [fetchOnce])
  usePollWhileVisible(pollOnce, POLL_INTERVAL_MS)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useImperativeHandle(ref, () => ({ refresh: () => fetchOnce() }), [fetchOnce])

  const handleThrottleExpire = useCallback(() => {
    setThrottle(null)
    void fetchOnce()
  }, [fetchOnce])

  const throttleRemainingSeconds = throttle
    ? Math.max(0, Math.ceil((throttle.retryAt - Date.now()) / 1000))
    : 0
  const isThrottled = throttle !== null
  const fetchBusy = isFetching || isThrottled

  const isStale = staleSinceMs !== null && lastGood !== null
  // Cap, receipts, and proof come from `lastGood` while stale so the
  // operator sees the prior numbers (clearly marked) instead of em-dash
  // placeholders. Live signals — engine state, mode, breaker, kill
  // switch — keep flowing from `data`.
  const renderSource = isStale ? lastGood : data
  const receipts = renderSource?.receipts ?? []
  const cap = renderSource?.capSnapshot ?? null
  const mode = resolveMode(data, error)
  const lastReceiptMode = receipts[0]?.mode
  const breaker = data?.breakerState
  const killSwitch = Boolean(data?.killSwitchEngaged)
  const hasSnapshot = Boolean(renderSource?.snapshot)
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
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-semibold text-white">
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
          <FreshnessLabel
            lastTickAt={lastTickAt}
            lastPolledAt={lastPolledAt}
            pollIntervalMs={POLL_INTERVAL_MS}
          />
          {data?.degraded?.proof && (
            <DegradedHint>proof: {data.degraded.proof}</DegradedHint>
          )}
          {renderSource?.proof && (
            <div className="flex items-center gap-2 flex-wrap">
              {renderSource.proof.summary && (
                <span
                  data-testid="hedge-proof-summary"
                  className="text-gray-400 font-mono truncate max-w-[28ch]"
                  title={renderSource.proof.summary}
                >
                  {renderSource.proof.summary}
                </span>
              )}
              <a
                data-testid="hedge-proof-link"
                href="/analytics/hedge/proof/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-goodgreen hover:underline font-mono"
                title={renderSource.proof.path}
              >
                latest proof →
              </a>
            </div>
          )}
        </div>
      </header>

      {isThrottled && throttle && (
        <div
          data-testid="hedge-status-throttled"
          className="mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200 flex items-center justify-between gap-3 flex-wrap"
        >
          <div>
            <span className="font-medium">Throttled.</span> Too many requests, retrying in{' '}
            <ThrottleCountdown retryAt={throttle.retryAt} onExpire={handleThrottleExpire} />
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
          {/* SCREAMING_SNAKE_CASE engine reasons have no soft-break points,
              so `word-break: normal` treats them as one giant word and the
              span overflows the callout on narrow viewports (task 0038).
              `break-all` lets the identifier wrap mid-token; `min-w-0`
              defends against flex/grid parents that refuse to shrink. */}
          <span className="font-mono break-all min-w-0">{breaker.reason}</span>
          {breaker.detail && (
            <span className="text-yellow-300/80 block sm:inline">
              {' '}
              — {breaker.detail}
            </span>
          )}
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
              testId="hedge-notional-stat"
              label="Today's notional"
              value={cap ? formatNotionalUsd(cap.dailyNotionalUsd) : '—'}
              sub={
                cap
                  ? `${cap.dailyOrders} orders${isStale ? ' · stale' : ''}`
                  : hasSnapshot
                  ? 'no caps'
                  : 'awaiting tick'
              }
              stale={isStale}
            />
            <Stat
              testId="hedge-cycle-orders-stat"
              label="Cycle orders"
              value={cap ? `${cap.cycleOrders}` : '—'}
              sub={
                cap
                  ? `day ${cap.dayKey}${isStale ? ' · stale' : ''}`
                  : hasSnapshot
                  ? 'no data'
                  : 'awaiting tick'
              }
              stale={isStale}
            />
            <Stat
              testId="hedge-receipts-visible-stat"
              label="Receipts visible"
              value={hasSnapshot ? `${receipts.length}` : '—'}
              sub={
                hasSnapshot
                  ? `newest 5${isStale ? ' · stale' : ''}`
                  : 'awaiting tick'
              }
              stale={isStale}
            />
            <Stat
              testId="hedge-engine-stat"
              label="Engine"
              value={engineState.statLabel}
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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium text-gray-300">Recent receipts</h3>
            {isStale && staleSinceMs !== null && (
              <StaleChip sinceMs={staleSinceMs} />
            )}
          </div>
          {data?.degraded?.receipts && (
            <DegradedHint>receipts source degraded: {data.degraded.receipts}</DegradedHint>
          )}
        </div>
        <div
          data-testid="hedge-receipts-reserved"
          className="min-h-[7rem] flex flex-col justify-start"
        >
        {receipts.length === 0 ? (
          <EmptyReceiptsState
            error={error}
            hasSnapshot={hasSnapshot}
            degradedReceipts={data?.degraded?.receipts}
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
              {receipts.map((r) => (
                <ReceiptRow key={r.id} receipt={r} />
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </section>
  )
})

HedgeStatusCard.displayName = 'HedgeStatusCard'
export default HedgeStatusCard

// Memoised so the four stat tiles skip the className build + re-render
// when their (entirely-primitive) props are unchanged. Default shallow
// compare is sufficient — every prop is a string/boolean.
const Stat = memo(function Stat({
  label,
  value,
  sub,
  color,
  testId,
  subColor,
  subMono,
  subTestId,
  stale,
}: {
  label: string
  value: string
  sub?: string
  color?: string
  testId?: string
  subColor?: string
  subMono?: boolean
  subTestId?: string
  stale?: boolean
}) {
  const subClasses = [
    'text-xs',
    subColor ?? 'text-gray-500',
    subMono ? 'font-mono truncate max-w-[14ch]' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const containerClasses = [
    'bg-dark-50 rounded-xl p-3 flex flex-col gap-0.5',
    stale ? 'opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={containerClasses}>
      <span className="text-xs text-gray-400 uppercase tracking-wide min-h-[2lh] sm:min-h-0">{label}</span>
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
})

// Receipt rows come from a fresh JSON parse on every poll, so object
// identity is never stable. Compare on the exact subset of fields the
// row JSX reads so a byte-identical receipt skips re-render entirely.
// NB: extending the row's JSX requires adding any new field here too.
function areReceiptPropsEqual(
  a: Readonly<{ receipt: HedgeReceipt }>,
  b: Readonly<{ receipt: HedgeReceipt }>,
): boolean {
  const x = a.receipt
  const y = b.receipt
  return (
    x.id === y.id &&
    x.timestamp === y.timestamp &&
    x.success === y.success &&
    x.notionalUsd === y.notionalUsd &&
    x.beforeExposure === y.beforeExposure &&
    x.afterExposure === y.afterExposure &&
    x.etoroOrderId === y.etoroOrderId &&
    x.symbol === y.symbol &&
    x.side === y.side &&
    x.error === y.error
  )
}

const ReceiptRow = memo(function ReceiptRow({ receipt: r }: { receipt: HedgeReceipt }) {
  const delta = formatExposureDelta(r.beforeExposure, r.afterExposure)
  return (
    <tr
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
        <div data-testid="hedge-receipt-etoro-id" className="text-gray-500">
          eToro:{' '}
          {/* eToro order ids are opaque ~48-char identifiers. Without a
              cap they single-handedly push the receipts table 2.4×
              wider than its scroller on a 375-px phone, hiding
              SYMBOL / SIDE / NOTIONAL / Δ / STATUS to the right. The
              fixed 10ch cap keeps column geometry stable across
              viewports; the title attribute restores full text on
              hover/long-press (task 0039). */}
          {r.etoroOrderId ? (
            <span
              className="text-gray-400 inline-block max-w-[10ch] truncate align-bottom"
              title={r.etoroOrderId}
            >
              {r.etoroOrderId}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
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
}, areReceiptPropsEqual)
