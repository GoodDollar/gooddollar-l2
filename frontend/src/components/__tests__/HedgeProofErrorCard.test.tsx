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

  it('does not render an inline back-to-dashboard link in either variant (#0060 — breadcrumb is the single source)', () => {
    const { unmount } = render(
      <HedgeProofErrorCard
        title="x"
        detail="y"
        variant="error"
        onRetry={() => {}}
      />,
    )
    expect(screen.queryByRole('link', { name: /back to dashboard/i })).toBeNull()
    unmount()

    render(<HedgeProofErrorCard title="x" detail="y" onRetry={() => {}} />)
    expect(screen.queryByRole('link', { name: /back to dashboard/i })).toBeNull()
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

  it('omits the action-row wrapper entirely when no onRetry is provided (no orphan mt-4 whitespace) (#0060)', () => {
    render(
      <HedgeProofErrorCard
        title="Receipt id is not valid"
        detail="The id couldn't be decoded."
        variant="error"
      />,
    )
    const card = screen.getByTestId('hedge-proof-error')
    expect(card.querySelectorAll('.mt-4').length).toBe(0)
    expect(card.querySelector('button')).toBeNull()
    expect(card.querySelector('a')).toBeNull()
  })

  it('renders the action row with only the Retry button when onRetry is provided (#0060)', () => {
    render(
      <HedgeProofErrorCard
        title="Hedge engine unreachable"
        detail="Engine offline"
        variant="error"
        onRetry={() => {}}
      />,
    )
    expect(screen.getByTestId('hedge-proof-retry')).toBeInTheDocument()
    expect(screen.queryAllByRole('link', { name: /back to dashboard/i }).length).toBe(0)
  })

  describe('long-id title wrapping (#0063)', () => {
    it('h2 carries break-words / overflow-wrap rules so an unbreakable token wraps inside the card', () => {
      render(
        <HedgeProofErrorCard
          title={`Proof not found for receipt ${'a'.repeat(200)}`}
          detail="The hedge engine has no proof artifact for this receipt id."
          variant="error"
          onRetry={() => {}}
        />,
      )
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.className).toContain('break-words')
      expect(heading.className).toMatch(/overflow-wrap/)
    })

    it('surfaces the full id via title attribute when titleTooltip is provided', () => {
      const fullId = 'a'.repeat(200)
      render(
        <HedgeProofErrorCard
          title="Proof not found for receipt aaaaaaaaaaaa…aaaaaaaa"
          detail="..."
          variant="error"
          onRetry={() => {}}
          titleTooltip={fullId}
        />,
      )
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.getAttribute('title')).toBe(fullId)
    })

    it('omits the title attribute when titleTooltip is not provided (regression for short-id surfaces)', () => {
      render(
        <HedgeProofErrorCard
          title="No hedge proof yet"
          detail="..."
          onRetry={() => {}}
        />,
      )
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.getAttribute('title')).toBeNull()
    })
  })

  describe('primaryAction prop (#0072)', () => {
    it('renders a primaryAction link with the red-error palette in place of Retry', () => {
      render(
        <HedgeProofErrorCard
          title="Receipt id was rejected"
          detail="Receipt id is too long"
          variant="error"
          primaryAction={{
            label: 'Open receipts table',
            href: '/analytics#hedge-recent-receipts',
          }}
        />,
      )
      const link = screen.getByRole('link', { name: /open receipts table/i })
      expect(link.getAttribute('href')).toBe('/analytics#hedge-recent-receipts')
      for (const cls of RED_PALETTE) expect(link.className).toContain(cls)
      expect(screen.queryByTestId('hedge-proof-retry')).toBeNull()
    })

    it('renders both Retry and primaryAction when both props are provided', () => {
      render(
        <HedgeProofErrorCard
          title="Hedge engine unreachable"
          detail="Engine offline"
          variant="error"
          onRetry={() => {}}
          primaryAction={{
            label: 'Open receipts table',
            href: '/analytics#hedge-recent-receipts',
          }}
        />,
      )
      expect(
        screen.getByRole('link', { name: /open receipts table/i }),
      ).toBeInTheDocument()
      expect(screen.getByTestId('hedge-proof-retry')).toBeInTheDocument()
    })

    it('omits the action-row wrapper when neither prop is provided', () => {
      render(
        <HedgeProofErrorCard
          title="x"
          detail="y"
          variant="error"
        />,
      )
      const card = screen.getByTestId('hedge-proof-error')
      expect(card.querySelectorAll('.mt-4').length).toBe(0)
      expect(card.querySelector('button')).toBeNull()
      expect(card.querySelector('a')).toBeNull()
    })

    it('uses the neutral palette on the primaryAction link when variant="neutral"', () => {
      render(
        <HedgeProofErrorCard
          title="x"
          detail="y"
          primaryAction={{
            label: 'Open receipts table',
            href: '/analytics#hedge-recent-receipts',
          }}
        />,
      )
      const link = screen.getByRole('link', { name: /open receipts table/i })
      for (const cls of NEUTRAL_PALETTE) expect(link.className).toContain(cls)
      expect(link.className).not.toContain('border-red-500/40')
    })
  })

  describe('secondaryAction prop (#0082)', () => {
    it('renders both primaryAction and secondaryAction side by side when both are set', () => {
      render(
        <HedgeProofErrorCard
          title="No receipt id specified"
          detail="Pick one."
          primaryAction={{
            label: 'View latest proof',
            href: '/analytics/hedge/proof/latest',
          }}
          secondaryAction={{
            label: 'Open receipts table',
            href: '/analytics#hedge-recent-receipts',
          }}
        />,
      )
      const primary = screen.getByTestId('hedge-proof-primary-action')
      const secondary = screen.getByTestId('hedge-proof-secondary-action')
      expect(primary.getAttribute('href')).toBe('/analytics/hedge/proof/latest')
      expect(secondary.getAttribute('href')).toBe(
        '/analytics#hedge-recent-receipts',
      )
      expect(primary.textContent).toBe('View latest proof')
      expect(secondary.textContent).toBe('Open receipts table')
    })

    it('renders secondaryAction alone (no primary, no Retry)', () => {
      render(
        <HedgeProofErrorCard
          title="x"
          detail="y"
          secondaryAction={{
            label: 'Open receipts table',
            href: '/analytics#hedge-recent-receipts',
          }}
        />,
      )
      const secondary = screen.getByTestId('hedge-proof-secondary-action')
      expect(secondary).toBeInTheDocument()
      expect(screen.queryByTestId('hedge-proof-primary-action')).toBeNull()
      expect(screen.queryByTestId('hedge-proof-retry')).toBeNull()
    })

    it('omits the action row entirely when secondaryAction is the only opt-in and is absent', () => {
      render(<HedgeProofErrorCard title="x" detail="y" />)
      const card = screen.getByTestId('hedge-proof-error')
      expect(card.querySelectorAll('.mt-4').length).toBe(0)
      expect(card.querySelector('a')).toBeNull()
      expect(card.querySelector('button')).toBeNull()
    })

    it('uses the same palette as primaryAction (Retry styling for visual parity)', () => {
      render(
        <HedgeProofErrorCard
          title="x"
          detail="y"
          variant="error"
          secondaryAction={{
            label: 'Open receipts table',
            href: '/analytics#hedge-recent-receipts',
          }}
        />,
      )
      const secondary = screen.getByTestId('hedge-proof-secondary-action')
      for (const cls of RED_PALETTE) expect(secondary.className).toContain(cls)
    })
  })

  describe('autoRetryNote prop (#0080)', () => {
    it('renders the sub-line beneath detail when autoRetryNote is provided', () => {
      render(
        <HedgeProofErrorCard
          title="Hedge engine unreachable"
          detail="Could not fetch the latest proof pointer from the hedge engine."
          variant="error"
          onRetry={() => {}}
          autoRetryNote="Auto-retrying every 10s."
        />,
      )
      const note = screen.getByTestId('hedge-proof-error-auto-retry')
      expect(note.textContent).toBe('Auto-retrying every 10s.')
      expect(note.className).toMatch(/text-xs/)
    })

    it('omits the sub-line when autoRetryNote is not provided', () => {
      render(
        <HedgeProofErrorCard
          title="Receipt id was rejected"
          detail="Receipt id is too long"
          variant="error"
        />,
      )
      expect(screen.queryByTestId('hedge-proof-error-auto-retry')).toBeNull()
    })
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
