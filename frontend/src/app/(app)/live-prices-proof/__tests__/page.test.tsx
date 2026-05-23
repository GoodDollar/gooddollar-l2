import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/proof/SafetyBanner', () => ({
  SafetyBanner: () => <div data-testid="mock-safety-banner" />,
}))
vi.mock('@/components/proof/PipelineStatusBanner', () => ({
  PipelineStatusBanner: () => <div data-testid="mock-pipeline-status-banner" />,
}))
vi.mock('@/components/proof/PipelineFlowDiagram', () => ({
  PipelineFlowDiagram: () => <div data-testid="mock-pipeline-flow-diagram" />,
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

  it('renders the pipeline status banner between the safety banner and the panel grid', () => {
    render(<LivePricesProofPage />)
    const safety = screen.getByTestId('mock-safety-banner')
    const pipeline = screen.getByTestId('mock-pipeline-status-banner')
    const firstPanel = screen.getByTestId('mock-live-quotes-panel')

    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING
    expect(safety.compareDocumentPosition(pipeline) & FOLLOWING).toBe(FOLLOWING)
    expect(pipeline.compareDocumentPosition(firstPanel) & FOLLOWING).toBe(FOLLOWING)
  })

  it('renders the pipeline flow diagram between the status banner and the panel grid', () => {
    render(<LivePricesProofPage />)
    const pipeline = screen.getByTestId('mock-pipeline-status-banner')
    const flow = screen.getByTestId('mock-pipeline-flow-diagram')
    const firstPanel = screen.getByTestId('mock-live-quotes-panel')

    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING
    expect(pipeline.compareDocumentPosition(flow) & FOLLOWING).toBe(FOLLOWING)
    expect(flow.compareDocumentPosition(firstPanel) & FOLLOWING).toBe(FOLLOWING)
  })

  it('header renders the audience-friendly pre-title', () => {
    render(<LivePricesProofPage />)
    expect(
      screen.getByText(/Release gate · GoodChain live-prices pipeline/i),
    ).toBeInTheDocument()
  })

  it('header renders the How to read this page aside with the rewritten interpretation rules', () => {
    // Updated by lane6-reviewer-callout-empty-rule-contradicts-oracle-placeholder-table.
    // The old "If a panel is empty, that service is unreachable" rule contradicted
    // the On-Chain Oracle panel's degraded rendering (which now shows a yellow
    // "awaiting" notice rather than the previous 12-row dash placeholder table).
    // The aside now teaches a single inclusive rule: numbers = alive,
    // yellow degraded/awaiting = intentional fallback.
    render(<LivePricesProofPage />)
    const aside = screen.getByTestId('reviewer-context')
    expect(aside.getAttribute('aria-label')).toBe('How to read this page')
    expect(aside).not.toHaveTextContent(/If a panel is empty/i)
    expect(aside).toHaveTextContent(/yellow.*(degraded|awaiting)/i)
    expect(aside).toHaveTextContent(/never silently swallows/i)
  })

  it('reviewer-context aside is structurally aligned with the data panels (rounded-2xl, panel background, accent border, info icon)', () => {
    render(<LivePricesProofPage />)
    const aside = screen.getByTestId('reviewer-context')
    const cls = aside.className
    expect(cls).toMatch(/rounded-2xl/)
    expect(cls).toMatch(/bg-dark-100/)
    expect(cls).toMatch(/border-accent/)
    expect(cls).toMatch(/p-5/)
    expect(cls).not.toMatch(/rounded-lg\b/)
    expect(cls).not.toMatch(/bg-white\/\[0\.02\]/)
    expect(cls).not.toMatch(/text-xs\b/)
    const icon = aside.querySelector('[aria-hidden]')
    expect(icon).not.toBeNull()
    expect(icon?.textContent?.trim()).toBe('i')
  })

  it('aside is rendered above the safety banner / panel grid', () => {
    render(<LivePricesProofPage />)
    const aside = screen.getByTestId('reviewer-context')
    const safety = screen.getByTestId('mock-safety-banner')

    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING
    expect(aside.compareDocumentPosition(safety) & FOLLOWING).toBe(FOLLOWING)
  })

  it('footer carries the initiative id for team reference', () => {
    render(<LivePricesProofPage />)
    expect(screen.getByTestId('proof-page-footer')).toHaveTextContent(
      /0007f-qa-proof-release/,
    )
  })

  it('footer no longer carries the panel-interpretation copy', () => {
    render(<LivePricesProofPage />)
    expect(screen.getByTestId('proof-page-footer')).not.toHaveTextContent(
      /If any panel is empty/i,
    )
  })
})
