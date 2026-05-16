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

const rawWcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID
const validatedWcProjectId = validateWcProjectId(rawWcProjectId)
const isValidWcProjectId = validatedWcProjectId !== ''

if (typeof window !== 'undefined' && !isValidWcProjectId) {
  console.error(
    '[wagmi] NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid.\n' +
    'Mobile wallet connections (Rainbow, MetaMask Mobile, Trust Wallet, etc.) will NOT work.\n' +
    'Register a project at https://cloud.walletconnect.com and add NEXT_PUBLIC_WC_PROJECT_ID to your .env.local'
  )

  // Scoped console.warn filter: drop only the known Reown
  // "Failed to fetch remote project configuration" 403 spam
  // emitted by @reown/appkit when no valid project ID is
  // configured. Kept as a defensive safety net — in normal
  // operation we never construct the WalletConnect connector
  // when the project ID is invalid (see config builder below),
  // so the @reown/appkit SDK is never imported and this filter
  // is unreachable. We keep it in case a future RainbowKit
  // version reintroduces a WC code path through a non-WC
  // connector factory.
  const w = window as unknown as { __reownWarnFilterInstalled?: boolean }
  if (!w.__reownWarnFilterInstalled) {
    w.__reownWarnFilterInstalled = true
    const originalWarn = console.warn.bind(console)
    const reownSuppressRe = /\[Reown Config\] Failed to fetch remote project configuration/
    console.warn = (...args: unknown[]) => {
      const first = args[0]
      if (typeof first === 'string' && reownSuppressRe.test(first)) {
        return
      }
      originalWarn(...args)
    }
  }
}

export { validateWcProjectId } from './wagmi-helpers'

// HTTP transport shared by both config branches. JSON-RPC batching at
// the transport layer coalesces requests inside a small time window
// into a single batched POST, complementing Multicall3 (wired in
// ./chain.ts) by also collapsing reads that don't go through
// `useReadContracts` (raw `useReadContract`, `getBlockNumber`, ENS
// lookups, balance reads). See task 0059.
const transports = {
  [gooddollarL2.id]: http(undefined, { batch: true }),
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
