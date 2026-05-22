'use client'

import { getPriceImpactSeverity } from '@/lib/useOnChainSwap'

interface PriceImpactWarningProps {
  priceImpact: number
  visible?: boolean
}

/**
 * PriceImpactWarning — banner that scales with the tiered severity from
 * `getPriceImpactSeverity`. The previous version waited until 5% (danger 10%)
 * which was too forgiving given the on-chain reserves can sandwich a sub-5%
 * trade easily; we now warn from 3% and turn red at 5%, with an `extreme`
 * label at 15%+ to flag MEV-bait trades that should normally be split.
 */
export function PriceImpactWarning({ priceImpact, visible = true }: PriceImpactWarningProps) {
  if (!visible) return null
  const severity = getPriceImpactSeverity(priceImpact)
  if (severity === 'normal' || severity === 'notice') return null

  const isRed = severity === 'high' || severity === 'extreme'
  const isExtreme = severity === 'extreme'

  const headline = isExtreme
    ? `Extreme Price Impact — ${priceImpact.toFixed(2)}%`
    : isRed
      ? `High Price Impact — ${priceImpact.toFixed(2)}%`
      : `Price Impact Warning — ${priceImpact.toFixed(2)}%`

  const body = isExtreme
    ? 'This trade will move the pool significantly. Consider splitting it into smaller swaps to avoid sandwich attacks.'
    : 'You may receive significantly less than expected due to limited pool liquidity.'

  return (
    <div
      data-testid="price-impact-warning"
      data-severity={severity}
      className={`mx-4 mt-2 p-3 rounded-xl flex items-start gap-2.5 text-sm ${
        isRed
          ? 'bg-red-500/10 border border-red-500/30'
          : 'bg-yellow-500/10 border border-yellow-500/30'
      }`}
      role={isRed ? 'alert' : undefined}
    >
      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isRed ? 'text-red-400' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div>
        <p className={`font-medium ${isRed ? 'text-red-400' : 'text-yellow-400'}`}>
          {headline}
        </p>
        <p className={`text-xs mt-0.5 ${isRed ? 'text-red-300' : 'text-yellow-400/70'}`}>
          {body}
        </p>
      </div>
    </div>
  )
}
