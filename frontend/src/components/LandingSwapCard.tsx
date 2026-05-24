'use client'

import WalletProviders from './WalletProviders'
import { SwapCard } from './SwapCard'
import { LandingPriceStrip } from './LandingPriceStrip'

/**
 * Landing-page SwapCard wrapper.
 *
 * The landing page does not live under the `(app)` route group, so it does
 * not get the global `WalletProviders`. To still let users swap from the
 * homepage, this component bundles `WalletProviders` together with
 * `SwapCard` and is itself imported via `next/dynamic({ ssr: false })`,
 * keeping wagmi + RainbowKit out of the landing page's initial bundle.
 *
 * Lane 4 (task 0007d/0002): also renders a 3-card `LivePriceStrip` above the
 * swap form so visitors can see ETH / USDC / G$ live prices with their source
 * attribution before they even start typing an amount.
 */
export default function LandingSwapCard() {
  return (
    <WalletProviders>
      <div className="flex flex-col gap-3 items-center w-full max-w-[460px] mx-auto">
        <LandingPriceStrip />
        <SwapCard />
      </div>
    </WalletProviders>
  )
}
