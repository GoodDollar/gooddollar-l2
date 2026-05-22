'use client'

import { useState } from 'react'
import { getStockLogoUrl } from '@/lib/stockLogos'

interface StockLogoProps {
  ticker: string
  size?: 'sm' | 'md'
}

const sizeClasses = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-10 h-10 text-xs',
}

const imgSizes = { sm: 28, md: 40 }

export function StockLogo({ ticker, size = 'sm' }: StockLogoProps) {
  const [failed, setFailed] = useState(false)
  const logoUrl = getStockLogoUrl(ticker)

  const fallback = (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center font-bold text-goodgreen shrink-0`}>
      {ticker.slice(0, 2)}
    </div>
  )

  if (!logoUrl || failed) return fallback

  const px = imgSizes[size]

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-white/10 border border-gray-700/20 shrink-0`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={`${ticker} logo`}
        width={px}
        height={px}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </div>
  )
}
