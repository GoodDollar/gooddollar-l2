'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function AgentsRegisterError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback title="Registration Unavailable" message="Unable to load agent registration. Please try again." reset={reset} homeHref="/agents" homeLabel="Agents" />
}
