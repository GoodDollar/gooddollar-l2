// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { normalizeMalformedStocksPath } from '../safe-route-normalizer.mjs'

describe('normalizeMalformedStocksPath', () => {
  it('rewrites malformed stocks percent path to fallback ticker', () => {
    expect(normalizeMalformedStocksPath('/stocks/%')).toBe('/stocks/UNKNOWN')
    expect(normalizeMalformedStocksPath('/stocks/%2')).toBe('/stocks/UNKNOWN')
    expect(normalizeMalformedStocksPath('/stocks/%E0%A4%A')).toBe('/stocks/UNKNOWN')
  })

  it('preserves query string when rewriting malformed stocks paths', () => {
    expect(normalizeMalformedStocksPath('/stocks/%E0%A4%A?source=test')).toBe(
      '/stocks/UNKNOWN?source=test',
    )
  })

  it('does not rewrite valid encoded stocks paths', () => {
    expect(normalizeMalformedStocksPath('/stocks/%2520')).toBe('/stocks/%2520')
    expect(normalizeMalformedStocksPath('/stocks/AAPL')).toBe('/stocks/AAPL')
  })

  it('does not rewrite malformed percent paths outside stocks route', () => {
    expect(normalizeMalformedStocksPath('/predict/%')).toBe('/predict/%')
  })
})
