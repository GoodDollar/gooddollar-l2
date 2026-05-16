import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PercentageChange } from '../ui/percentage-change'

// Task 0073 — the component must gracefully degrade when upstream market data
// is unavailable. Previously it rendered a misleading "0.00%" for null inputs,
// which made users think there was zero change rather than no data.
describe('PercentageChange — null-aware rendering', () => {
  it('renders an em dash placeholder for null values', () => {
    render(<PercentageChange value={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders an em dash placeholder for undefined values', () => {
    render(<PercentageChange value={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('uses a neutral / muted style for unavailable values (no green/red)', () => {
    render(<PercentageChange value={null} />)
    const span = screen.getByText('—')
    // Class string should not include the positive / negative color hooks.
    expect(span.className).not.toMatch(/text-green/)
    expect(span.className).not.toMatch(/text-red/)
  })

  it('exposes a tooltip / aria-label so the placeholder is self-explanatory', () => {
    render(<PercentageChange value={null} unavailableLabel="24h change unavailable" />)
    const span = screen.getByText('—')
    expect(span.getAttribute('title')).toBe('24h change unavailable')
    expect(span.getAttribute('aria-label')).toBe('24h change unavailable')
  })

  it('uses a sensible default tooltip when none is supplied', () => {
    render(<PercentageChange value={undefined} />)
    const span = screen.getByText('—')
    expect(span.getAttribute('title')).toBe('Data unavailable')
  })

  it('still renders real positive values normally', () => {
    render(<PercentageChange value={1.234} />)
    expect(screen.getByText(/1\.23%/)).toBeInTheDocument()
  })

  it('still renders real negative values normally', () => {
    render(<PercentageChange value={-2.5} />)
    expect(screen.getByText(/2\.50%/)).toBeInTheDocument()
  })

  it('treats 0 as a real value, not as missing data', () => {
    // Zero is a legitimate measurement ("the price literally did not change"),
    // distinct from "we don't know" which is null/undefined.
    render(<PercentageChange value={0} />)
    expect(screen.queryByText('—')).not.toBeInTheDocument()
    expect(screen.getByText(/0\.00%/)).toBeInTheDocument()
  })
})
