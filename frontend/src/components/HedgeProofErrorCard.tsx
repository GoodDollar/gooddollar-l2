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
 * on identical chrome — same red-bordered shell, same Retry / Back to
 * dashboard affordances. Keeping a single component prevents the two
 * sibling surfaces (`HedgeProofViewer` and the malformed-id entry-point
 * at `/analytics/hedge/proof/invalid`) from drifting visually.
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
}

export default function HedgeProofErrorCard({
  title,
  detail,
  onRetry,
  variant = 'neutral',
  testid = 'hedge-proof-error',
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
          <h2 className={`text-base font-semibold ${titleColor}`}>{title}</h2>
          <p className="mt-1 text-sm text-gray-300">{detail}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 flex-wrap">
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
        <Link
          href="/analytics"
          className="text-xs text-gray-400 hover:text-white"
        >
          ← Back to dashboard
        </Link>
      </div>
    </section>
  )
}
