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
          targetLow: 190,
          targetMean: 230,
          targetHigh: 260,
          asOf: 'May 2026',
          analystCount: 41,
          ratingDistribution: { buy: 79, hold: 18, sell: 3 },
          revisionTrend: 'Up',
          source: 'Street consensus aggregate',
        }}
      />
    )

    expect(screen.getByText('Bullish')).toBeInTheDocument()
    expect(screen.getByText(/\+15\.0%/)).toBeInTheDocument()
    expect(screen.getByText(/\$230\.00/)).toBeInTheDocument()
    expect(screen.getByText('41')).toBeInTheDocument()
    expect(screen.getByText(/Buy 79% · Hold 18% · Sell 3%/)).toBeInTheDocument()
    expect(screen.getByText('90d trend: Up')).toBeInTheDocument()
    expect(screen.getByText(/Source: Street consensus aggregate/)).toBeInTheDocument()
  })
})
