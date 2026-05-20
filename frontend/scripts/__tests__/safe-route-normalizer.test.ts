import { describe, expect, it } from 'vitest'

import { normalizeMalformedStocksPath } from '../safe-route-normalizer.mjs'

describe('normalizeMalformedStocksPath', () => {
  it('keeps valid stocks routes unchanged', () => {
    expect(normalizeMalformedStocksPath('/stocks/AAPL')).toBe('/stocks/AAPL')
    expect(normalizeMalformedStocksPath('/stocks/%2541APL')).toBe('/stocks/%2541APL')
  })

  it('rewrites malformed percent encodings under /stocks to fallback ticker', () => {
    expect(normalizeMalformedStocksPath('/stocks/%2')).toBe('/stocks/UNKNOWN')
    expect(normalizeMalformedStocksPath('/stocks/%E0%A4%A')).toBe('/stocks/UNKNOWN')
  })

  it('rewrites recursively malformed double-encoded paths under /stocks', () => {
    expect(normalizeMalformedStocksPath('/stocks/%25E0%A4%A')).toBe('/stocks/UNKNOWN')
    expect(normalizeMalformedStocksPath('/stocks/%2525E0%A4%A')).toBe('/stocks/UNKNOWN')
  })

  it('preserves query string while rewriting malformed /stocks paths', () => {
    expect(normalizeMalformedStocksPath('/stocks/%2?ref=qa&mode=debug')).toBe('/stocks/UNKNOWN?ref=qa&mode=debug')
  })

  it('does not rewrite malformed paths outside /stocks', () => {
    expect(normalizeMalformedStocksPath('/predict/%2')).toBe('/predict/%2')
  })
})
