import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/stocks',
}))

import StocksLayout from '../layout'
import {
  STOCKS_LISTING_SYMBOLS,
  buildRebalanceStatusUrl,
} from '@/lib/stocksDefaultSymbols'

describe('StocksLayout preload hints', () => {
  it('emits preload <link> tags for the three independent first-paint endpoints', () => {
    const { container } = render(<StocksLayout>child</StocksLayout>)
    const preloadHrefs = Array.from(container.querySelectorAll('link[rel="preload"]')).map(
      (el) => el.getAttribute('href'),
    )

    // The rebalance-status preload now matches the runtime hook URL
    // (`?symbols=…`) so the browser can satisfy the actual fetch from
    // the preload cache instead of issuing a second round-trip.
    expect(preloadHrefs).toEqual(
      expect.arrayContaining([
        '/api/status/quotes',
        '/api/status',
        buildRebalanceStatusUrl(STOCKS_LISTING_SYMBOLS),
      ]),
    )
  })

  it('rebalance-status preload includes the queried ?symbols= form, not the bare URL', () => {
    const { container } = render(<StocksLayout>child</StocksLayout>)
    const preloadHrefs = Array.from(container.querySelectorAll('link[rel="preload"]')).map(
      (el) => el.getAttribute('href') ?? '',
    )
    const rebalanceHref = preloadHrefs.find((h) => h.includes('rebalance-status'))
    expect(rebalanceHref).toBeDefined()
    expect(rebalanceHref).toContain('?symbols=')
    // A future accidental revert to the bare URL would fail this assertion.
    expect(rebalanceHref).not.toBe('/api/stocks/rebalance-status')
  })

  it('uses as="fetch" with crossorigin on every preload hint', () => {
    const { container } = render(<StocksLayout>child</StocksLayout>)
    const preloads = container.querySelectorAll('link[rel="preload"]')

    expect(preloads.length).toBeGreaterThanOrEqual(3)
    for (const el of preloads) {
      expect(el.getAttribute('as')).toBe('fetch')
      expect(el.getAttribute('crossorigin')).toBe('anonymous')
    }
  })
})
