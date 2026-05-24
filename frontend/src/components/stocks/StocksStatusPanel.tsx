'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useOnChainStocks } from '@/lib/useOnChainStocks'
import { useSyntheticStockHeader } from '@/components/stocks/SyntheticStockHeaderBadge'
import { isWalletConnectConfigured } from '@/lib/walletConnectConfig'

interface StocksStatusPanelProps {
  /** Invoked when the user taps the primary action (Trade demo / View stocks / Connect wallet). */
  onCtaClick: () => void
}

const STORAGE_KEY = 'gd-banner-dismissed-stocks'

/**
 * Single consolidated status surface for the `/stocks` page header.
 *
 * Replaces the four stacked banners (`InfoBanner`, `StalePriceBanner`,
 * `WalletConnectConfigWarning`, and the green/yellow wallet-disconnected
 * hero card) with one panel that:
 *
 *  - reflects oracle state in one consistent severity treatment
 *    (amber when `!isLive`, green when `isLive`),
 *  - exposes the existing "How Tokenized Stocks Work" explainer copy as
 *    an inline toggle (default state honours the same localStorage
 *    dismiss key the old InfoBanner used, so returning visitors keep
 *    their dismissal),
 *  - shows the wallet-connect availability as a small chip instead of a
 *    full-width yellow banner, only when `isWalletConnectConfigured`
 *    is false,
 *  - exposes one primary CTA that adapts to wallet + oracle state.
 */
export function StocksStatusPanel({ onCtaClick }: StocksStatusPanelProps) {
  const { address } = useAccount()
  const { isLive } = useOnChainStocks()
  const header = useSyntheticStockHeader()
  const [explainerOpen, setExplainerOpen] = useState(false)

  useEffect(() => {
    try {
      setExplainerOpen(localStorage.getItem(STORAGE_KEY) !== 'true')
    } catch {
      setExplainerOpen(true)
    }
  }, [])

  const handleToggleExplainer = () => {
    setExplainerOpen(prev => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'false' : 'true')
      } catch {}
      return next
    })
  }

  const headline = isLive
    ? 'Stocks oracle is live'
    : 'Stocks oracle in demo mode'
  const helper = isLive
    ? 'Synthetic prices track the on-chain oracle. Trades route through GoodSwap.'
    : "Synthetic prices track the last on-chain close. Trades route through a demo router \u2014 no real funds at risk."

  const tone = isLive
    ? 'border-goodgreen/25 bg-gradient-to-r from-goodgreen/10 to-goodgreen/5'
    : 'border-yellow-500/25 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5'
  const dotTone = isLive ? 'bg-green-400' : 'bg-yellow-400'

  let ctaLabel: string
  if (!address) {
    ctaLabel = isLive ? 'Connect wallet to trade' : 'Trade demo'
  } else {
    ctaLabel = 'View stocks'
  }
  const ctaClass = isLive
    ? 'bg-goodgreen text-dark-900 hover:brightness-110'
    : 'bg-dark-100 text-gray-200 border border-gray-700/40 hover:bg-dark-50/40'

  return (
    <section
      data-testid="stocks-status-panel"
      data-oracle-state={isLive ? 'live' : 'demo'}
      aria-label="Stocks oracle status"
      className={`rounded-2xl border ${tone} px-3 sm:px-4 py-3`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full shrink-0 ${dotTone} mt-1 sm:mt-0`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-semibold text-white leading-tight">
            {headline}
          </p>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5 leading-snug">{helper}</p>
          {!isWalletConnectConfigured && (
            <span
              data-testid="stocks-status-wc-chip"
              className="inline-flex items-center gap-1.5 mt-1.5 rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300"
            >
              Wallet connect: injected only
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={handleToggleExplainer}
            className="text-xs text-gray-300 hover:text-white underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/40 rounded px-1"
            aria-expanded={explainerOpen}
            aria-controls="stocks-status-explainer"
          >
            {explainerOpen ? 'Hide details' : 'How this works'}
          </button>
          <button
            type="button"
            onClick={onCtaClick}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${ctaClass}`}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
      {explainerOpen && (
        <p
          id="stocks-status-explainer"
          className="mt-2.5 pt-2.5 border-t border-gray-700/30 text-xs text-gray-400 leading-relaxed"
        >
          {header.infoBannerDescription}
        </p>
      )}
    </section>
  )
}
