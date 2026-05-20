'use client'

import { useEffect, useState } from 'react'
import { getStockNews, type StockNewsItem } from '@/lib/stockInsights'

export function useStockNews(ticker: string): {
  items: StockNewsItem[]
  isLoading: boolean
  error: string | null
} {
  const [items, setItems] = useState<StockNewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)

    const timer = setTimeout(() => {
      try {
        if (!active) return
        setItems(getStockNews(ticker))
        setIsLoading(false)
      } catch {
        if (!active) return
        setItems([])
        setError('Failed to load news')
        setIsLoading(false)
      }
    }, 140)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [ticker])

  return { items, isLoading, error }
}
