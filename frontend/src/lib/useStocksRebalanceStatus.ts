'use client'

import { useEffect, useMemo, useState } from 'react'

import type { RebalanceInvariantResult } from '@/lib/stocksRebalanceInvariant'
import { isPageHidden, subscribePageVisibility } from '@/lib/usePageVisibility'
import { buildRebalanceStatusUrl } from '@/lib/stocksDefaultSymbols'

interface RebalanceApiResponse {
  generatedAt: string
  currentBlock: number
  symbols: RebalanceInvariantResult[]
  stopActive: boolean
}

interface UseStocksRebalanceStatusResult {
  data: RebalanceApiResponse | null
  isLoading: boolean
  error: string | null
  bySymbol: Record<string, RebalanceInvariantResult>
}

const POLL_MS = 10_000
const inflightByUrl = new Map<string, Promise<RebalanceApiResponse>>()

async function fetchRebalanceStatus(url: string): Promise<RebalanceApiResponse> {
  const inflight = inflightByUrl.get(url)
  if (inflight) return inflight

  const request = (async () => {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`rebalance status ${res.status}`)
    return await res.json() as RebalanceApiResponse
  })()

  inflightByUrl.set(url, request)
  request.then(() => {
    if (inflightByUrl.get(url) === request) {
      inflightByUrl.delete(url)
    }
  }, () => {
    if (inflightByUrl.get(url) === request) {
      inflightByUrl.delete(url)
    }
  })

  return request
}

export function useStocksRebalanceStatus(symbols: string[]): UseStocksRebalanceStatusResult {
  // Delegate URL building to the shared helper so the layout's preload href
  // and this hook's runtime fetch cannot drift (task 0049). The helper
  // applies trim → uppercase → dedupe → sort → encodeURIComponent.
  const url = useMemo(() => buildRebalanceStatusUrl(symbols), [symbols])
  const [data, setData] = useState<RebalanceApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const tick = async () => {
      try {
        const next = await fetchRebalanceStatus(url)
        if (cancelled) return
        setData(next)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'rebalance status unavailable')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    const disarm = () => {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
    }
    const arm = () => {
      if (timer === null) timer = setInterval(tick, POLL_MS)
    }

    if (!isPageHidden()) {
      void tick()
      arm()
    }

    const unsubscribe = subscribePageVisibility((hidden) => {
      if (cancelled) return
      if (hidden) {
        disarm()
      } else {
        void tick()
        arm()
      }
    })

    return () => {
      cancelled = true
      disarm()
      unsubscribe()
    }
  }, [url])

  const bySymbol = useMemo(() => {
    const next: Record<string, RebalanceInvariantResult> = {}
    for (const entry of data?.symbols ?? []) {
      next[entry.symbol] = entry
    }
    return next
  }, [data])

  return { data, isLoading, error, bySymbol }
}
