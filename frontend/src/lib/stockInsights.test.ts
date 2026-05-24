import { describe, it, expect } from 'vitest'
import { getAnalystOutlook, getStockNews } from './stockInsights'

const TICKERS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD']

// Task 0036 — the previous AnalystOutlook map shipped a hand-written
// consensus / target / rating-distribution mock for 8 tickers and
// labelled the row "Street consensus aggregate", read by the
// AnalystOutlookCard as a live feed. There is no real analyst
// consensus source wired up today, so `getAnalystOutlook` must return
// `null` for every ticker until a real provider exists.
describe('getAnalystOutlook — honest empty state', () => {
  it.each(TICKERS)('returns null for %s', (ticker) => {
    expect(getAnalystOutlook(ticker)).toBeNull()
  })

  it('returns null for an unknown ticker', () => {
    expect(getAnalystOutlook('ZZZZ')).toBeNull()
  })
})

// Task 0034 — same honest-empty-state contract for the News feed.
describe('getStockNews — honest empty state', () => {
  it.each(TICKERS)('returns [] for %s', (ticker) => {
    expect(getStockNews(ticker)).toEqual([])
  })

  it('returns [] for an unknown ticker', () => {
    expect(getStockNews('ZZZZ')).toEqual([])
  })
})
