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
// The real provider mounts useProofPipelineAxes, which pulls in wagmi's
// useReadContract — out of scope for page-composition tests, mock it to
// a transparent pass-through.
vi.mock('@/components/proof/ProofPipelineAxesProvider', () => ({
  ProofPipelineAxesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
// Each panel mock mirrors the outer <section> shell the real component
// renders (id + the layout classes the page-level grid relies on for
// row alignment), so page-level tests can assert composition without
// pulling in wagmi / fetch dependencies. The actual class-list contract
// for the real shells is enforced by the per-panel test files.
const PANEL_SHELL = 'flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5'
vi.mock('@/components/proof/LiveQuotesPanel', () => ({
  LiveQuotesPanel: () => (
    <section id="panel-live-quotes" data-testid="mock-live-quotes-panel" className={PANEL_SHELL} />
  ),
}))
vi.mock('@/components/proof/OnChainOraclePanel', () => ({
  OnChainOraclePanel: () => (
    <section id="panel-onchain-oracle" data-testid="mock-on-chain-oracle-panel" className={PANEL_SHELL} />
  ),
}))
vi.mock('@/components/proof/OracleUpdatesPanel', () => ({
  OracleUpdatesPanel: () => (
    <section id="panel-oracle-updates" data-testid="mock-oracle-updates-panel" className={PANEL_SHELL} />
  ),
}))
vi.mock('@/components/proof/LastDemoHedgePanel', () => ({
  LastDemoHedgePanel: () => (
    <section id="panel-last-hedge" data-testid="mock-last-demo-hedge-panel" className={PANEL_SHELL} />
  ),
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

  it('top-level proof sections use a uniform vertical gap (#0043)', () => {
    // The PipelineStatus banner, PipelineFlow diagram, and the data-panel
    // grid all wrap in a <div> whose only job is the inter-section
    // vertical gap. They must all share the same gap class (mt-4) so the
    // page's top-to-bottom rhythm is even.
    const { container } = render(<LivePricesProofPage />)

    const pipelineStatus = screen.getByTestId('mock-pipeline-status-banner')
    const pipelineFlow = screen.getByTestId('mock-pipeline-flow-diagram')
    const dataGrid = container.querySelector(
      'div.grid.grid-cols-1.lg\\:grid-cols-2',
    ) as HTMLElement | null
    expect(dataGrid).not.toBeNull()

    const statusWrapper = pipelineStatus.parentElement?.parentElement
    const flowWrapper = pipelineFlow.parentElement?.parentElement
    for (const wrapper of [statusWrapper, flowWrapper, dataGrid]) {
      expect(wrapper).not.toBeNull()
      const cls = (wrapper as HTMLElement).className
      expect(cls, `wrapper className: ${cls}`).toMatch(/\bmt-4\b/)
      expect(cls, `wrapper className: ${cls}`).not.toMatch(/\bmt-3\b/)
      expect(cls, `wrapper className: ${cls}`).not.toMatch(/\bmt-5\b/)
    }

    // SafetyBanner sits directly below the header's `mb-6` and has no
    // outer mt-* of its own — the header owns the gap.
    const safety = screen.getByTestId('mock-safety-banner')
    const safetyWrapper = safety.parentElement?.parentElement
    expect(safetyWrapper).not.toBeNull()
    expect((safetyWrapper as HTMLElement).className).not.toMatch(/\bmt-\d+\b/)
  })

  it('each grid panel section carries the h-full + flex flex-col shell so short rows fill their grid cell', () => {
    // Guards lane6-proof-grid-left-column-ends-short-leaves-dead-space (#0039):
    // when a left-column panel renders a short error/empty box, the row must
    // still stretch to the taller panel's height so the panel background
    // (not the page background) paints the rest of the cell.
    const { container } = render(<LivePricesProofPage />)
    const panelIds = [
      'panel-live-quotes',
      'panel-onchain-oracle',
      'panel-oracle-updates',
      'panel-last-hedge',
    ] as const
    for (const id of panelIds) {
      const section = container.querySelector(`section#${id}`)
      expect(section, `panel ${id} should render as a <section>`).not.toBeNull()
      const cls = section?.className ?? ''
      expect(cls, `panel ${id} className: ${cls}`).toMatch(/\bh-full\b/)
      expect(cls, `panel ${id} className: ${cls}`).toMatch(/\bflex\b/)
      expect(cls, `panel ${id} className: ${cls}`).toMatch(/\bflex-col\b/)
    }
  })
})
