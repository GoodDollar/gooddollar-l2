'use client'

import { LastDemoHedgePanel } from '@/components/proof/LastDemoHedgePanel'
import { LiveQuotesPanel } from '@/components/proof/LiveQuotesPanel'
import { OnChainOraclePanel } from '@/components/proof/OnChainOraclePanel'
import { OracleUpdatesPanel } from '@/components/proof/OracleUpdatesPanel'
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
          Lane 6 · release proof
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
      </header>

      <ProofPanelBoundary label="Safety Banner">
        <SafetyBanner />
      </ProofPanelBoundary>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
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

      <footer className="mt-8 text-xs text-gray-500">
        Reviewers: this page is the canonical Lane 6 proof artifact. If any panel is
        empty, the corresponding service is unreachable; degraded states are surfaced
        inline, not silently swallowed.
      </footer>
    </section>
  )
}
