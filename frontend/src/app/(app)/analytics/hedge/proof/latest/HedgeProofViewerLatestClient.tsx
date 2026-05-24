'use client'

import HedgeProofViewer from '@/components/HedgeProofViewer'

/**
 * Lane 5 — in-app hedge proof viewer (latest).
 *
 * Replaces the raw `text/markdown` dead-end at
 * `/api/hedge/proof/latest` with a styled, branded page that lives
 * inside the app shell. Delegates to the shared
 * `<HedgeProofViewer>` component so the per-receipt viewer
 * (`/analytics/hedge/proof/[receiptId]`, task 0045) renders the same
 * surface from the same source. The raw markdown route is unchanged
 * so curl / automation users see no behavioural change.
 */

export default function HedgeProofViewerLatestClient() {
  return (
    <HedgeProofViewer
      endpoint="/api/hedge/proof/latest.json"
      rawMarkdownHref="/api/hedge/proof/latest"
      surface="latest"
    />
  )
}
