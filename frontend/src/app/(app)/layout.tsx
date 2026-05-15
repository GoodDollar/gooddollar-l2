import WalletProviders from '@/components/WalletProviders'

/**
 * Layout for the `(app)` route group.
 *
 * All routes nested under `src/app/(app)/` get wagmi + RainbowKit providers
 * (the 3.2 MB web3 vendor bundle). Marketing/info pages live outside this
 * group so they never pay that cost.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <WalletProviders>{children}</WalletProviders>
}
