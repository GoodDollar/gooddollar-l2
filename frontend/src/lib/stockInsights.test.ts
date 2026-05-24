import { describe, it, expect } from 'vitest'
import { getAnalystOutlook, getStockNews } from './stockInsights'

const TICKERS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD']

/**
 * Task 0029 regression lock: no module-level analyst-consensus table.
 * `getAnalystOutlook` returns `null` for every known ticker until a real
 * adapter is wired. Any future PR that re-introduces hardcoded
 * "Street consensus aggregate" values for these tickers will break here.
 */
describe('getAnalystOutlook — no fabricated consensus table', () => {
  it.each(TICKERS)('%s has no hardcoded analyst outlook', (ticker) => {
    expect(getAnalystOutlook(ticker)).toBeNull()
  })

  it('returns null for unknown tickers', () => {
    expect(getAnalystOutlook('ZZZZ')).toBeNull()
  })
})

/**
 * Task 0030 regression lock: no module-level news headlines table.
 * `getStockNews` returns `[]` for every ticker until a real adapter is
 * wired. Any future PR that re-introduces the per-ticker headline list
 * (Apple supply-chain, Tech Ledger byline, etc.) will break here.
 */
describe('getStockNews — no fabricated news table', () => {
  it.each(TICKERS)('%s has no hardcoded news items', (ticker) => {
    expect(getStockNews(ticker)).toEqual([])
  })

  it('returns [] for unknown tickers', () => {
    expect(getStockNews('ZZZZ')).toEqual([])
  })
})
