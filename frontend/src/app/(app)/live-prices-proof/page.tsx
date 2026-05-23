'use client'

import { LastDemoHedgePanel } from '@/components/proof/LastDemoHedgePanel'
import { LiveQuotesPanel } from '@/components/proof/LiveQuotesPanel'
import { OnChainOraclePanel } from '@/components/proof/OnChainOraclePanel'
import { OracleUpdatesPanel } from '@/components/proof/OracleUpdatesPanel'
import { PipelineFlowDiagram } from '@/components/proof/PipelineFlowDiagram'
import { PipelineStatusBanner } from '@/components/proof/PipelineStatusBanner'
import { ProofPageActions } from '@/components/proof/ProofPageActions'
import { ProofPanelActionsProvider } from '@/components/proof/ProofPanelActionsProvider'
import { ProofPanelBoundary } from '@/components/proof/ProofPanelBoundary'
import { ProofPipelineAxesProvider } from '@/components/proof/ProofPipelineAxesProvider'
import { SafetyBanner } from '@/components/proof/SafetyBanner'

/**
 * Single source of truth for the inter-section vertical rhythm on the
 * proof page. The header above the section stack uses `mb-6` (24 px)
 * and the footer below uses `mt-8` (32 px); the data-panel grid uses
 * `gap-5` (20 px) for inner cell separation. Everything between the
 * SafetyBanner and the data grid sits on this 16 px cadence.
 */
const SECTION_GAP_CLASS = 'mt-4'

export default function LivePricesProofPage() {
  return (
    <section
      aria-labelledby="proof-page-heading"
      className="mx-auto max-w-7xl px-4 py-8"
      data-testid="live-prices-proof-page"
    >
      <header className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Release gate · GoodChain live-prices pipeline
        </p>
        <h1 id="proof-page-heading" className="text-2xl font-semibold text-white sm:text-3xl">
          Live Prices Proof
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          One-glance evidence that the full live-prices pipeline is alive: eToro quotes
          flow through the price-service, on-chain oracle reads return real numbers,
          recent <code className="text-accent">PriceUpdated</code> events are observed,
          and the demo-hedge proof artifact reflects the latest hedge run.
        </p>
        <aside
          aria-label="How to read this page"
          data-testid="reviewer-context"
          className="mt-4 flex max-w-3xl items-start gap-3 rounded-2xl border border-accent/20 bg-dark-100/60 p-5 text-sm text-gray-300"
        >
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-[11px] font-bold text-accent"
          >
            i
          </span>
          <div>
            <p className="font-semibold text-white">How to read this page</p>
            <p className="mt-1 text-sm text-gray-300">
              The page reads top-to-bottom as a single pipeline check. Each section
              below tells you something different:
            </p>
            <ol className="mt-3 space-y-1.5 text-sm text-gray-300">
              <li>
                <span className="font-semibold text-white">1. Safety banner</span>
                {' — '}confirms real trading is fenced off (
                <code className="text-accent">REAL_TRADING_ENABLED = false</code>,{' '}
                <code className="text-accent">ETORO_MODE = sandbox</code>).
              </li>
              <li>
                <span className="font-semibold text-white">2. Verdict banner</span>
                {' — '}one-line rollup of the whole pipeline (
                <span className="text-green-300">Alive</span>,{' '}
                <span className="text-yellow-200">Degraded</span>, or{' '}
                <span className="text-red-300">Cold</span>). Any failing axis becomes
                a clickable chip that jumps to the corresponding panel below.
              </li>
              <li>
                <span className="font-semibold text-white">3. Pipeline flow</span>
                {' — '}the six services that data passes through. Each pill is
                coloured by health (green = healthy, yellow = degraded, gray =
                loading first read), and clicking a pill jumps to the matching panel.
              </li>
              <li>
                <span className="font-semibold text-white">4. Data panels</span>
                {' — '}per-service deep-dive: live quotes, on-chain oracle, recent
                oracle updates, last demo hedge. A panel rendering numbers means that
                service is alive and producing data; a yellow &ldquo;degraded&rdquo;
                or &ldquo;awaiting&rdquo; notice is the service&apos;s own intentional
                fallback &mdash; the page never silently swallows an error or an
                empty feed.
              </li>
            </ol>
          </div>
        </aside>
      </header>

      <ProofPanelBoundary label="Safety Banner">
        <SafetyBanner />
      </ProofPanelBoundary>

      <ProofPipelineAxesProvider>
        <ProofPanelActionsProvider>
          <div className={SECTION_GAP_CLASS}>
            <ProofPageActions />
          </div>

          <div className={SECTION_GAP_CLASS}>
            <ProofPanelBoundary label="Pipeline Status">
              <PipelineStatusBanner />
            </ProofPanelBoundary>
          </div>

          <div className={SECTION_GAP_CLASS}>
            <ProofPanelBoundary label="Pipeline Flow">
              <PipelineFlowDiagram />
            </ProofPanelBoundary>
          </div>

          <div className={`${SECTION_GAP_CLASS} grid grid-cols-1 gap-5 lg:grid-cols-2`}>
            <ProofPanelBoundary label="Live Quotes">
              <LiveQuotesPanel />
            </ProofPanelBoundary>
            <ProofPanelBoundary label="On-chain Oracle">
              <OnChainOraclePanel />
            </ProofPanelBoundary>
            <ProofPanelBoundary label="Oracle Updates">
              <OracleUpdatesPanel />
            </ProofPanelBoundary>
            <ProofPanelBoundary label="Last Demo Hedge">
              <LastDemoHedgePanel />
            </ProofPanelBoundary>
          </div>
        </ProofPanelActionsProvider>
      </ProofPipelineAxesProvider>

      <footer
        data-testid="proof-page-footer"
        className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600"
      >
        <span>
          Canonical artifact for initiative{' '}
          <code className="text-gray-500">0007f-qa-proof-release</code> (Lane 6).
        </span>
      </footer>
    </section>
  )
}
