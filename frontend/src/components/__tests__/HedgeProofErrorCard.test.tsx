import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HedgeProofErrorCard from '../HedgeProofErrorCard'

const RED_PALETTE = [
  'border-red-500/40',
  'text-red-200',
  'hover:bg-red-500/10',
  'disabled:opacity-50',
]

const NEUTRAL_PALETTE = [
  'border-dark-50',
  'text-gray-200',
  'hover:bg-dark-50',
  'disabled:opacity-50',
]

describe('HedgeProofErrorCard', () => {
  it('renders the variant="error" Retry button with the red dashboard palette (#0055)', () => {
    render(
      <HedgeProofErrorCard
        title="Hedge engine unreachable"
        detail="Engine is offline"
        variant="error"
        onRetry={() => {}}
      />,
    )
    const retry = screen.getByTestId('hedge-proof-retry')
    for (const cls of RED_PALETTE) expect(retry.className).toContain(cls)
    expect(retry.className).not.toContain('border-dark-50')
    expect(retry.className).not.toContain('text-gray-200')
  })

  it('renders the variant="neutral" Retry button with the neutral grey palette (#0055)', () => {
    render(
      <HedgeProofErrorCard
        title="No hedge proof yet"
        detail="No proof has been written"
        onRetry={() => {}}
      />,
    )
    const retry = screen.getByTestId('hedge-proof-retry')
    for (const cls of NEUTRAL_PALETTE) expect(retry.className).toContain(cls)
    expect(retry.className).not.toContain('border-red-500/40')
    expect(retry.className).not.toContain('text-red-200')
  })

  it('keeps the back-to-dashboard link styled as a quiet text link in both variants (#0055)', () => {
    const { unmount } = render(
      <HedgeProofErrorCard
        title="x"
        detail="y"
        variant="error"
        onRetry={() => {}}
      />,
    )
    const errorBack = screen.getByRole('link', { name: /back to dashboard/i })
    expect(errorBack.className).toContain('text-gray-400')
    expect(errorBack.className).toContain('hover:text-white')
    unmount()

    render(<HedgeProofErrorCard title="x" detail="y" onRetry={() => {}} />)
    const neutralBack = screen.getByRole('link', { name: /back to dashboard/i })
    expect(neutralBack.className).toContain('text-gray-400')
    expect(neutralBack.className).toContain('hover:text-white')
  })

  it('omits the Retry button when no onRetry is provided (regression for /invalid)', () => {
    render(
      <HedgeProofErrorCard
        title="Receipt id is not valid"
        detail="The id couldn't be decoded."
        variant="error"
      />,
    )
    expect(screen.queryByTestId('hedge-proof-retry')).toBeNull()
  })

  describe('status icon anchor (#0057)', () => {
    it('variant="error" renders a red exclamation glyph at the top-left', () => {
      render(
        <HedgeProofErrorCard
          title="Hedge engine unreachable"
          detail="Engine offline"
          variant="error"
          onRetry={() => {}}
        />,
      )
      const icon = screen.getByTestId('hedge-proof-error-icon')
      expect(icon).toBeInTheDocument()
      expect(icon.className).toContain('text-red-400')
      const svg = icon.querySelector('svg')
      expect(svg).not.toBeNull()
      expect(svg!.getAttribute('aria-hidden')).toBe('true')
    })

    it('variant="neutral" renders a gray information glyph at the top-left', () => {
      render(
        <HedgeProofErrorCard
          title="No hedge proof yet"
          detail="No proof has been written."
          onRetry={() => {}}
        />,
      )
      const icon = screen.getByTestId('hedge-proof-error-icon')
      expect(icon).toBeInTheDocument()
      expect(icon.className).toContain('text-gray-400')
      const svg = icon.querySelector('svg')
      expect(svg).not.toBeNull()
      expect(svg!.getAttribute('aria-hidden')).toBe('true')
    })

    it('icon renders even when no Retry button is shown (malformed-id surface)', () => {
      render(
        <HedgeProofErrorCard
          title="Receipt id is not valid"
          detail="The id couldn't be decoded."
          variant="error"
        />,
      )
      expect(screen.getByTestId('hedge-proof-error-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('hedge-proof-retry')).toBeNull()
    })
  })
})
