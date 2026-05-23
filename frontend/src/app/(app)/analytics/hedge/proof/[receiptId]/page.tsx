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

interface PageProps {
  params: Promise<{ receiptId: string }>
}

export default function HedgeProofViewerPerReceiptPage({ params }: PageProps) {
  const { receiptId } = use(params)
  const safe = encodeURIComponent(receiptId)
  return (
    <HedgeProofViewer
      endpoint={`/api/hedge/proof/${safe}`}
      notFoundTitle={`Proof not found for receipt ${receiptId}`}
      notFoundDetail="The hedge engine has no proof artifact for this receipt id. It may have been pruned or the id may belong to a different engine instance."
      surface="receipt"
    />
  )
}
