import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StockResearchHub } from '@/components/stocks/StockResearchHub'

describe('StockResearchHub', () => {
  it('renders tabs and switches content panels', async () => {
    const user = userEvent.setup()
    render(
      <StockResearchHub
        ticker="AAPL"
        companyName="Apple"
        sector="Technology"
        summary="Consumer devices and software ecosystem."
      />,
    )

    expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'How to Buy' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Guides' })).toBeInTheDocument()

    expect(screen.getByText(/Consumer devices and software ecosystem\./i)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'How to Buy' }))
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Guides' }))
    expect(screen.getByText(/Trading checklist/i)).toBeInTheDocument()
  })

  it('falls back gracefully when summary is unavailable', () => {
    render(
      <StockResearchHub
        ticker="XYZ"
        companyName="Example Corp"
        sector="Other"
        summary=""
      />,
    )

    expect(screen.getByText(/Research context for XYZ is loading/i)).toBeInTheDocument()
  })
})
