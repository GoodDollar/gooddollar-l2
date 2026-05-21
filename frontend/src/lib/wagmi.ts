'use client'

import { connectorsForWallets, getDefaultConfig } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  injectedWallet,
  safeWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig } from 'wagmi'
import { http } from 'viem'
import { gooddollarL2 } from './chain'
import { validateWcProjectId } from './wagmi-helpers'
import { isWalletConnectEnabled, walletConnectProjectId } from './walletCapabilities'

const validatedWcProjectId = walletConnectProjectId
const isValidWcProjectId = isWalletConnectEnabled

// Scoped console filter for Reown / WalletConnect noise.
//
// Installed on BOTH branches of the config selection below:
//
//   - Valid projectId branch (production today): RainbowKit's
//     getDefaultConfig wires the WalletConnect connector, which
//     imports @reown/appkit-core. On page load that SDK fetches
//     remote project config from api.web3modal.org. If the
//     current page origin is not on the project's Cloud allowlist
//     the request returns HTTP 403 and the SDK logs:
//       console.error "Origin <origin> not found on Allowlist - update
//                      configuration on cloud.reown.com"
//       console.warn  "[Reown Config] Failed to fetch remote project
//                      configuration. Using local/default values."
//     Wallet connectivity itself still works (the SDK falls back
//     to local defaults), so this is a polish/noise fix, not a
//     functional regression. The permanent fix is to add the
//     origin to the project's allowlist in https://cloud.reown.com
//     — see docs/TESTNET_README.md "Operator runbook → WalletConnect
//     / Reown Cloud allowlist".
//
//   - Invalid projectId branch: kept as a defensive safety net.
//     In normal operation buildNoWcConfig() avoids importing
//     @reown/appkit entirely, so the filter is unreachable there;
//     but a future RainbowKit / wagmi version that reintroduces a
//     WC code path through a non-WC connector factory would still
//     be silenced.
//
// The filter is intentionally narrow: it matches two exact log
// patterns and lets every other warn/error pass through unchanged.
// Idempotency is guarded by a flag on `window` so re-importing
// wagmi.ts (e.g. in tests with vi.resetModules) does not wrap the
// console methods on top of themselves.
function installReownConsoleFilter(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { __reownConsoleFilterInstalled?: boolean }
  if (w.__reownConsoleFilterInstalled) return
  w.__reownConsoleFilterInstalled = true

  // "[Reown Config] Failed to fetch remote project configuration" —
  // the warning shape from @reown/appkit's remote config fetch.
  const reownConfigRe = /\[Reown Config\] Failed to fetch remote project configuration/
  // "Origin ... not found on Allowlist - update configuration on cloud.reown.com" —
  // the allowlist-403 error. Anchored on `cloud.reown.com` so it
  // cannot match an unrelated console.error from another component.
  const reownAllowlistRe = /Origin .* not found on Allowlist - update configuration on cloud\.reown\.com/

  const originalWarn = console.warn.bind(console)
  console.warn = (...args: unknown[]) => {
    const first = args[0]
    if (typeof first === 'string' && reownConfigRe.test(first)) return
    originalWarn(...args)
  }

  const originalError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    const first = args[0]
    if (
      typeof first === 'string' &&
      (reownAllowlistRe.test(first) || reownConfigRe.test(first))
    ) {
      return
    }
    originalError(...args)
  }
}

installReownConsoleFilter()

if (typeof window !== 'undefined' && !isValidWcProjectId) {
  // Developer-help message. Intentionally NOT matched by the
  // reownAllowlistRe / reownConfigRe patterns above — it must
  // remain visible so contributors know why mobile wallet flows
  // are missing in dev when no WalletConnect project ID is set.
  console.error(
    '[wagmi] NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid.\n' +
    'Mobile wallet connections (Rainbow, MetaMask Mobile, Trust Wallet, etc.) will NOT work.\n' +
    'Register a project at https://cloud.walletconnect.com and add NEXT_PUBLIC_WC_PROJECT_ID to your .env.local'
  )
}

export { validateWcProjectId } from './wagmi-helpers'
export { isWalletConnectEnabled } from './walletCapabilities'

// HTTP transport shared by both config branches. JSON-RPC batching at
// the transport layer coalesces requests inside a small time window
// into a single batched POST, complementing Multicall3 (wired in
// ./chain.ts) by also collapsing reads that don't go through
// `useReadContracts` (raw `useReadContract`, `getBlockNumber`, ENS
// lookups, balance reads). See task 0059.
const transports = {
  [gooddollarL2.id]: http('/api/rpc', { batch: true }),
} as const

// Branch on whether we have a real, 32-char-hex WalletConnect project
// ID. When valid, we use RainbowKit's `getDefaultConfig`, which wires
// the WalletConnect connector and the full default wallet list (mobile
// QR flows work). When invalid (env unset or any sentinel like
// `gooddollar-placeholder`), we skip `getDefaultConfig` entirely so the
// WalletConnect / `@reown/appkit-core` SDK is never imported and
// therefore never fires HTTPS requests to `api.web3modal.org` or
// `pulse.walletconnect.org` on page load. See task 0095 for the perf /
// privacy rationale.
//
// Connectors selected for the no-WC branch are extension-only and do
// not transitively reach `getWalletConnectConnector`:
//   - injectedWallet: surfaces window.ethereum (MetaMask, Brave,
//     Rabby, etc.) without any WC fallback.
//   - coinbaseWallet: uses @coinbase/wallet-sdk directly.
//   - safeWallet: uses wagmi's `safe` connector; only active inside
//     Safe{Apps} iframes, no WC code path.
// `metaMaskWallet` and `rainbowWallet` are intentionally excluded
// because their factories fall back to `getWalletConnectConnector`
// when the corresponding browser extension is not detected (and in
// SSR/jsdom environments `window.ethereum` is always undefined),
// which would re-introduce the network requests we are trying to
// eliminate. Users with MetaMask installed still connect through
// `injectedWallet`.
function buildNoWcConfig() {
  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Browser Wallets',
        wallets: [injectedWallet, coinbaseWallet, safeWallet],
      },
    ],
    {
      appName: 'GoodDollar',
      // `connectorsForWallets` requires a non-empty `projectId` string
      // but none of the wallets above read it. Pass a sentinel that
      // clearly signals "WalletConnect is intentionally disabled" if
      // it ever surfaces in a debugger.
      projectId: 'gooddollar-no-wc',
    },
  )
  return createConfig({
    chains: [gooddollarL2],
    connectors,
    ssr: true,
    transports,
  })
}

export const config = isValidWcProjectId
  ? getDefaultConfig({
      appName: 'GoodDollar',
      projectId: validatedWcProjectId,
      chains: [gooddollarL2],
      ssr: true,
      transports,
    })
  : buildNoWcConfig()
