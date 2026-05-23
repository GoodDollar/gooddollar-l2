import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FundingRateChart } from '@/components/FundingRateChart'

describe('FundingRateChart', () => {
  it('renders the empty-state card when there is no on-chain funding history', () => {
    const { container } = render(<FundingRateChart symbol="BTC-USD" />)
    expect(screen.getByTestId('funding-rate-chart-empty')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
    expect(screen.getByText(/on-chain funding events are indexed/i)).toBeInTheDocument()
  })

  it('keeps the range buttons clickable in the empty state', () => {
    render(<FundingRateChart symbol="BTC-USD" />)
    for (const label of ['24H', '7D', '30D']) {
      const button = screen.getByRole('button', { name: label })
      expect(button).toBeEnabled()
    }
  })

  it('does not render avg/annualized stats from NaN when data is empty', () => {
    render(<FundingRateChart symbol="BTC-USD" />)
    expect(screen.queryByText(/NaN/)).toBeNull()
    expect(screen.queryByText(/Avg:/)).toBeNull()
  })
})
