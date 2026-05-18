'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function GovernanceAnalyticsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Analytics Unavailable" message="Unable to load governance analytics. Please try again." reset={reset} homeHref="/governance" homeLabel="Governance" error={error} />
}
