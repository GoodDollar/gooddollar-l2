import { describe, expect, it } from 'vitest'

import { resolvePriceStatusEndpoint } from '../usePriceServiceStatus'

describe('resolvePriceStatusEndpoint', () => {
  it('defaults to same-origin api route when no base URL is provided', () => {
    expect(resolvePriceStatusEndpoint('')).toBe('/api/status/quotes')
  })

  it('normalizes base URL and appends /status/quotes', () => {
    expect(resolvePriceStatusEndpoint('https://prices.gooddollar.dev/')).toBe(
      'https://prices.gooddollar.dev/status/quotes',
    )
  })
})
