/**
 * Layout for the `(app)` route group.
 *
 * WalletProviders moved to the root Providers wrapper because the shared
 * Header contains the primary Connect Wallet button and must be inside wagmi /
 * RainbowKit on every route.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
