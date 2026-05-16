import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from '../Sparkline'

// Task 0073 — sparkline must render a non-misleading placeholder when no
// price history is available, rather than a flat zero line (which looks like
// "price was constant") or nothing at all (which causes layout shifts).
describe('Sparkline — null-aware rendering', () => {
  it('renders a dashed baseline placeholder when data is null', () => {
    const { container } = render(<Sparkline data={null} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    // The placeholder is a single dashed <line>, not a <polyline> of points.
    expect(svg!.querySelector('polyline')).toBeNull()
    const line = svg!.querySelector('line')
    expect(line).not.toBeNull()
    expect(line!.getAttribute('stroke-dasharray')).toBeTruthy()
  })

  it('renders a dashed baseline placeholder when data is undefined', () => {
    const { container } = render(<Sparkline data={undefined} />)
    expect(container.querySelector('line')).not.toBeNull()
    expect(container.querySelector('polyline')).toBeNull()
  })

  it('renders a dashed baseline placeholder when data is empty', () => {
    const { container } = render(<Sparkline data={[]} />)
    expect(container.querySelector('line')).not.toBeNull()
    expect(container.querySelector('polyline')).toBeNull()
  })

  it('exposes the unavailable label as an accessible name', () => {
    const { container } = render(
      <Sparkline data={null} unavailableLabel="Price history unavailable" />
    )
    const svg = container.querySelector('svg')
    expect(svg!.getAttribute('aria-label')).toBe('Price history unavailable')
    expect(svg!.getAttribute('role')).toBe('img')
    const title = svg!.querySelector('title')
    expect(title?.textContent).toBe('Price history unavailable')
  })

  it('renders a real polyline when data is provided', () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).not.toBeNull()
    expect(polyline!.getAttribute('points')).toBeTruthy()
    // No placeholder line when real data is present.
    expect(container.querySelector('line')).toBeNull()
  })
})
