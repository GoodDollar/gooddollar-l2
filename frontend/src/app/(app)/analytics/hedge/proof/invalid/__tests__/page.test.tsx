import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HedgeProofInvalidIdPage from '../page'

describe('HedgeProofInvalidIdPage', () => {
  it('renders the branded error card with the malformed-id copy', () => {
    render(<HedgeProofInvalidIdPage />)
    const card = screen.getByTestId('hedge-proof-invalid-id')
    expect(card).toBeInTheDocument()
    expect(card.textContent).toMatch(/Receipt id is not valid/)
    expect(card.textContent).toMatch(/couldn't be decoded/)
  })

  it('renders the same back-to-dashboard link the viewer surfaces use', () => {
    render(<HedgeProofInvalidIdPage />)
    const back = screen.getByTestId('hedge-proof-back-link')
    expect(back.getAttribute('href')).toBe('/analytics')
  })

  it('does NOT render the default Next.js "400 / Bad Request" headings', () => {
    render(<HedgeProofInvalidIdPage />)
    const headings = Array.from(document.querySelectorAll('h1, h2'))
    const text = headings.map((h) => h.textContent?.trim() ?? '').join('|')
    expect(text).not.toMatch(/^400$|^400\|/)
    expect(text).not.toMatch(/Bad Request\./)
  })

  it('omits Retry — there is no inflight request to retry', () => {
    render(<HedgeProofInvalidIdPage />)
    expect(screen.queryByTestId('hedge-proof-retry')).toBeNull()
  })
})
