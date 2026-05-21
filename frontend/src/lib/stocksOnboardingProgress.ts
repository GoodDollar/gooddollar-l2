'use client'

export const STOCKS_ONBOARDING_PROGRESS_KEY = 'gd-stocks-onboarding-progress'

export interface StocksOnboardingProgress {
  exploredMarkets: boolean
  openedStockDetail: boolean
  connectIntent: boolean
}

const DEFAULT_PROGRESS: StocksOnboardingProgress = {
  exploredMarkets: false,
  openedStockDetail: false,
  connectIntent: false,
}

export function readStocksOnboardingProgress(): StocksOnboardingProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS
  try {
    const raw = window.sessionStorage.getItem(STOCKS_ONBOARDING_PROGRESS_KEY)
    if (!raw) return DEFAULT_PROGRESS
    const parsed = JSON.parse(raw) as Partial<StocksOnboardingProgress>
    return {
      exploredMarkets: Boolean(parsed.exploredMarkets),
      openedStockDetail: Boolean(parsed.openedStockDetail),
      connectIntent: Boolean(parsed.connectIntent),
    }
  } catch {
    return DEFAULT_PROGRESS
  }
}

export function writeStocksOnboardingProgress(progress: StocksOnboardingProgress): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(STOCKS_ONBOARDING_PROGRESS_KEY, JSON.stringify(progress))
}

export function markStocksOnboardingStep(
  progress: StocksOnboardingProgress,
  step: keyof StocksOnboardingProgress,
): StocksOnboardingProgress {
  const next = { ...progress, [step]: true }
  writeStocksOnboardingProgress(next)
  return next
}

