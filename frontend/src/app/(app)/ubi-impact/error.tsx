'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function UBIImpactError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="UBI Impact Unavailable" message="Unable to load UBI impact data. Please try again." reset={reset} homeHref="/ubi-impact" homeLabel="UBI Impact" />
}
