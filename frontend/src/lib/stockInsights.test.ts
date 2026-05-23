import { describe, it, expect } from 'vitest'
import { getAnalystOutlook } from './stockInsights'

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
