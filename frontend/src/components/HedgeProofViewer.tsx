'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { HEDGE_POLL_INTERVAL_MS } from '@/lib/hedgePollInterval'
import { useIntervalWhileVisible } from '@/lib/useIntervalWhileVisible'

import HedgeProofErrorCard from './HedgeProofErrorCard'
import {
  copyForResponse,
  type ErrorCopy,
  type ProofResponse,
  type ProofSurface,
} from './HedgeProofViewer/proof-response'

/**
 * Wire statuses for which the proof viewer auto-retries on the shared
 * 10s cadence (task 0080). Mirrors the sibling `HedgeStatusCard`'s
 * polling behavior so the operator sees the same recovery cadence on
 * both surfaces. Deterministic verdicts (`invalid_id`, `forbidden`,
 * `missing`) are intentionally absent — re-firing the same fetch will
 * fail the same validator forever (#0072), and `ok` / `no_proof` /
 * `empty_body` / `loading` are not error states that benefit from
 * polling.
 */
const AUTO_RETRY_STATUSES = new Set([
  'engine_down',
  'engine_error',
  'unreadable',
  'network_error',
])

const AUTO_RETRY_NOTE = `Auto-retrying every ${Math.round(
  HEDGE_POLL_INTERVAL_MS / 1000,
)}s.`

export type {
  ProofResponse,
  ProofSurface,
} from './HedgeProofViewer/proof-response'

/**
 * Lane 5 — shared in-app hedge proof viewer.
 *
 * Renders the markdown body alongside pointer metadata (timestamp,
 * summary) for any proof endpoint. Both the `latest` viewer
 * (`/analytics/hedge/proof/latest`) and the new per-receipt viewer
 * (`/analytics/hedge/proof/[receiptId]`, task 0045) compose this same
 * component — only the API endpoint + the not-found copy differ.
 *
 * Failure modes are surfaced honestly per the spec:
 *   - engine_down / engine_error: red banner with retry,
 *   - no_proof / 404: dedicated friendly fallback,
 *   - empty markdown body: friendly empty-body state (task 0037),
 *   - parse / network failure: branded fallback (no raw exception
 *     copy leaks to the page).
 */

type OkData = Extract<ProofResponse, { status: 'ok' }>

type ViewState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: OkData }
  | { kind: 'empty_body'; data: OkData }
  | { kind: 'no_proof' }
  // The `status` field carries the underlying machine-readable wire
  // status (`engine_down`, `engine_error`, `unreadable`, `forbidden`,
  // `missing`, `invalid_id`) for `ProofResponse`-shaped failures, or a
  // synthesised sentinel (`network_error`, `unreadable`) for fetch /
  // JSON-parse failures. The recovery-row recap renders it verbatim
  // so an operator pasting the line into Slack carries both endpoint
  // and raw status (#0071).
  | { kind: 'error'; copy: ErrorCopy; status: string }

function copyForNetwork(): ErrorCopy {
  return {
    title: 'No network connection',
    detail: 'Could not reach the proof endpoint. Check your connection and retry.',
  }
}

function renderTimestamp(ms: number): { iso: string; relative: string } {
  const iso = Number.isFinite(ms) ? new Date(ms).toISOString() : ''
  const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  let relative: string
  if (!Number.isFinite(ms)) relative = 'unknown'
  else if (diff < 60) relative = `${diff}s ago`
  else if (diff < 3600) relative = `${Math.floor(diff / 60)}m ago`
  else if (diff < 86400) relative = `${Math.floor(diff / 3600)}h ago`
  else relative = `${Math.floor(diff / 86400)}d ago`
  return { iso, relative }
}

