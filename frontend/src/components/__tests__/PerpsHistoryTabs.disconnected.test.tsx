import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PerpsHistoryTabs } from '../PerpsHistoryTabs'

describe('PerpsHistoryTabs — empty default state (task 0007d-0017)', () => {
  it('renders the four-tab strip with no order count badge', () => {
    render(<PerpsHistoryTabs />)
    expect(screen.getByRole('button', { name: 'Open Orders' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Order History' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trade History' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Funding History' })).toBeInTheDocument()
  })

  it('Open Orders tab renders the empty-state copy and no Cancel button', () => {
    render(<PerpsHistoryTabs />)
    fireEvent.click(screen.getByRole('button', { name: 'Open Orders' }))
    expect(screen.getByText('No open orders')).toBeInTheDocument()
    // The previously-silent Cancel <button> is gone entirely.
    expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument()
  })

  it('Order History tab renders the empty-state copy', () => {
    render(<PerpsHistoryTabs />)
    fireEvent.click(screen.getByRole('button', { name: 'Order History' }))
    expect(screen.getByText('No order history')).toBeInTheDocument()
  })

  it('Trade History tab renders the empty-state copy', () => {
    render(<PerpsHistoryTabs />)
    fireEvent.click(screen.getByRole('button', { name: 'Trade History' }))
    expect(screen.getByText('No trade history')).toBeInTheDocument()
  })

  it('Funding History tab renders the empty-state copy', () => {
    render(<PerpsHistoryTabs />)
    fireEvent.click(screen.getByRole('button', { name: 'Funding History' }))
    expect(screen.getByText('No funding payments')).toBeInTheDocument()
  })

  it('does not render any seeded BTC-USD / ETH-USD / SOL-USD rows in any tab', () => {
    const { container } = render(<PerpsHistoryTabs />)
    // Click through every tab so each panel mounts.
    for (const tab of ['Open Orders', 'Order History', 'Trade History', 'Funding History']) {
      fireEvent.click(screen.getByRole('button', { name: tab }))
    }
    const text = container.textContent || ''
    // None of the seeded pair tickers may appear — the pair column is the
    // most reliable smoking-gun marker that a row was rendered.
    expect(text).not.toContain('BTC-USD')
    expect(text).not.toContain('ETH-USD')
    expect(text).not.toContain('SOL-USD')
    expect(text).not.toContain('TSLA-USD')
    expect(text).not.toContain('AAPL-USD')
  })
})
