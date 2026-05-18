'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function BridgeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Bridge Unavailable" message="Unable to load bridge. Please try again." reset={reset} homeHref="/bridge" homeLabel="Bridge" error={error} />
}
