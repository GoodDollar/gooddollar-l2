'use client'

import { type Token } from '@/lib/tokens'
import type { PriceSource } from '@/lib/priceSource'
import { priceSourceLabel } from '@/lib/priceSource'
import { PriceSourceBadge } from './PriceSourceBadge'

type RouteMode = 'pool' | 'off-chain' | 'unavailable'

function resolveRouteMode(pairOnChain: boolean, rateSource: PriceSource): RouteMode {
  if (pairOnChain) return 'pool'
  // Sources that signal "no useful number to render" → unavailable. The
  // `etoro-demo` / `coingecko` / `fallback` fall-through is a real (cached)
  // quote, so we still let the user see an `Off-chain quote` chip.
  if (rateSource === 'stale' || rateSource === 'closed' || rateSource === 'unknown') {
    return 'unavailable'
  }
  return 'off-chain'
}

interface SwapRouteProps {
  inputToken: Token
  outputToken: Token
  /** True when the selected pair is supported by GoodSwapRouter on devnet */
  pairOnChain: boolean
  /** Resolved source for the live rate the user is about to trade against */
  rateSource: PriceSource
}

/**
 * SwapRoute — single-line "where will my swap actually execute?" panel.
 *
 * Lane 4 / task 0047 fixes the case where this panel hard-coded
 * `<input> → GoodSwap Pool → <output>` for every pair, including
 * unsupported pairs whose rate was sourced from CoinGecko or fallback.
 * The route badge is the *primary* visual signal of routing — claiming a
 * pool exists when only a synthetic quote does is a dishonest-attribution
 * regression. We branch on `(pairOnChain, rateSource)` so the chip only
 * claims the pool for pairs the on-chain router actually serves.
 */
export function SwapRoute({ inputToken, outputToken, pairOnChain, rateSource }: SwapRouteProps) {
  const routeMode = resolveRouteMode(pairOnChain, rateSource)
  const tokenChip = (token: Token) => (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-100 border border-gray-700/20 text-xs font-medium text-white">
      {token.icon && <span className="text-sm">{token.icon}</span>}
      {token.symbol}
    </span>
  )

  return (
    <div
      className="mx-4 mb-2 px-4 py-2.5 rounded-xl bg-dark/50 border border-gray-700/15"
      data-testid="swap-route"
      data-route-mode={routeMode}
    >
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span>Route</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {tokenChip(inputToken)}
        <RouteArrow />
        {/* Middle chip — drives off route mode */}
        {routeMode === 'pool' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-goodgreen/10 border border-goodgreen/20 text-xs font-medium text-goodgreen">
            <span className="w-3.5 h-3.5 rounded-full bg-goodgreen/10 flex items-center justify-center text-[8px]">G</span>
            GoodSwap Pool
          </span>
        )}
        {routeMode === 'off-chain' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-amber-300">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
            Off-chain quote
          </span>
        )}
        {routeMode === 'unavailable' && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-700/30 border border-gray-700/40 text-xs font-medium text-gray-400">
            No route available
          </span>
        )}
        <RouteArrow />
        {tokenChip(outputToken)}
      </div>

      {/* Source-attribution sub-line. Always present — varies in copy. */}
      <div className="mt-2 flex items-center gap-1.5">
        {routeMode === 'pool' && (
          <>
            <span className="text-[11px] text-gray-500">Quote:</span>
            <PriceSourceBadge source={rateSource} size="sm" />
          </>
        )}
        {routeMode === 'off-chain' && (
          <p className="text-[11px] text-gray-400">
            Estimated via {priceSourceLabel(rateSource)} — no GoodSwap pool exists for this pair on devnet yet.
          </p>
        )}
        {routeMode === 'unavailable' && (
          <p className="text-[11px] text-gray-500">
            Source: {priceSourceLabel(rateSource)}
          </p>
        )}
      </div>
    </div>
  )
}

function RouteArrow() {
  return (
    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
