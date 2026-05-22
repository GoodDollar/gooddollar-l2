'use client'

interface StalePriceBannerProps {
  variant: 'swap' | 'stocks'
  className?: string
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
} as const

export function StalePriceBanner({ variant, className = '' }: StalePriceBannerProps) {
  const { icon, text } = MESSAGES[variant]

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs ${className}`}
      role="alert"
      data-testid="stale-price-banner"
    >
      <span className="text-sm shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
