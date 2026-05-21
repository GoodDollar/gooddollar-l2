'use client'

import dynamic from 'next/dynamic'

const DeferredStockDetailContent = dynamic(
  () => import('./StockDetailContent').then((module) => module.StockDetailContent),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="stocks-detail-loading"
        aria-busy="true"
        aria-live="polite"
        className="max-w-6xl mx-auto px-4 py-6 animate-pulse"
      >
        <span className="sr-only">Loading stock details…</span>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-dark-50/60" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-24 rounded bg-dark-50/60" />
            <div className="h-3 w-40 rounded bg-dark-50/40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 rounded-xl bg-dark-50/40" />
          <div className="h-64 rounded-xl bg-dark-50/40" />
          <div className="h-32 rounded-xl bg-dark-50/40" />
          <div className="h-32 rounded-xl bg-dark-50/40" />
          <div className="h-32 rounded-xl bg-dark-50/40" />
        </div>
      </div>
    ),
  },
)

export default function StockDetailPage() {
  return <DeferredStockDetailContent />
}
