import type { Stock } from '@/lib/stockData'

export function getRelatedSymbols(stocks: Stock[], ticker: string, limit: number = 4): Stock[] {
  const current = stocks.find((s) => s.ticker === ticker)
  if (!current) return []

  return stocks
    .filter((s) => s.ticker !== ticker)
    .sort((a, b) => {
      const aScore = (a.sector === current.sector ? 1000 : 0) - Math.abs(a.marketCap - current.marketCap) / 1e10
      const bScore = (b.sector === current.sector ? 1000 : 0) - Math.abs(b.marketCap - current.marketCap) / 1e10
      return bScore - aScore
    })
    .slice(0, limit)
}

export function getTopMovers(stocks: Stock[], limit: number = 4): Stock[] {
  return [...stocks]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, limit)
}
