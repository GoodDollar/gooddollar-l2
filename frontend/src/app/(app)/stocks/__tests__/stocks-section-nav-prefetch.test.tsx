import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const sectionNavSpy = vi.fn()

vi.mock('@/components/SectionNav', () => ({
  SectionNav: (props: unknown) => {
    sectionNavSpy(props)
    return null
  },
}))

describe('StocksSectionNav prefetch behavior', () => {
  it('disables eager tab prefetch on initial stocks load', async () => {
    const { StocksSectionNav } = await import('../StocksSectionNav')

    render(<StocksSectionNav />)

    expect(sectionNavSpy).toHaveBeenCalledTimes(1)
    const tabs = sectionNavSpy.mock.calls[0][0].tabs as Array<{ href: string; prefetch?: boolean }>

    expect(tabs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/stocks', prefetch: false }),
        expect.objectContaining({ href: '/stocks/portfolio', prefetch: false }),
      ]),
    )
  })
})
