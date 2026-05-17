'use client'

import { type Token } from '@/lib/tokens'

export function SwapRoute({ inputToken, outputToken }: { inputToken: Token; outputToken: Token }) {
  return (
    <div className="mx-4 mb-2 px-4 py-2.5 rounded-xl bg-dark/50 border border-gray-700/15">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span>Route</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-100 border border-gray-700/20 text-xs font-medium text-white">
          {inputToken.icon && <span className="text-sm">{inputToken.icon}</span>}
          {inputToken.symbol}
        </span>

        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-goodgreen/10 border border-goodgreen/20 text-xs font-medium text-goodgreen">
          <span className="w-3.5 h-3.5 rounded-full bg-goodgreen/10 flex items-center justify-center text-[8px]">G</span>
          GoodSwap Pool
        </span>

        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-100 border border-gray-700/20 text-xs font-medium text-white">
          {outputToken.icon && <span className="text-sm">{outputToken.icon}</span>}
          {outputToken.symbol}
        </span>
      </div>
    </div>
  )
}
