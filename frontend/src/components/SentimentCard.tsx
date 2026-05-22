'use client'

import { useMemo } from 'react'
import { generateSentiment } from '@/lib/sentiment'

interface SentimentCardProps {
  ticker: string
}

export function SentimentCard({ ticker }: SentimentCardProps) {
  const sentiment = useMemo(() => generateSentiment(ticker), [ticker])

  return (
    <div className="bg-dark-100 rounded-2xl border border-gray-700/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Community Sentiment</h3>
        <span className="text-[10px] text-gray-500">{sentiment.voters.toLocaleString()} voters</span>
      </div>

      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-green-400 font-medium">{sentiment.bullish}% Bullish</span>
        <span className="text-red-400 font-medium">{sentiment.bearish}% Bearish</span>
      </div>

      <div className="relative h-2.5 rounded-full overflow-hidden bg-red-500/30">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700 ease-out"
          style={{ width: `${sentiment.bullish}%` }}
        />
      </div>

      <p className="mt-2.5 text-[10px] text-gray-500 text-center">
        Powered by GoodDAO
      </p>
    </div>
  )
}
