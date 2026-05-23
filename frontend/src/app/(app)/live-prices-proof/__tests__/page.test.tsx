import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/proof/SafetyBanner', () => ({
  SafetyBanner: () => <div data-testid="mock-safety-banner" />,
}))
vi.mock('@/components/proof/LiveQuotesPanel', () => ({
  LiveQuotesPanel: () => <div data-testid="mock-live-quotes-panel" />,
}))
vi.mock('@/components/proof/OnChainOraclePanel', () => ({
  OnChainOraclePanel: () => <div data-testid="mock-on-chain-oracle-panel" />,
}))
vi.mock('@/components/proof/OracleUpdatesPanel', () => ({
  OracleUpdatesPanel: () => <div data-testid="mock-oracle-updates-panel" />,
}))
vi.mock('@/components/proof/LastDemoHedgePanel', () => ({
  LastDemoHedgePanel: () => <div data-testid="mock-last-demo-hedge-panel" />,
}))

import LivePricesProofPage from '../page'

describe('LivePricesProofPage', () => {
  it('does not emit its own <main> landmark — the root layout owns it', () => {
    const { container } = render(<LivePricesProofPage />)
    expect(container.querySelectorAll('main')).toHaveLength(0)
  })

  it('renders the page wrapper as a labelled <section>', () => {
    render(<LivePricesProofPage />)
    const wrapper = screen.getByTestId('live-prices-proof-page')
    expect(wrapper.tagName).toBe('SECTION')
    expect(wrapper.getAttribute('aria-labelledby')).toBe('proof-page-heading')
  })

  it('gives the heading the id referenced by aria-labelledby', () => {
    render(<LivePricesProofPage />)
    const heading = screen.getByRole('heading', { level: 1, name: /Live Prices Proof/i })
    expect(heading.id).toBe('proof-page-heading')
  })
})
