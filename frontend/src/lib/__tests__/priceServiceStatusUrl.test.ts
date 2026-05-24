import { describe, expect, it } from 'vitest'

import { resolvePriceServiceStatusUrl } from '../priceServiceStatusUrl'

describe('resolvePriceServiceStatusUrl', () => {
  it('appends /status/quotes when given a price-service base URL', () => {
    expect(resolvePriceServiceStatusUrl('http://127.0.0.1:49300')).toBe('http://127.0.0.1:49300/status/quotes')
  })

  it('preserves a full /status/quotes endpoint without duplicating the path', () => {
    expect(resolvePriceServiceStatusUrl('http://127.0.0.1:49300/status/quotes')).toBe('http://127.0.0.1:49300/status/quotes')
  })

  it('normalizes trailing slashes before checking for the status path', () => {
    expect(resolvePriceServiceStatusUrl('http://127.0.0.1:49300/status/quotes/')).toBe('http://127.0.0.1:49300/status/quotes')
  })
})
