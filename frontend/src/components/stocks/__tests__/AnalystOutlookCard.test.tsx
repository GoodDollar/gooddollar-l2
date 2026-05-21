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
        }}
      />
    )

    expect(screen.getByText('Bullish')).toBeInTheDocument()
    expect(screen.getByText(/\+15\.0%/)).toBeInTheDocument()
    expect(screen.getByText(/\$230\.00/)).toBeInTheDocument()
  })
})