export interface HedgeProofViewerProps {
  /** API endpoint that returns the `ProofResponse` JSON shape. */
  endpoint: string
  /**
   * Headline + body shown when the endpoint returns `no_proof` (404).
   * The default copy is tuned for the "latest" viewer; per-receipt
   * viewers override it so the title can include the receipt id.
   */
  notFoundTitle?: string
  notFoundDetail?: string
  /**
   * Optional `title=` attribute forwarded onto the no_proof error
   * card's `<h2>` (#0063). The per-receipt viewer truncates very long
   * ids in the visible headline but stashes the full id here for
   * hover / long-press copy-paste recovery.
   */
  notFoundTitleTooltip?: string
  /**
   * Raw markdown escape-hatch link rendered inside the metadata strip.
   * The latest viewer points at `/api/hedge/proof/latest`; per-receipt
   * viewers omit this since there is no equivalent markdown route.
   */
  rawMarkdownHref?: string
  /**
   * Which proof surface is rendering. Drives per-surface error copy
   * (`copyForResponse`) so the engine_down/engine_error cards say the
   * right thing on the per-receipt page (#0061). Defaults to `'latest'`
   * for backwards-compatibility with the existing latest viewer.
   */
  surface?: ProofSurface
  /**
   * Receipt id rendered as a sub-line below `<h1>Hedge proof</h1>` so a
   * shared / bookmarked per-receipt URL gives the visitor immediate
   * confirmation of *which* receipt they are looking at — in every view
   * state (loading / ok / no_proof / engine_down / network_error) (#0075).
   *
   * Opt-in: the `/latest` viewer omits this so its header is unchanged.
   * The visible string should already be truncated via `truncateReceiptId`
   * by the caller; pass the full untruncated id via `receiptIdTooltip`
   * when truncation occurred so hover / a11y still expose it.
   */
  receiptId?: string
  receiptIdTooltip?: string
}

const DEFAULT_NOT_FOUND_TITLE = 'No hedge proof yet'
const DEFAULT_NOT_FOUND_DETAIL =
  'The hedge engine has not written any proof artifacts yet. The dashboard will surface a proof link the moment the next cycle completes.'

