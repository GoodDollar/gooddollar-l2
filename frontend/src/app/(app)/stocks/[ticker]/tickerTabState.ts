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

const NO_FEED = 'Feed not wired'
const DASH = '—'

const EMPTY_LABELS = ['Revenue (TTM)', 'EPS (TTM)', 'P/E', 'Gross Margin', 'FCF Margin'] as const

function emptyRow(label: string): FundamentalsRow {
  return { label, value: DASH, delta: NO_FEED, positive: null }
}

function dividendRow(stock: Stock): FundamentalsRow {
  if (stock.dividendYield > 0) {
    return {
      label: 'Dividend Yield',
      value: `${stock.dividendYield.toFixed(2)}%`,
      delta: 'Forward annualized',
      positive: null,
    }
  }
  return { label: 'Dividend Yield', value: DASH, delta: 'No cash dividend', positive: null }
}

/**
 * Build the rows rendered by the Fundamentals tab. When `live` is false, every
 * numeric row collapses to an em-dash with a neutral "Feed not wired" delta
 * — mirroring the Analysis grid / Order Book / News empty states elsewhere on
 * the page. No fabricated baselines (the previous `42`/`18` gross/FCF margin
 * constants) ever appear in the rendered output.
 */
export function buildFundamentalsRows(stock: Stock, live: boolean): FundamentalsRow[] {
  if (!live) {
    return [...EMPTY_LABELS.map(emptyRow), dividendRow(stock)]
  }

  return [
    emptyRow('Revenue (TTM)'),
    {
      label: 'EPS (TTM)',
      value: `$${stock.eps.toFixed(2)}`,
      delta: NO_FEED,
      positive: null,
    },
    {
      label: 'P/E',
      value: `${stock.peRatio.toFixed(1)}x`,
      delta: stock.peRatio < 25 ? 'Below sector median' : 'Above sector median',
      positive: null,
    },
    emptyRow('Gross Margin'),
    emptyRow('FCF Margin'),
    dividendRow(stock),
  ]
}
