'use client'

import { useMemo } from 'react'

import { useWatchlist } from '@/lib/useWatchlist'

/**
 * Backward-compatible facade for older GoodStocks browse components/tests.
 *
 * The canonical local-storage watchlist hook is `useWatchlist`; this adapter
 * preserves the previous `{ favorites, toggleFavorite, isFavorite }` shape
 * without reintroducing a second storage key or duplicate state source.
 */
export function useStockWatchlist() {
  const { watchlist, toggle, isWatched } = useWatchlist()
  const favorites = useMemo(() => new Set(watchlist), [watchlist])

  return {
    favorites,
    toggleFavorite: toggle,
    isFavorite: isWatched,
    hydrated: true,
  }
}