export default function HedgeProofViewer({
  endpoint,
  notFoundTitle = DEFAULT_NOT_FOUND_TITLE,
  notFoundDetail = DEFAULT_NOT_FOUND_DETAIL,
  notFoundTitleTooltip,
  rawMarkdownHref,
  surface = 'latest',
  receiptId,
  receiptIdTooltip,
}: HedgeProofViewerProps) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' })

  // Race-condition guards (#0065). Mirrors the canonical pattern from
  // `HedgeStatusCard` (#0011):
  //   - `seqRef`: monotonic per-load counter; only the latest fetch's
  //     `setView` calls win even if a slow upstream ignores the abort.
  //   - `abortRef`: latest controller so a new load cancels its
  //     predecessor and unmount cancels whichever is in flight.
  // Retry calls `load` directly through this same path so a stale
  // retry response can never overwrite a newer one.
  const seqRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const mySeq = ++seqRef.current
    setView({ kind: 'loading' })

    let res: Response
    try {
      res = await fetch(endpoint, {
        cache: 'no-store',
        signal: controller.signal,
      })
    } catch {
      if (controller.signal.aborted) return
      if (mySeq !== seqRef.current) return
      setView({
        kind: 'error',
        copy: copyForNetwork(),
        status: 'network_error',
      })
      return
    }
    let body: ProofResponse
    try {
      body = (await res.json()) as ProofResponse
    } catch {
      if (controller.signal.aborted) return
      if (mySeq !== seqRef.current) return
      setView({
        kind: 'error',
        copy: {
          title: 'Hedge engine returned an unreadable response',
          detail: 'The proof endpoint did not return JSON.',
        },
        status: 'unreadable',
      })
      return
    }
    if (mySeq !== seqRef.current) return
    if (body.status === 'ok') {
      if (body.markdown.trim().length === 0) {
        setView({ kind: 'empty_body', data: body })
      } else {
        setView({ kind: 'ok', data: body })
      }
      return
    }
    if (body.status === 'no_proof') {
      setView({ kind: 'no_proof' })
      return
    }
    setView({
      kind: 'error',
      copy: copyForResponse(body, surface),
      status: body.status,
    })
  }, [endpoint, surface])

  useEffect(() => {
    void load()
    return () => {
      abortRef.current?.abort()
    }
  }, [load])

  // Auto-retry on the same 10s cadence as `HedgeStatusCard` whenever
  // the viewer is sitting in an auto-retried error status (task 0080).
  // `useIntervalWhileVisible` deliberately does NOT fire on mount, so
  // the initial fetch above is not duplicated and the first scheduled
  // retry lands exactly `HEDGE_POLL_INTERVAL_MS` after we entered the
  // error state. Manual Retry transitions `view` through `loading`,
  // which flips `enabled` off → on and naturally resets the interval
  // phase so the next auto-retry is `+10s` from the click rather than
  // `+0s`. Visibility pause/resume is provided by the hook.
  const autoRetryEnabled =
    view.kind === 'error' && AUTO_RETRY_STATUSES.has(view.status)
  useIntervalWhileVisible(load, HEDGE_POLL_INTERVAL_MS, {
    enabled: autoRetryEnabled,
  })

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <PageHeader receiptId={receiptId} receiptIdTooltip={receiptIdTooltip} />
      {view.kind === 'loading' && <LoadingState />}
      {view.kind === 'ok' && (
        <OkState data={view.data} rawMarkdownHref={rawMarkdownHref} />
      )}
      {view.kind === 'empty_body' && (
        <EmptyBodyState
          data={view.data}
          onRetry={load}
          rawMarkdownHref={rawMarkdownHref}
        />
      )}
      {view.kind === 'no_proof' && (
        <>
          <HedgeProofErrorCard
            title={notFoundTitle}
            detail={notFoundDetail}
            onRetry={load}
            titleTooltip={notFoundTitleTooltip}
          />
          <ProofErrorRecoveryRow
            endpoint={endpoint}
            status="no_proof"
            rawMarkdownHref={rawMarkdownHref}
          />
        </>
      )}
      {view.kind === 'error' && (
        <>
          {view.status === 'invalid_id' ? (
            // `invalid_id` is a deterministic verdict on the URL itself —
            // re-firing the same fetch will fail the same validator
            // forever. Suppress Retry and offer the receipts table as the
            // primary recovery (#0072). No auto-retry note either —
            // copy would lie about behavior the page doesn't exhibit.
            <HedgeProofErrorCard
              title={view.copy.title}
              detail={view.copy.detail}
              variant="error"
              primaryAction={{
                label: 'Open receipts table',
                href: '/analytics#hedge-recent-receipts',
              }}
            />
          ) : (
            <HedgeProofErrorCard
              title={view.copy.title}
              detail={view.copy.detail}
              onRetry={load}
              variant="error"
              autoRetryNote={
                AUTO_RETRY_STATUSES.has(view.status) ? AUTO_RETRY_NOTE : undefined
              }
            />
          )}
          <ProofErrorRecoveryRow
            endpoint={endpoint}
            status={view.status}
            rawMarkdownHref={rawMarkdownHref}
          />
        </>
      )}
    </div>
  )
}

function PageHeader({
  receiptId,
  receiptIdTooltip,
}: {
  receiptId?: string
  receiptIdTooltip?: string
}) {
  // The full id stays accessible via `title=` and `aria-label=` whether
  // or not the visible string was truncated by the caller. We fall back
  // to the visible id so screen readers always read the available id.
  const fullId = receiptIdTooltip ?? receiptId
  return (
    <header className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link
          data-testid="hedge-proof-back-link"
          href="/analytics"
          className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1"
        >
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">Hedge proof</h1>
        {receiptId && (
          <p
            data-testid="hedge-proof-page-receipt-id"
            className="mt-1 text-sm text-gray-400 font-mono"
            title={fullId}
            aria-label={`Receipt ${fullId}`}
          >
            Receipt {receiptId}
          </p>
        )}
      </div>
      <CopyLinkButton />
    </header>
  )
}

