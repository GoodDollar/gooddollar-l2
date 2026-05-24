import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HedgeProofNoIdPage from '../page'

/**
 * Task 0082 — "no receipt id specified" recovery page for
 * `/analytics/hedge/proof/{,.,..,bare}` so Next.js's URL normalizer
 * does not strand the user on the site-wide 404 ("Back to Swap").
 *
 * The page is a server component; we exercise it directly since the
 * route resolution is Next.js's job, not ours. Browsers landing on
 * any URL Next collapses to `/analytics/hedge/proof` will render
 * this exact JSX (verified live in the autobuilder lane).
 */

describe('HedgeProofNoIdPage (#0082)', () => {
  it('renders the hedge-proof heading, not the site-wide 404', () => {
    render(<HedgeProofNoIdPage />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toBe('Hedge proof')
    expect(h1.textContent).not.toBe('404')
  })

  it('renders the "Back to dashboard" breadcrumb pointing at /analytics', () => {
    render(<HedgeProofNoIdPage />)
    const back = screen.getByTestId('hedge-proof-back-link')
    expect(back.getAttribute('href')).toBe('/analytics')
    expect(back.textContent).toMatch(/Back to dashboard/i)
  })

  it('renders the styled error card with "No receipt id specified" title and explanatory detail', () => {
    render(<HedgeProofNoIdPage />)
    const card = screen.getByTestId('hedge-proof-no-id')
    expect(card).toBeInTheDocument()
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toBe('No receipt id specified')
    expect(card.textContent).toMatch(/receipt id/i)
  })

  it('renders the primary "View latest proof" action linking to /analytics/hedge/proof/latest', () => {
    render(<HedgeProofNoIdPage />)
    const primary = screen.getByTestId('hedge-proof-primary-action')
    expect(primary.getAttribute('href')).toBe('/analytics/hedge/proof/latest')
    expect(primary.textContent).toBe('View latest proof')
  })

  it('renders the secondary "Open receipts table" action linking to the receipts anchor', () => {
    render(<HedgeProofNoIdPage />)
    const secondary = screen.getByTestId('hedge-proof-secondary-action')
    expect(secondary.getAttribute('href')).toBe(
      '/analytics#hedge-recent-receipts',
    )
    expect(secondary.textContent).toBe('Open receipts table')
  })

  it('does NOT render the site-wide 404 "Back to Swap" CTA', () => {
    render(<HedgeProofNoIdPage />)
    expect(
      screen.queryByRole('link', { name: /back to swap/i }),
    ).toBeNull()
  })

  it('does NOT render a Retry button (there is no in-flight request to retry)', () => {
    render(<HedgeProofNoIdPage />)
    expect(screen.queryByTestId('hedge-proof-retry')).toBeNull()
  })

  it('renders the endpoint + hint recap so the user learns the URL shape', () => {
    render(<HedgeProofNoIdPage />)
    const recap = screen.getByTestId('hedge-proof-no-id-recap')
    expect(recap.textContent).toMatch(
      /Endpoint: \/analytics\/hedge\/proof\/<receiptId>/,
    )
    expect(recap.textContent).toMatch(/Hint:.*\/analytics\/hedge\/proof\/latest/)
  })
})
