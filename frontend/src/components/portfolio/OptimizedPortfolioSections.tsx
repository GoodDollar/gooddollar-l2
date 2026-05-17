'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Lazy load protocol-specific sections to reduce initial bundle size
const LazyStocksSection = dynamic(() => import('./LazyStocksSection').then(m => ({ default: m.LazyStocksSection })), {
  ssr: false,
  loading: () => (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-16 bg-dark-50/50 rounded" />
        <div className="h-4 w-20 bg-dark-50/30 rounded" />
      </div>
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 px-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-dark-50/40" />
              <div className="h-4 w-20 bg-dark-50/40 rounded" />
            </div>
            <div className="text-right space-y-1">
              <div className="h-4 w-16 bg-dark-50/40 rounded" />
              <div className="h-3 w-12 bg-dark-50/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

const LazyPredictSection = dynamic(() => import('./LazyPredictSection').then(m => ({ default: m.LazyPredictSection })), {
  ssr: false,
  loading: () => (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mb-4 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-20 bg-dark-50/50 rounded" />
        <div className="h-4 w-20 bg-dark-50/30 rounded" />
      </div>
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 px-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-dark-50/40" />
              <div className="h-4 w-32 bg-dark-50/40 rounded" />
            </div>
            <div className="text-right space-y-1">
              <div className="h-4 w-16 bg-dark-50/40 rounded" />
              <div className="h-3 w-12 bg-dark-50/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

const LazyPerpsSection = dynamic(() => import('./LazyPerpsSection').then(m => ({ default: m.LazyPerpsSection })), {
  ssr: false,
  loading: () => (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-5 w-20 bg-dark-50/50 rounded" />
        <div className="h-4 w-20 bg-dark-50/30 rounded" />
      </div>
      <div className="space-y-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 px-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-dark-50/40" />
              <div className="h-4 w-24 bg-dark-50/40 rounded" />
            </div>
            <div className="text-right space-y-1">
              <div className="h-4 w-16 bg-dark-50/40 rounded" />
              <div className="h-3 w-12 bg-dark-50/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

export function OptimizedPortfolioSections() {
  return (
    <>
      <Suspense fallback={<div>Loading stocks...</div>}>
        <LazyStocksSection />
      </Suspense>

      <Suspense fallback={<div>Loading predictions...</div>}>
        <LazyPredictSection />
      </Suspense>

      <Suspense fallback={<div>Loading perpetuals...</div>}>
        <LazyPerpsSection />
      </Suspense>
    </>
  )
}