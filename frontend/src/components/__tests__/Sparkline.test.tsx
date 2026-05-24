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

describe('Sparkline — cap line (task 0044)', () => {
  it('renders a dashed cap line when capLine is provided', () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} capLine={5} testId="cap-test" />,
    )
    const cap = container.querySelector('[data-testid="cap-test-cap"]')
    expect(cap).not.toBeNull()
    expect(cap!.getAttribute('stroke-dasharray')).toBe('2 3')
  })

  it('omits the cap line when capLine is undefined', () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} testId="cap-test" />,
    )
    expect(container.querySelector('[data-testid="cap-test-cap"]')).toBeNull()
  })

  it('swaps polyline stroke to red when crossedCap is true', () => {
    const { container } = render(
      <Sparkline data={[1, 2, 6]} capLine={5} crossedCap testId="cap-test" />,
    )
    const polyline = container.querySelector('polyline')
    expect(polyline).not.toBeNull()
    expect(polyline!.getAttribute('stroke')).toBe('#f87171')
  })

  it('uses green when crossedCap is false even with capLine present', () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} capLine={5} testId="cap-test" />,
    )
    expect(container.querySelector('polyline')!.getAttribute('stroke')).toBe(
      '#4ade80',
    )
  })
})
