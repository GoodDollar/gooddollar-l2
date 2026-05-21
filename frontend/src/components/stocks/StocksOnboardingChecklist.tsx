'use client'

import type { StocksOnboardingProgress } from '@/lib/stocksOnboardingProgress'

interface StocksOnboardingChecklistProps {
  progress: StocksOnboardingProgress
  className?: string
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-700/30 bg-dark-100/45 px-3 py-2">
      <span className="text-xs text-gray-200">{label}</span>
      <span
        className={`text-[11px] font-semibold ${done ? 'text-goodgreen' : 'text-gray-500'}`}
        aria-label={done ? `${label} complete` : `${label} pending`}
      >
        {done ? 'Done' : 'Next'}
      </span>
    </div>
  )
}

export function StocksOnboardingChecklist({ progress, className = '' }: StocksOnboardingChecklistProps) {
  return (
    <div className={`rounded-xl border border-gray-700/30 bg-dark-100/55 p-3 ${className}`} data-testid="stocks-onboarding-checklist">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-goodgreen">Progress checklist</p>
      <div className="mt-2 space-y-1.5">
        <ChecklistRow label="Explore markets" done={progress.exploredMarkets} />
        <ChecklistRow label="Open stock detail" done={progress.openedStockDetail} />
        <ChecklistRow label="Connect wallet and place first order" done={progress.connectIntent} />
      </div>
    </div>
  )
}

