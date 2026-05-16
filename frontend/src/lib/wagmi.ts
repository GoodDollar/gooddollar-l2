'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'viem'
import { gooddollarL2 } from './chain'
import { validateWcProjectId } from './wagmi-helpers'

const rawWcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID
const validatedWcProjectId = validateWcProjectId(rawWcProjectId)
const isValidWcProjectId = validatedWcProjectId !== ''

// RainbowKit's getDefaultConfig throws synchronously when projectId
// is empty ("No projectId found"), so we always pass a non-empty
// string to it. When we don't have a real 32-char hex ID we fall
// back to a deterministic placeholder. The Reown SDK behind
// RainbowKit will still attempt a remote-config fetch for that
// placeholder and receive a 403, but the scoped console.warn
// filter installed below drops only that specific warning so
// the browser console stays usable for real debugging.
const PLACEHOLDER_WC_PROJECT_ID = 'gooddollar-placeholder'
const wcProjectIdForRainbowKit = isValidWcProjectId
  ? validatedWcProjectId
  : PLACEHOLDER_WC_PROJECT_ID

if (typeof window !== 'undefined' && !isValidWcProjectId) {
  console.error(
    '[wagmi] NEXT_PUBLIC_WC_PROJECT_ID is missing or invalid.\n' +
    'Mobile wallet connections (Rainbow, MetaMask Mobile, Trust Wallet, etc.) will NOT work.\n' +
    'Register a project at https://cloud.walletconnect.com and add NEXT_PUBLIC_WC_PROJECT_ID to your .env.local'
  )

  // Scoped console.warn filter: drop only the known Reown
  // "Failed to fetch remote project configuration" 403 spam
  // emitted by @reown/appkit when no valid project ID is
  // configured. This filter is ONLY installed when we already
  // know the project ID is invalid, so legitimate Reown
  // warnings in production-shaped environments (where a real
  // 32-char hex ID is configured) are never suppressed.
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

export const config = getDefaultConfig({
  appName: 'GoodDollar',
  projectId: wcProjectIdForRainbowKit,
  chains: [gooddollarL2],
  ssr: true,
  // Enable JSON-RPC batching at the HTTP transport layer. Viem coalesces
  // requests that arrive within a small time window into a single
  // batched JSON-RPC POST, which complements Multicall3 (wired in
  // ./chain.ts) by also collapsing reads that don't go through
  // `useReadContracts` (e.g. raw `useReadContract`, `getBlockNumber`,
  // ENS lookups, balance reads). Belt-and-suspenders perf win — see
  // task 0059.
  transports: {
    [gooddollarL2.id]: http(undefined, { batch: true }),
  },
})
