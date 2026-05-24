'use client'

import { LANE1_STATUS_HREF } from '@/lib/lane1Links'

interface StalePriceBannerProps {
  variant: 'swap' | 'stocks' | 'crypto'
  className?: string
  /**
   * Override the "See pipeline status →" anchor target. Defaults to the
   * Lane-1 proof page (`/lane1`). Pass `null` to suppress the link
   * entirely — useful in tests or in contexts where the banner is shown
   * before the proof page has been mounted.
   */
  linkHref?: string | null
}

const MESSAGES = {
  swap: {
    icon: '⚠️',
    text: 'Live prices unavailable: showing cached rates. Swap at your own risk.',
  },
  stocks: {
    icon: '📡',
    text: 'Oracle offline: showing demo prices. Data may not reflect current market values.',
  },
  crypto: {
    icon: '📡',
    text: 'Crypto oracle offline: showing demo prices. Mark, 24h stats, funding, and OI may not reflect current market values.',
  },
} as const

export function StalePriceBanner({
  variant,
  className = '',
  linkHref = LANE1_STATUS_HREF,
}: StalePriceBannerProps) {
  const { icon, text } = MESSAGES[variant]

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs ${className}`}
      role="alert"
      data-testid="stale-price-banner"
    >
      <span className="text-sm shrink-0">{icon}</span>
      <span>{text}</span>
      {linkHref && (
        <a
          href={linkHref}
          className="ml-auto underline hover:text-yellow-300 transition-colors shrink-0"
          data-testid="stale-price-banner-link"
        >
          See pipeline status →
        </a>
      )}
    </div>
  )
}
