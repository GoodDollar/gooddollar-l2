'use client'

import dynamic from 'next/dynamic'

const DeferredStocksPortfolioContent = dynamic(
  () => import('./StocksPortfolioContent').then((module) => module.StocksPortfolioContent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-5xl mx-auto animate-pulse" aria-busy="true" aria-live="polite">
        <div className="h-8 w-48 rounded bg-dark-50/50 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
          <div className="h-24 rounded-2xl bg-dark-50/40" />
          <div className="h-24 rounded-2xl bg-dark-50/40" />
          <div className="h-24 rounded-2xl bg-dark-50/40" />
          <div className="h-24 rounded-2xl bg-dark-50/40" />
        </div>
        <div className="h-44 rounded-2xl bg-dark-50/40 mb-6" />
        <div className="h-64 rounded-2xl bg-dark-50/40" />
      </div>
    ),
  },
)

export default function StocksPortfolioPage() {
  return <DeferredStocksPortfolioContent />
}
