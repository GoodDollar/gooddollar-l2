import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const TICKER_PAGE = 'src/app/(app)/stocks/[ticker]/page.tsx'

describe('stocks [ticker] page guards reserved subroutes', () => {
  const abs = resolve(__dirname, '..', '..', TICKER_PAGE)
  const src = readFileSync(abs, 'utf8')

  it('defines RESERVED_STOCK_SUBROUTES containing "markets"', () => {
    expect(src).toMatch(/RESERVED_STOCK_SUBROUTES/)
    expect(src).toMatch(/['"]markets['"]/)
  })

  it('defines RESERVED_STOCK_SUBROUTES containing "portfolio"', () => {
    expect(src).toMatch(/['"]portfolio['"]/)
  })

  it('checks isReservedSubroute before rendering stock-not-found', () => {
    const reservedCheckIdx = src.indexOf('isReservedSubroute')
    const stockNotFoundIdx = src.indexOf('Stock Not Found')
    expect(reservedCheckIdx).toBeGreaterThan(-1)
    expect(stockNotFoundIdx).toBeGreaterThan(-1)
    expect(reservedCheckIdx).toBeLessThan(stockNotFoundIdx)
  })

  it('redirects to /stocks when subroute is reserved', () => {
    expect(src).toMatch(/router\.replace\(['"]\/stocks['"]\)/)
  })
})
