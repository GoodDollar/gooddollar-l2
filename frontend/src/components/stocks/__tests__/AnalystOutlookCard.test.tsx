import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalystOutlookCard } from '@/components/stocks/AnalystOutlookCard'

// Task 0036 — the Analyst Outlook card previously rendered a hardcoded
// "Street consensus aggregate" mock (8 tickers × consensus + target +
// rating distribution) without any demo badge, next to a synthetic
// stock price. Until a real analyst-consensus feed is wired up the card
// renders an honest empty state — same pattern task 0034 applied to
// the News & Events panel sitting underneath.

describe('AnalystOutlookCard', () => {
  it('renders the loading skeleton', () => {
    render(<AnalystOutlookCard isLoading />)
    expect(screen.getByLabelText(/analyst outlook loading/i)).toBeInTheDocument()
  })

  it('renders the honest empty state when not loading', () => {
    render(<AnalystOutlookCard isLoading={false} />)
    expect(screen.getByText(/Analyst consensus is not available yet/i)).toBeInTheDocument()
    expect(screen.getByText(/none of this is fabricated/i)).toBeInTheDocument()
  })

  it('renders no fabricated metrics (no consensus pill, target, upside %, ratings)', () => {
    const { container } = render(<AnalystOutlookCard isLoading={false} />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Bullish|Neutral|Bearish/)
    expect(text).not.toMatch(/Target Mean/i)
    expect(text).not.toMatch(/Buy \d+%/)
    expect(text).not.toMatch(/90d trend/i)
    expect(text).not.toMatch(/Street consensus aggregate/)
    expect(text).not.toMatch(/\$\d/)
  })
})
