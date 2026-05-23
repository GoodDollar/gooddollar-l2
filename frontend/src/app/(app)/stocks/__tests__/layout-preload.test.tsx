import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/stocks',
}))

import StocksLayout from '../layout'

describe('StocksLayout preload hints', () => {
  it('emits preload <link> tags for the three independent first-paint endpoints', () => {
    const { container } = render(<StocksLayout>child</StocksLayout>)
    const preloadHrefs = Array.from(container.querySelectorAll('link[rel="preload"]')).map(
      (el) => el.getAttribute('href'),
    )

    expect(preloadHrefs).toEqual(
      expect.arrayContaining([
        '/api/status/quotes',
        '/api/status',
        '/api/stocks/rebalance-status',
      ]),
    )
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