/**
 * Hands the canonical proof URL to clipboard in one click so an operator
 * can paste it into a Slack thread / audit ticket without fumbling for
 * the address bar (especially on mobile where browser chrome auto-hides)
 * (#0077). Always copies `window.location.href` so the action stays
 * correct across `/latest`, `/[receiptId]`, hash fragments, and query
 * state without per-surface wiring.
 *
 * State machine:
 *   - `idle`     — default; label reads "Copy link".
 *   - `copied`   — `writeText` resolved; label reads "Copied" for
 *                  COPIED_REVERT_MS, then auto-reverts to `idle`.
 *   - `fallback` — `navigator.clipboard` is unavailable or `writeText`
 *                  rejected (insecure context, denied permission, older
 *                  iframe). Renders a focusable read-only `<input>`
 *                  pre-selected with the URL plus a "Press ⌘C / Ctrl+C
 *                  to copy" hint so the user can keyboard-copy.
 *
 * SSR-safe: returns `null` until the first client paint confirms
 * `navigator` exists, avoiding a hydration mismatch.
 */
const COPIED_REVERT_MS = 1500

function CopyLinkButton() {
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<'idle' | 'copied' | 'fallback'>('idle')
  const revertRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (revertRef.current) clearTimeout(revertRef.current)
    }
  }, [])

  // Auto-select the fallback input as soon as it mounts so the user can
  // immediately hit ⌘C / Ctrl+C without an extra click into the field.
  useEffect(() => {
    if (state === 'fallback' && fallbackInputRef.current) {
      fallbackInputRef.current.focus()
      fallbackInputRef.current.select()
    }
  }, [state])

  if (!mounted) return null

  const handleClick = async () => {
    const href = window.location.href
    const clipboard = navigator.clipboard
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      setState('fallback')
      return
    }
    try {
      await clipboard.writeText(href)
    } catch {
      setState('fallback')
      return
    }
    setState('copied')
    if (revertRef.current) clearTimeout(revertRef.current)
    revertRef.current = setTimeout(() => setState('idle'), COPIED_REVERT_MS)
  }

  const label = state === 'copied' ? 'Copied' : 'Copy link'

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        type="button"
        data-testid="hedge-proof-copy-link-button"
        aria-label="Copy proof page link"
        onClick={handleClick}
        className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 transition-colors"
      >
        <span aria-hidden="true">🔗</span>
        <span aria-live="polite">{label}</span>
      </button>
      {state === 'fallback' && (
        <>
          <input
            ref={fallbackInputRef}
            data-testid="hedge-proof-copy-link-fallback-input"
            type="text"
            readOnly
            value={window.location.href}
            tabIndex={0}
            aria-label="Proof page URL — copy with keyboard"
            className="text-xs text-gray-200 bg-dark-100 border border-dark-50 rounded px-2 py-1 font-mono w-56 max-w-full"
          />
          <span
            data-testid="hedge-proof-copy-link-fallback-hint"
            aria-live="polite"
            className="text-[10px] text-gray-500"
          >
            Press ⌘C / Ctrl+C to copy
          </span>
        </>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <section
      data-testid="hedge-proof-loading"
      className="space-y-3 animate-pulse"
      aria-busy="true"
    >
      <div className="h-5 bg-dark-50 rounded w-2/3" />
      <div className="h-4 bg-dark-50 rounded w-1/2" />
      <div className="h-4 bg-dark-50 rounded w-3/4" />
      <div className="h-4 bg-dark-50 rounded w-5/6" />
    </section>
  )
}

function OkState({
  data,
  rawMarkdownHref,
}: {
  data: OkData
  rawMarkdownHref?: string
}) {
  return (
    <article data-testid="hedge-proof-viewer">
      <ProofMetadataStrip pointer={data.pointer} rawMarkdownHref={rawMarkdownHref} />
      <div
        data-testid="hedge-proof-body"
        className="prose prose-invert max-w-none rounded-xl border border-dark-50 bg-dark-100/40 p-5"
      >
        <ReactMarkdown>{data.markdown}</ReactMarkdown>
      </div>
    </article>
  )
}

