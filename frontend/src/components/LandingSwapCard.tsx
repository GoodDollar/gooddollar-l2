'use client'

import WalletProviders from './WalletProviders'
import { SwapCard } from './SwapCard'

/**
 * Landing-page SwapCard wrapper.
 *
 * The landing page does not live under the `(app)` route group, so it does
 * not get the global `WalletProviders`. To still let users swap from the
 * homepage, this component bundles `WalletProviders` together with
 * `SwapCard` and is itself imported via `next/dynamic({ ssr: false })`,
 * keeping wagmi + RainbowKit out of the landing page's initial bundle.
 */
export default function LandingSwapCard() {
  return (
    <WalletProviders>
      <SwapCard />
    </WalletProviders>
  )
}
