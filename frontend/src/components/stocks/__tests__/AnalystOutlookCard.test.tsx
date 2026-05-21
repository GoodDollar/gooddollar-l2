import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalystOutlookCard } from '@/components/stocks/AnalystOutlookCard'

describe('AnalystOutlookCard', () => {
  it('renders a loading skeleton state', () => {
    render(<AnalystOutlookCard currentPrice={200} outlook={null} isLoading />)
    expect(screen.getByLabelText(/analyst outlook loading/i)).toBeInTheDocument()
  })

  it('renders unavailable state when data is missing', () => {
    render(<AnalystOutlookCard currentPrice={200} outlook={null} isLoading={false} />)
    expect(screen.getByText(/Analyst target data is unavailable/i)).toBeInTheDocument()
  })

  it('renders consensus and upside when data exists', () => {
    render(
      <AnalystOutlookCard
        currentPrice={200}
        isLoading={false}
        outlook={{
          consensus: 'Bullish',
          ratings: { strongBuy: 12, buy: 8, hold: 5, sell: 1, strongSell: 0 },
          analystCount: 26,
          targetLow: 190,
          targetMean: 230,
          targetHigh: 260,
          asOf: 'May 2026',
          confidence: 'High',
          source: 'Street Consensus',
          refreshedAt: '2026-05-20T12:00:00Z',
        }}
      />
    )

    expect(screen.getByText('Bullish')).toBeInTheDocument()
    expect(screen.getByText(/\+15\.0%/)).toBeInTheDocument()
    expect(screen.getByText(/\$230\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\+\$30\.00 vs live/i)).toBeInTheDocument()
    expect(screen.getByText(/Confidence:/i)).toBeInTheDocument()
    expect(screen.getByText(/^High$/i)).toBeInTheDocument()
    expect(screen.getByText(/Source:/i)).toBeInTheDocument()
    expect(screen.getByText(/Street Consensus/i)).toBeInTheDocument()
  })

  it('renders the 5-tier rating distribution with analyst count and per-bucket legend', () => {
    render(
      <AnalystOutlookCard
        currentPrice={200}
        isLoading={false}
        outlook={{
          consensus: 'Bullish',
          ratings: { strongBuy: 12, buy: 8, hold: 5, sell: 1, strongSell: 0 },
          analystCount: 26,
          targetLow: 190,
          targetMean: 230,
          targetHigh: 260,
          asOf: 'May 2026',
          confidence: 'High',
          source: 'Street Consensus',
          refreshedAt: '2026-05-20T12:00:00Z',
        }}
      />
    )

    // distribution bar is announced for assistive tech
    expect(screen.getByLabelText(/analyst ratings distribution/i)).toBeInTheDocument()

    // analyst count line
    expect(screen.getByText(/Based on 26 analysts/i)).toBeInTheDocument()

    // each bucket label + count is rendered
    expect(screen.getByText(/Strong Buy/i)).toBeInTheDocument()
    expect(screen.getByText(/^Buy$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Hold$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Sell$/i)).toBeInTheDocument()
    expect(screen.getByText(/Strong Sell/i)).toBeInTheDocument()

    // and at least the non-zero counts are visible
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    // there are two "0"s (no strongSell shown as 0 in legend) — assert at least one
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
  })
})
