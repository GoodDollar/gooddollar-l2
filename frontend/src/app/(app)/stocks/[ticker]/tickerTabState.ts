import type { Stock } from '@/lib/stockData'

export type TickerTab = 'overview' | 'fundamentals' | 'events'

export function parseTickerTab(value: string | null | undefined): TickerTab {
  if (value === 'fundamentals' || value === 'events') return value
  return 'overview'
}

export interface FundamentalsRow {
  label: string
  value: string
  delta: string
  positive: boolean | null
}

export function buildFundamentalsRows(stock: Stock): FundamentalsRow[] {
  const revenueBillions = stock.marketCap / Math.max(stock.peRatio, 1) / 1_000_000_000
  const grossMargin = 42 + Math.min(12, Math.max(-8, stock.change24h))
  const fcfMargin = 18 + Math.min(8, Math.max(-6, stock.change24h / 1.5))
  const epsGrowth = stock.change24h * 2.1
  const revGrowth = stock.change24h * 1.4

  return [
    {
      label: 'Revenue (TTM)',
      value: `$${revenueBillions.toFixed(1)}B`,
      delta: `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}% YoY`,
      positive: revGrowth >= 0,
    },
    {
      label: 'EPS (TTM)',
      value: `$${stock.eps.toFixed(2)}`,
      delta: `${epsGrowth >= 0 ? '+' : ''}${epsGrowth.toFixed(1)}% YoY`,
      positive: epsGrowth >= 0,
    },
    {
      label: 'P/E',
      value: `${stock.peRatio.toFixed(1)}x`,
      delta: stock.peRatio < 25 ? 'Below sector median' : 'Above sector median',
      positive: null,
    },
    {
      label: 'Gross Margin',
      value: `${grossMargin.toFixed(1)}%`,
      delta: `${stock.change24h >= 0 ? '+' : ''}${Math.abs(stock.change24h * 0.4).toFixed(1)} pts`,
      positive: stock.change24h >= 0,
    },
    {
      label: 'FCF Margin',
      value: `${fcfMargin.toFixed(1)}%`,
      delta: `${stock.change24h >= 0 ? '+' : ''}${Math.abs(stock.change24h * 0.3).toFixed(1)} pts`,
      positive: stock.change24h >= 0,
    },
    {
      label: 'Dividend Yield',
      value: stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—',
      delta: stock.dividendYield > 0 ? 'Forward annualized' : 'No cash dividend',
      positive: null,
    },
  ]
}
