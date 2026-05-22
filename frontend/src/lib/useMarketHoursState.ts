'use client'

import { useState, useEffect } from 'react'
import { getMarketHoursState, type MarketHoursState } from './ammPricing'

const REFRESH_INTERVAL_MS = 60_000

export function useMarketHoursState(): MarketHoursState {
  const [state, setState] = useState<MarketHoursState>(() =>
    getMarketHoursState(new Date()),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setState(getMarketHoursState(new Date()))
    }, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return state
}
