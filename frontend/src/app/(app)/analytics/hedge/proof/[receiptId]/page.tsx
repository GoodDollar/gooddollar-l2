'use client'

import { use } from 'react'

import HedgeProofViewer from '@/components/HedgeProofViewer'

/**
 * Lane 5 — per-receipt hedge proof viewer (task 0045).
 *
 * Delegates to the shared `<HedgeProofViewer>` component used by
 * `/analytics/hedge/proof/latest`. Only the endpoint and not-found
 * copy differ — the receipt id is forwarded verbatim, URL-encoded by
 * the helper so opaque ids stay safe on the wire.
 */

const TRUNCATE_THRESHOLD = 24
const HEAD_KEEP = 12
const TAIL_KEEP = 8

/**
 * Collapse very long opaque receipt ids in the visible headline so the
 * "Proof not found" card title doesn't overflow on narrow viewports
 * (#0063). Short ids (≤24 chars) render verbatim. The full id is still
 * surfaced via the h2's `title=` tooltip for copy-paste recovery.
 */
export function truncateReceiptId(id: string): string {
  if (id.length <= TRUNCATE_THRESHOLD) return id
  return `${id.slice(0, HEAD_KEEP)}…${id.slice(-TAIL_KEEP)}`
}

interface PageProps {
  params: Promise<{ receiptId: string }>
}

/**
 * Extracted from the default export so unit tests can render the
 * presentation without going through React's `use(params)` Promise-
 * unwrapping (which is a Next 16 / experimental React API).
 */
export function PerReceiptProofView({ receiptId }: { receiptId: string }) {
  const safe = encodeURIComponent(receiptId)
  const headlineId = truncateReceiptId(receiptId)
  const truncated = headlineId !== receiptId
  return (
    <HedgeProofViewer
      endpoint={`/api/hedge/proof/${safe}`}
      notFoundTitle={`Proof not found for receipt ${headlineId}`}
      notFoundDetail="The hedge engine has no proof artifact for this receipt id. It may have been pruned or the id may belong to a different engine instance."
      notFoundTitleTooltip={truncated ? receiptId : undefined}
      surface="receipt"
    />
  )
}

export default function HedgeProofViewerPerReceiptPage({ params }: PageProps) {
  const { receiptId } = use(params)
  return <PerReceiptProofView receiptId={receiptId} />
}
