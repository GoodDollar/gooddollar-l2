'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function BridgeError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Bridge Unavailable" message="Unable to load bridge. Please try again." reset={reset} homeHref="/bridge" homeLabel="Bridge" />
}
