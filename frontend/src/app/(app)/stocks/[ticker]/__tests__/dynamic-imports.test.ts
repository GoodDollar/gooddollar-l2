import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = readFileSync(
  resolve(__dirname, '..', 'page.tsx'),
  'utf-8',
)

const MUST_BE_DYNAMIC = [
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
  for (const name of MUST_BE_DYNAMIC) {
    it(`${name} is lazy-loaded via next/dynamic with ssr:false`, () => {
      const pattern = new RegExp(
        `const\\s+${name}\\s*=\\s*dynamic\\(`,
      )
      expect(src).toMatch(pattern)
      const chunk = src.slice(src.indexOf(`const ${name}`))
      expect(chunk.slice(0, 300)).toContain('ssr: false')
    })
  }

  for (const name of MUST_STAY_STATIC) {
    it(`${name} is a static import (above-fold / critical)`, () => {
      const dynamicPattern = new RegExp(
        `const\\s+${name}\\s*=\\s*dynamic\\(`,
      )
      expect(src).not.toMatch(dynamicPattern)
      expect(src).toContain(`import { ${name} }`)
    })
  }
})
