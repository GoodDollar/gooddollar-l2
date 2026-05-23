import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalystOutlookCard } from '@/components/stocks/AnalystOutlookCard'
import type { AnalystOutlook } from '@/lib/stockInsights'

const FORBIDDEN_FABRICATIONS = /Street consensus aggregate|37 analysts|Buy 73%|Hold 24%|Sell 3%|as of May 2026/

describe('AnalystOutlookCard', () => {
  it('renders a loading skeleton state', () => {
    render(<AnalystOutlookCard currentPrice={200} outlook={null} isLoading />)
    expect(screen.getByLabelText(/analyst outlook loading/i)).toBeInTheDocument()
  })

  describe('task 0029 — no fabricated consensus', () => {
    it('renders the feed-pending empty state when outlook is null', () => {
      const { container } = render(
        <AnalystOutlookCard currentPrice={200} outlook={null} isLoading={false} />,
      )
      expect(screen.getByTestId('analyst-outlook-source-pending')).toBeInTheDocument()
      expect(
        screen.getByText(/No analyst consensus feed configured yet/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Source: feed pending/i)).toBeInTheDocument()
      expect(container.textContent ?? '').not.toMatch(FORBIDDEN_FABRICATIONS)
    })

    it('falls through to the empty state when outlook.source is not "street"', () => {
      const sample: AnalystOutlook = {
        consensus: 'Bullish',
        targetLow: 100, targetMean: 120, targetHigh: 140,
        asOf: '2026-05-19T00:00:00Z',
        analystCount: 12,
        ratingDistribution: { buy: 70, hold: 20, sell: 10 },
        revisionTrend: 'Up',
        source: 'sample',
      }
      const { container } = render(
        <AnalystOutlookCard currentPrice={100} outlook={sample} isLoading={false} />,
      )
      expect(screen.getByTestId('analyst-outlook-source-pending')).toBeInTheDocument()
      expect(container.textContent ?? '').not.toMatch(FORBIDDEN_FABRICATIONS)
      expect(container.textContent ?? '').not.toMatch(/12 analysts/i)
    })

    it('renders the full consensus layout when outlook.source === "street"', () => {
      const street: AnalystOutlook = {
        consensus: 'Bullish',
        targetLow: 190, targetMean: 230, targetHigh: 260,
        asOf: '2026-05-19T00:00:00Z',
        analystCount: 12,
        ratingDistribution: { buy: 70, hold: 20, sell: 10 },
        revisionTrend: 'Up',
        source: 'street',
        updatedAtMs: Date.now() - 7_000,
      }
      const { container } = render(
        <AnalystOutlookCard currentPrice={200} outlook={street} isLoading={false} />,
      )
      expect(screen.getByText('Bullish')).toBeInTheDocument()
      expect(screen.getByText(/\$230\.00/)).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText(/Buy 70% · Hold 20% · Sell 10%/)).toBeInTheDocument()
      expect(screen.getByText(/Source: Street consensus/i)).toBeInTheDocument()
      // The hardcoded "May 2026" is gone — the rendered asOf must be derived
      // from the real payload (a formatted 2026-05-19 date).
      expect(container.textContent ?? '').toMatch(/May 19, 2026/)
      expect(container.textContent ?? '').not.toMatch(/as of May 2026[^,]/)
    })
  })
})
