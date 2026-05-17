'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

/**
 * Chain ID for the Good Chain devnet (Anvil). Kept in lockstep with
 * `PortfolioOnChain.tsx` — when that file's CHAIN_ID changes, this must too.
 */
const CHAIN_ID = 42069

/**
 * Inline call-to-action banner that appears above gated content (e.g. the
 * Portfolio page) when the user has no wallet connected, or has connected to
 * the wrong network.
 *
 * - Disconnected → soft green "Connect your wallet" banner that opens the
 *   RainbowKit connect modal.
 * - Connected to wrong chain → amber "Switch to the Good Chain devnet"
 *   banner that opens the RainbowKit chain modal.
 * - Connected to chain 42069 → renders nothing (zero DOM, zero margin).
 *
 * Designed to be additive: it sits above the existing UI and never gates the
 * page. The all-zeros demo dashboard remains visible behind it so users still
 * get a feel for what the page will look like once connected.
 */
export function ConnectWalletBanner() {
  const { isConnected, chainId } = useAccount()

  // Connected and on the right chain → render nothing.
  if (isConnected && chainId === CHAIN_ID) return null

  const wrongChain = isConnected && chainId !== CHAIN_ID

  const heading = wrongChain
    ? 'Switch to the Good Chain devnet'
    : 'Connect your wallet'

  const description = wrongChain
    ? 'Your wallet is on a different network. Switch to chain 42069 to see your positions.'
    : 'See your live on-chain positions across Stocks, Predict, Perps, Lend, Stable, and Swap.'

  const ctaLabel = wrongChain ? 'Switch Network' : 'Connect Wallet'

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, openChainModal }) => (
        <div
          role="region"
          aria-label={heading}
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-2xl border p-4 sm:p-5 mb-6 backdrop-blur-sm ${
            wrongChain
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-goodgreen/10 border-goodgreen/30'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <span
              aria-hidden
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                wrongChain
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-goodgreen/10 text-goodgreen'
              }`}
            >
              {wrongChain ? '⚠' : '✦'}
            </span>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-semibold text-white leading-tight">
                {heading}
              </p>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-snug">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={wrongChain ? openChainModal : openConnectModal}
            className={`shrink-0 self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-100 ${
              wrongChain
                ? 'bg-amber-500 text-black hover:bg-amber-400 focus:ring-amber-400'
                : 'bg-goodgreen text-black hover:bg-goodgreen/90 focus:ring-goodgreen'
            }`}
          >
            {ctaLabel}
          </button>
        </div>
      )}
    </ConnectButton.Custom>
  )
}
