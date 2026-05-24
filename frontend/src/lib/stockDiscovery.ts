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

export function getDailyMovers(stocks: Stock[], limit: number = 6): Stock[] {
  return [...stocks]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, limit)
}

export function getTrendingStocks(stocks: Stock[], limit: number = 6): Stock[] {
  return [...stocks]
    .sort((a, b) => {
      const aScore = (a.volume24h * 0.7) + (a.marketCap * 0.3)
      const bScore = (b.volume24h * 0.7) + (b.marketCap * 0.3)
      return bScore - aScore
    })
    .slice(0, limit)
}

// Task 0036 — previously combined a fabricated analyst-consensus upside
// with `change24h` to score "picks". With the analyst feed unwired, the
// only honest signal left is signed 24h change. Once a real consensus
// source lands the upside term can fold back in here.
export function getMarketAnalysisPicks(stocks: Stock[], limit: number = 6): Stock[] {
  return [...stocks]
    .sort((a, b) => b.change24h - a.change24h)
    .slice(0, limit)
}
