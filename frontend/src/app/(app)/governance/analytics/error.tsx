'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function GovernanceAnalyticsError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Analytics Unavailable" message="Unable to load governance analytics. Please try again." reset={reset} homeHref="/governance" homeLabel="Governance" />
}
