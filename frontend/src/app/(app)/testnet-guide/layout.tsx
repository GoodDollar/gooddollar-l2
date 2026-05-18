import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Testnet Guide',
  description:
    'Step-by-step guide for the GoodDollar L2 public testnet. Add the network to your wallet, claim test G$, and walk through Swap, Perps, Predict, Lend, and Stable scenarios end-to-end.',
}

export default function TestnetGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
