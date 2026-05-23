import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StalePriceBanner } from '@/components/StalePriceBanner'

// Task 0037 — the perps page needs the same oracle-offline banner the
// stocks pages use, scoped to the crypto rail. Adding a `crypto`
// variant keeps the existing component canonical (no duplicate banner
// components) and lets the perps page reuse the same styling and
// dismissal contract.
describe('StalePriceBanner', () => {
  it('renders the stocks oracle-offline copy for the stocks variant', () => {
    render(<StalePriceBanner variant="stocks" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Oracle offline: showing demo prices/i)).toBeInTheDocument()
  })

  it('renders the swap cached-rates copy for the swap variant', () => {
    render(<StalePriceBanner variant="swap" />)
    expect(screen.getByText(/Live prices unavailable/i)).toBeInTheDocument()
  })

  it('renders the crypto rail offline copy for the crypto variant', () => {
    render(<StalePriceBanner variant="crypto" />)
    expect(screen.getByText(/Crypto oracle offline/i)).toBeInTheDocument()
    expect(screen.getByText(/may not reflect current market values/i)).toBeInTheDocument()
  })
})
