'use client'

import { LastDemoHedgePanel } from '@/components/proof/LastDemoHedgePanel'
import { LiveQuotesPanel } from '@/components/proof/LiveQuotesPanel'
import { OnChainOraclePanel } from '@/components/proof/OnChainOraclePanel'
import { OracleUpdatesPanel } from '@/components/proof/OracleUpdatesPanel'
import { PipelineFlowDiagram } from '@/components/proof/PipelineFlowDiagram'
import { PipelineStatusBanner } from '@/components/proof/PipelineStatusBanner'
import { ProofPanelBoundary } from '@/components/proof/ProofPanelBoundary'
import { SafetyBanner } from '@/components/proof/SafetyBanner'

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
          className="mt-3 max-w-2xl rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-gray-400"
        >
          <span className="font-semibold text-gray-300">How to read this page:</span>{' '}
          Each panel below is the live output of one service in the live-prices
          pipeline. If a panel is empty, that service is unreachable. Yellow
          &ldquo;degraded&rdquo; boxes are inline error states, intentional and not
          silently swallowed.
        </aside>
      </header>

      <ProofPanelBoundary label="Safety Banner">
        <SafetyBanner />
      </ProofPanelBoundary>

      <div className="mt-4">
        <ProofPanelBoundary label="Pipeline Status">
          <PipelineStatusBanner />
        </ProofPanelBoundary>
      </div>

      <div className="mt-3">
        <ProofPanelBoundary label="Pipeline Flow">
          <PipelineFlowDiagram />
        </ProofPanelBoundary>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
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
