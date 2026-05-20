'use client'

import type { MouseEvent } from 'react'

import { useWatchlist } from '@/lib/useWatchlist'

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-7 w-7 text-[14px]',
  md: 'h-9 w-9 text-[18px]',
  lg: 'h-11 w-11 text-[22px]',
}

export interface WatchlistStarButtonProps {
  ticker: string
  size?: Size
  className?: string
}

/**
 * Star toggle for the local Stocks watchlist (task 0034).
 *
 * Renders a filled gold star when the ticker is on the watchlist, and an
 * outline star otherwise. Click stops propagation so dropping the button into
 * a clickable list row never accidentally fires the row's navigate handler.
 */
export function WatchlistStarButton({
  ticker,
  size = 'md',
  className = '',
}: WatchlistStarButtonProps) {
  const { isWatched, toggle } = useWatchlist()
  const watched = isWatched(ticker)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.preventDefault()
    toggle(ticker)
  }

  const label = watched
    ? `Remove ${ticker} from watchlist`
    : `Add ${ticker} to watchlist`

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={watched}
      aria-label={label}
      title={label}
      className={[
        'inline-flex items-center justify-center rounded-full transition-colors',
        'border border-white/10 bg-white/5 hover:bg-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60',
        SIZE_CLASS[size],
        watched ? 'text-yellow-300' : 'text-slate-400 hover:text-yellow-200',
        className,
      ].join(' ')}
    >
      <span aria-hidden="true">{watched ? '★' : '☆'}</span>
    </button>
  )
}
