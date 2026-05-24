'use client'

import Link from 'next/link'

import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from './HedgeStatusCard/icons'

/**
 * Lane 5 — shared error card for hedge-proof surfaces.
 *
 * Extracted from `HedgeProofViewer.tsx` so every proof-related fallback
 * (engine_down, no_proof, invalid receipt id, malformed pathname) lands
 * on identical chrome — same red-bordered shell, same Retry affordance.
 * Keeping a single component prevents the two sibling surfaces
 * (`HedgeProofViewer` and the malformed-id entry-point at
 * `/analytics/hedge/proof/invalid`) from drifting visually. The
 * page-level breadcrumb in `<PageHeader>` / the invalid-id page header
 * is the single source of "back to dashboard" navigation (#0060) — the
 * card itself only ships the Retry recovery action.
 */

export interface HedgeProofErrorCardProps {
  title: string
  detail: string
  /**
   * Called when the user clicks Retry. The malformed-id entry-point
   * has no inflight request to retry, so it omits this prop and the
   * Retry button is suppressed.
   */
  onRetry?: () => void | Promise<void>
  variant?: 'error' | 'neutral'
  testid?: string
  /**
   * Optional `title=` attribute on the h2 — used by per-receipt surfaces
   * to surface the FULL receipt id when the visible title is truncated
   * (#0063). Hover (desktop) or long-press (mobile) reveals it for
   * copy-paste recovery.
   */
  titleTooltip?: string
  /**
   * Primary recovery affordance rendered as a button-styled `<Link>` in
   * the action row (#0072). Used for dead-end surfaces like `invalid_id`
   * where Retry would loop forever against an already-rejected URL —
   * the operator needs a different destination (e.g. the receipts
   * table) rather than another no-op fetch. Renders alongside (or in
   * place of) the Retry button when set.
   */
  primaryAction?: { label: string; href: string }
}

export default function HedgeProofErrorCard({
  title,
  detail,
  onRetry,
  variant = 'neutral',
  testid = 'hedge-proof-error',
  titleTooltip,
  primaryAction,
}: HedgeProofErrorCardProps) {
  const wrapperClass =
    variant === 'error'
      ? 'border-red-500/30 bg-red-500/10'
      : 'border-dark-50 bg-dark-100/40'
  const titleColor = variant === 'error' ? 'text-red-200' : 'text-white'
  // Match the dashboard's red-on-red Retry palette when the wrapper is red,
  // and keep the neutral grey on the calmer "no proof yet" / empty-body
  // surfaces. Both variants share `disabled:opacity-50` so any future
  // caller wiring an in-flight `disabled` attribute fades consistently.
  const retryClass =
    variant === 'error'
      ? 'text-xs px-3 py-1.5 rounded-md border border-red-500/40 text-red-200 hover:bg-red-500/10 disabled:opacity-50'
      : 'text-xs px-3 py-1.5 rounded-md border border-dark-50 text-gray-200 hover:bg-dark-50 disabled:opacity-50'
  // Anchor every error surface with a status glyph (#0057). The
  // exclamation-in-circle reads as "this is an error" before any copy is
  // parsed; the calmer information glyph reads as "empty state, not a
  // failure" on the no_proof / empty_body surfaces. Both icons carry
  // `aria-hidden="true"` via the shared SVG primitive — copy stays the
  // semantic source of truth for screen readers.
  const StatusGlyph =
    variant === 'error' ? ExclamationCircleIcon : InformationCircleIcon
  const iconColor = variant === 'error' ? 'text-red-400' : 'text-gray-400'
  return (
    <section
      data-testid={testid}
      className={`rounded-xl border ${wrapperClass} p-5`}
    >
      <div className="flex items-start gap-3">
        <span
          data-testid="hedge-proof-error-icon"
          className={`${iconColor} shrink-0 mt-0.5`}
        >
          <StatusGlyph size={20} />
        </span>
        <div className="min-w-0 flex-1">
          {/*
            `break-words` (overflow-wrap: break-word) wraps gracefully
            at word boundaries; the arbitrary `[overflow-wrap:anywhere]`
            keyword breaks INSIDE an unbreakable token (200-char hash,
            base64 blob) once the wrap-at-boundary attempt fails. Both
            are required: the first preserves multi-word title aesthetics
            ("Proof not found for receipt …"), the second is the safety
            net for ids longer than the card width (#0063).
          */}
          <h2
            className={`text-base font-semibold ${titleColor} break-words [overflow-wrap:anywhere]`}
            title={titleTooltip}
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-300">{detail}</p>
        </div>
      </div>
      {(primaryAction || onRetry) && (
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {primaryAction && (
            <Link
              data-testid="hedge-proof-primary-action"
              href={primaryAction.href}
              className={retryClass}
            >
              {primaryAction.label}
            </Link>
          )}
          {onRetry && (
            <button
              type="button"
              data-testid="hedge-proof-retry"
              onClick={() => void onRetry()}
              className={retryClass}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </section>
  )
}