function ProofMetadataStrip({
  pointer,
  rawMarkdownHref,
}: {
  pointer: OkData['pointer']
  rawMarkdownHref?: string
}) {
  const ts = renderTimestamp(pointer.timestamp)
  return (
    <div className="mb-4 flex items-center gap-3 flex-wrap text-xs text-gray-400">
      <span title={ts.iso} data-testid="hedge-proof-timestamp">
        {ts.relative}
      </span>
      {pointer.summary && (
        <span
          data-testid="hedge-proof-summary"
          className="rounded-md bg-dark-50 px-2 py-0.5 font-mono text-gray-300"
          title={pointer.summary}
        >
          {pointer.summary}
        </span>
      )}
      {rawMarkdownHref && (
        <a
          data-testid="hedge-proof-raw-link"
          href={rawMarkdownHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-goodgreen hover:underline"
        >
          View raw markdown
        </a>
      )}
    </div>
  )
}

function EmptyBodyState({
  data,
  onRetry,
  rawMarkdownHref,
}: {
  data: OkData
  onRetry: () => void | Promise<void>
  rawMarkdownHref?: string
}) {
  return (
    <article>
      <ProofMetadataStrip pointer={data.pointer} rawMarkdownHref={rawMarkdownHref} />
      <HedgeProofErrorCard
        testid="hedge-proof-empty-body"
        title="Proof body is empty"
        detail="The engine wrote a pointer but the markdown body is empty. This usually means the current cycle is still in progress — try again in a few seconds, or view the raw file."
        onRetry={onRetry}
      />
    </article>
  )
}

/**
 * Secondary recovery affordances rendered beneath the error / no_proof
 * cards (#0071). The Retry button alone is not useful when the engine
 * is down (the operator already knows clicking Retry won't help until
 * the engine recovers); this row gives them somewhere to go:
 *
 *   - `View raw markdown ↗` — escape-hatch to the raw endpoint when
 *     ops scripts or curl are the only way forward (only rendered
 *     when the parent passes `rawMarkdownHref`; per-receipt viewer
 *     omits it because there is no equivalent markdown route).
 *   - `Jump to receipts table ↓` — anchor to `#hedge-recent-receipts`
 *     on `/analytics`, the table they're most likely heading to next.
 *     The anchor sits on the receipts panel itself (not the outer
 *     hedge-card section) so the user lands directly on Recent
 *     receipts without scrolling past the stat tiles (#0076).
 *   - Endpoint + status recap — machine-readable line so an operator
 *     copy-pasting it into Slack carries both pieces of context.
 */
function ProofErrorRecoveryRow({
  endpoint,
  status,
  rawMarkdownHref,
}: {
  endpoint: string
  status: string
  rawMarkdownHref?: string
}) {
  return (
    <div
      data-testid="hedge-proof-recovery-row"
      className="mt-4 space-y-2"
    >
      <div className="flex items-center gap-4 flex-wrap text-xs">
        {rawMarkdownHref && (
          <a
            data-testid="hedge-proof-recovery-raw-link"
            href={rawMarkdownHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-goodgreen hover:underline"
          >
            View raw markdown ↗
          </a>
        )}
        <Link
          data-testid="hedge-proof-recovery-jump-link"
          href="/analytics#hedge-recent-receipts"
          className="text-goodgreen hover:underline"
        >
          Jump to receipts table ↓
        </Link>
      </div>
      <div
        data-testid="hedge-proof-recovery-recap"
        className="text-xs text-gray-500 font-mono space-y-0.5 min-w-0"
      >
        {/*
          `truncate` (= overflow-hidden text-ellipsis whitespace-nowrap)
          keeps the endpoint to a single line and ellipsises overflow at
          the right edge. Pathological receipt ids (up to the validator's
          256-char max) were forcing a 3-line wrap on desktop and pushing
          horizontal scroll onto <body> on a 375px viewport (#0073). The
          status moves to its own line below so it is never the thing
          that gets clipped. The full endpoint stays accessible via
          hover (desktop) / long-press (mobile) through `title=`.
        */}
        <span
          data-testid="hedge-proof-recovery-recap-endpoint"
          className="block max-w-full truncate"
          title={endpoint}
        >
          Endpoint: {endpoint}
        </span>
        <span
          data-testid="hedge-proof-recovery-recap-status"
          className="block"
        >
          status: {status}
        </span>
      </div>
    </div>
  )
}
