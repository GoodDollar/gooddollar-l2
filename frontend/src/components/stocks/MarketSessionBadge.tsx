'use client'

import { useEffect, useState } from 'react'
import { getMarketSession, type MarketSession } from '@/lib/marketHours'

export function MarketSessionBadge() {
  const [session, setSession] = useState<MarketSession>(getMarketSession)

  useEffect(() => {
    const id = setInterval(() => setSession(getMarketSession()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <span
      data-testid="market-session-badge"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        session.state === 'open'
          ? 'border-green-500/30 bg-green-500/10'
          : session.state === 'closed'
            ? 'border-gray-500/30 bg-gray-500/10'
            : 'border-yellow-500/30 bg-yellow-500/10'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${session.dotColor} ${
          session.state === 'open' ? 'animate-pulse' : ''
        }`}
      />
      <span className={session.color}>{session.label}</span>
      <span className="text-gray-500 text-[10px] hidden sm:inline">
        · {session.nextEventLabel}
      </span>
    </span>
  )
}
