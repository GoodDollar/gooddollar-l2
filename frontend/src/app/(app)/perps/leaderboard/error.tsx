'use client'

import { ErrorFallback } from '@/components/ui/ErrorFallback'

export default function PerpsLeaderboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback title="Leaderboard Unavailable" message="Unable to load the leaderboard. Please try again." reset={reset} homeHref="/perps" homeLabel="Perps" error={error} />
}
