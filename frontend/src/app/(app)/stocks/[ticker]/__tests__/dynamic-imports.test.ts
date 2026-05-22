import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = readFileSync(
  resolve(__dirname, '..', 'page.tsx'),
  'utf-8',
)

const MUST_BE_LAZY = [
  'PriceChart',
  'AmmTradingPanel',
  'ExposureNettingPanel',
  'StockResearchHub',
  'NewsEventsPanel',
  'RelatedMoversPanel',
  'AnalystOutlookCard',
]

const MUST_STAY_STATIC = [
  'StockOrderForm',
  'WatchlistStarButton',
  'OracleStatusBadge',
  'OracleUnavailableBanner',
]

describe('stocks/[ticker] dynamic imports', () => {
  for (const name of MUST_BE_LAZY) {
    it(`${name} is lazy-loaded via React.lazy`, () => {
      const pattern = new RegExp(
        `const\\s+${name}\\s*=\\s*lazy\\(`,
      )
      expect(src).toMatch(pattern)
    })
  }

  it('all lazy components are wrapped in <Suspense>', () => {
    expect(src).toContain('<Suspense')
    for (const name of MUST_BE_LAZY) {
      const usagePattern = new RegExp(`<${name}[\\s/>]`)
      expect(src).toMatch(usagePattern)
    }
  })

  for (const name of MUST_STAY_STATIC) {
    it(`${name} is a static import (above-fold / critical)`, () => {
      const lazyPattern = new RegExp(
        `const\\s+${name}\\s*=\\s*lazy\\(`,
      )
      expect(src).not.toMatch(lazyPattern)
      expect(src).toContain(`import { ${name} }`)
    })
  }
})
