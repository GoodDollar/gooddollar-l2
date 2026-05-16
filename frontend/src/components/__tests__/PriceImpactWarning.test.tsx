import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceImpactWarning } from '../PriceImpactWarning'

/**
 * Tier scale (kept in sync with `getPriceImpactSeverity` in useOnChainSwap):
 *
 *   normal   <  1%   → no banner
 *   notice   1 – 3%  → no banner (UI-only label elsewhere)
 *   warning  3 – 5%  → yellow banner
 *   high     5 – 15% → red banner
 *   extreme  ≥ 15%   → red banner with stronger copy
 *
 * The previous (looser) thresholds were 5%/10% — those got replaced as part
 * of task 0053 because sub-5% trades are routinely sandwiched on shallow
 * pools, so we now warn earlier and turn red sooner.
 */
describe('PriceImpactWarning', () => {
  it('does not render when price impact is in normal range (<1%)', () => {
    const { container } = render(<PriceImpactWarning priceImpact={0.5} />)
    expect(container.firstChild).toBeNull()
  })

  it('does not render in the notice band (1–3%) — only the inline UI label changes', () => {
    const { container } = render(<PriceImpactWarning priceImpact={2.5} />)
    expect(container.firstChild).toBeNull()
  })

  it('does not render when not visible', () => {
    const { container } = render(<PriceImpactWarning priceImpact={8} visible={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a yellow warning banner at the 3% threshold', () => {
    render(<PriceImpactWarning priceImpact={3} />)
    const el = screen.getByTestId('price-impact-warning')
    expect(el).toBeInTheDocument()
    expect(el.dataset.severity).toBe('warning')
    expect(el.className).toContain('yellow')
    expect(screen.getByText(/3\.00%/)).toBeInTheDocument()
  })

  it('uses yellow styling across the 3–5% warning band', () => {
    render(<PriceImpactWarning priceImpact={4.2} />)
    const el = screen.getByTestId('price-impact-warning')
    expect(el.dataset.severity).toBe('warning')
    expect(el.className).toContain('yellow')
  })

  it('uses red styling at 5% (high tier)', () => {
    render(<PriceImpactWarning priceImpact={5} />)
    const el = screen.getByTestId('price-impact-warning')
    expect(el.dataset.severity).toBe('high')
    expect(el.className).toContain('red')
  })

  it('keeps red styling through the high band (5–15%)', () => {
    render(<PriceImpactWarning priceImpact={9.5} />)
    const el = screen.getByTestId('price-impact-warning')
    expect(el.dataset.severity).toBe('high')
    expect(el.className).toContain('red')
  })

  it('flags 15%+ as "extreme" and surfaces sandwich-attack guidance', () => {
    render(<PriceImpactWarning priceImpact={20} />)
    const el = screen.getByTestId('price-impact-warning')
    expect(el.dataset.severity).toBe('extreme')
    expect(el.className).toContain('red')
    expect(screen.getByText(/extreme price impact/i)).toBeInTheDocument()
    expect(screen.getByText(/sandwich attacks/i)).toBeInTheDocument()
  })

  it('shows the formatted percentage and a contextual body for high impact', () => {
    render(<PriceImpactWarning priceImpact={8.5} />)
    expect(screen.getByText(/8\.50%/)).toBeInTheDocument()
    expect(screen.getByText(/significantly less/i)).toBeInTheDocument()
  })
})
