'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'goodswap-stock-watchlist'

function readFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed.filter((t): t is string => typeof t === 'string'))
  } catch {
    // corrupted data
  }
  return new Set()
}

function writeToStorage(favorites: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]))
  } catch {
    // storage full or unavailable
  }
}

export function useStockWatchlist() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setFavorites(readFromStorage())
    setHydrated(true)
  }, [])

  const toggleFavorite = useCallback((ticker: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(ticker)) {
        next.delete(ticker)
      } else {
        next.add(ticker)
      }
      writeToStorage(next)
      return next
    })
  }, [])

  const isFavorite = useCallback((ticker: string): boolean => {
    return favorites.has(ticker)
  }, [favorites])

  return { favorites, toggleFavorite, isFavorite, hydrated }
}
