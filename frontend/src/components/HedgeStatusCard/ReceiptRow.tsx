'use client'

import { memo, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

import { formatExposureDelta } from '@/lib/format-exposure-delta'
import { formatNotionalUsd } from '@/lib/format-notional'
import { CopyIdButton } from './CopyIdButton'
import { InstrumentBadge } from './InstrumentBadge'

/**
 * Lane 5 — receipts table row.
 *
 * Each row is the proof artifact for a single hedge order. It carries
 * the internal hedge id (truncated to 8 chars, click-to-copy in full),
 * the eToro order id (truncated to 10ch + click-to-copy), the symbol /
 * side / notional, the before→after exposure delta, and the
 * ok/failed status. The row is itself a `role="link"` that navigates
 * to the per-receipt proof page on click or Enter/Space (task 0045);
 * in-row copy buttons stopPropagation so they never double-fire.
 */

export interface HedgeReceipt {
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

export const ReceiptRow = memo(function ReceiptRow({
  receipt: r,
}: {
  receipt: HedgeReceipt
}) {
  const delta = formatExposureDelta(r.beforeExposure, r.afterExposure)
  const router = useRouter()
  const target = `/analytics/hedge/proof/${encodeURIComponent(r.id)}`
  const handleNavigate = useCallback(() => {
    router.push(target)
  }, [router, target])
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleNavigate()
      }
    },
    [handleNavigate],
  )
  return (
    <tr
      data-testid="hedge-receipt-row"
      title={r.id}
      role="link"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      aria-label={`Open proof for receipt ${r.id}`}
      className="border-t border-dark-100 font-mono cursor-pointer hover:bg-dark-100/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goodgreen/60"
    >
      <td
        className="py-1.5 pr-2 text-xs text-gray-300"
        title={isoTitle(r.timestamp)}
      >
        {timeAgo(r.timestamp)}
      </td>
      <td className="py-1.5 pr-2 text-xs text-gray-300">
        <div>
          <CopyIdButton
            value={r.id}
            label={shortId(r.id)}
            ariaLabel={`Copy hedge id ${r.id}`}
            testId="hedge-receipt-internal-id-copy"
          />
        </div>
        <div data-testid="hedge-receipt-etoro-id" className="text-gray-500">
          eToro:{' '}
          {/* eToro order ids are opaque ~48-char identifiers. The fixed
              10ch cap (task 0039) keeps column geometry stable across
              viewports; the title attribute restores full text on
              hover/long-press. CopyIdButton wraps the truncated span so
              an operator can copy the FULL id with one tap (task 0043).
          */}
          <CopyIdButton
            value={r.etoroOrderId}
            label={r.etoroOrderId}
            ariaLabel={r.etoroOrderId ? `Copy eToro order id ${r.etoroOrderId}` : ''}
            visibleClassName="text-gray-400 inline-block max-w-[10ch] truncate align-bottom"
            placeholder={<span className="text-gray-400">—</span>}
            testId="hedge-receipt-etoro-id-copy"
          />
        </div>
      </td>
      <td className="py-1.5 pr-2 text-white">
        <span className="inline-flex items-center gap-1.5">
          <InstrumentBadge ticker={r.symbol} testId="hedge-receipt-instrument-badge" />
          <span>{r.symbol}</span>
        </span>
      </td>
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
