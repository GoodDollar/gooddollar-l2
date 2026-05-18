import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Faucet',
  description:
    'Claim test G$ for the GoodDollar L2 public testnet. Free, no signup, one click — fund any address to start trading, lending, and predicting on the testnet.',
}

export default function FaucetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
