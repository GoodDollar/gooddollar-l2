import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = readFileSync(
  resolve(__dirname, '..', 'page.tsx'),
  'utf-8',
)

const MUST_STAY_STATIC = [
  'PriceChart',
  'DepthChart',
  'StockMarketData',
  'AnalystOutlookCard',
  'NewsEventsPanel',
  'RelatedMoversPanel',
  'StockAccountPanel',
  'WalletConnectConfigWarning',
  'WatchlistStarButton',
  'MobileTradeStickyBar',
  'OracleStatusBadge',
]

describe('stocks/[ticker] component loading strategy', () => {
  it('does not lazy-load dynamic-route client references', () => {
    expect(src).not.toContain('next/dynamic')
    expect(src).not.toContain('lazy(')
  })

  for (const name of MUST_STAY_STATIC) {
    it(`${name} stays as a static import`, () => {
      const lazyPattern = new RegExp(`const\\s+${name}\\s*=\\s*lazy\\(`)
      expect(src).not.toMatch(lazyPattern)
      expect(src).toContain(`import { ${name} }`)
    })
  }
})
