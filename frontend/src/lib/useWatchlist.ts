'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  addToWatchlist,
  getWatchlist,
  isWatched,
  removeFromWatchlist,
  subscribeWatchlist,
  toggleWatchlist,
} from '@/lib/watchlist'

/**
 * React binding for the local stocks watchlist (task 0034).
 *
 * Returns the current sorted snapshot plus stable `add` / `remove` / `toggle`
 * helpers. Subscribes to the module-level pub/sub so multiple components on
 * the same page stay in sync when one of them toggles a ticker.
 */
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => getWatchlist())

  useEffect(() => {
    // Snapshot on mount in case the store was already mutated before this
    // component subscribed (e.g. another hook on the page).
    setWatchlist(getWatchlist())
    const unsubscribe = subscribeWatchlist(() => {
      setWatchlist(getWatchlist())
    })
    return unsubscribe
  }, [])

  const add = useCallback((ticker: string) => addToWatchlist(ticker), [])
  const remove = useCallback(
    (ticker: string) => removeFromWatchlist(ticker),
    [],
  )
  const toggle = useCallback((ticker: string) => toggleWatchlist(ticker), [])
  const isWatchedFn = useCallback(
    (ticker: string) => isWatched(ticker),
    // We intentionally re-create on every render so reads always reflect the
    // latest snapshot, but since the underlying call is pure, this is cheap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watchlist],
  )

  return {
    watchlist,
    isWatched: isWatchedFn,
    add,
    remove,
    toggle,
  }
}
