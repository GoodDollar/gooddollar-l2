'use client'

/**
 * usePortfolioReads — batches all on-chain reads for <PortfolioOnChain>
 * into a single `multicall3.aggregate3` call via wagmi's
 * `useReadContracts` (plural).
 *
 * Before this hook existed, the panel held 6 separate `useReadContract`
 * instances:
 *   - GoodDollarToken.balanceOf            (1 call)
 *   - useGUSDBalance → gUSD.balanceOf      (1 call)
 *   - useUserAccountData → getUserAccountData (1 call)
 *   - useVault × 3 → vaults + accumulators (6 calls = 2×3)
 *                                            ────────
 *                                            9 eth_calls / 15s tick
 *
 * Now everything is one `multicall3.aggregate3` keyed by a stable
 * contract array, so React Query caches all 9 sub-results under one
 * key and consumers share that cache.
 *
 * The pure post-fetch math lives in `computeVaultState()` and
 * `computeAccountData()` from `useGoodStable.ts` and `useGoodLend.ts`,
 * so per-row hooks (`useVault`, `useUserAccountData`) and this batched
 * hook cannot drift.
 */

import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { GoodDollarTokenABI, ERC20ABI, GoodLendPoolABI, VaultManagerABI } from '@/lib/abi'
import { CONTRACTS } from '@/lib/chain'
import {
  computeVaultState,
  ILK_ETH,
  ILK_GD,
  ILK_USDC,
  type VaultState,
} from '@/lib/useGoodStable'
import { computeAccountData, type OnChainAccountData } from '@/lib/useGoodLend'
import { getPrice } from '@/lib/usePriceFeeds'

const VAULT_MGR = CONTRACTS.VaultManager

export interface PortfolioReads {
  gdBalance: number
  gusdBalance: number
  lend: OnChainAccountData | null
  ethVault: VaultState | null
  gdVault: VaultState | null
  usdcVault: VaultState | null
  isLoading: boolean
  isError: boolean
}

/**
 * Read every datum the on-chain portfolio panel shows in one multicall.
 *
 * `prices` is the result of `usePriceFeeds(['WETH','G$','USDC'])` from
 * the parent. We resolve the three USD prices through `getPrice()` so
 * fallback values are used if a symbol is missing from the live map.
 */
export function usePortfolioReads(
  address: `0x${string}` | undefined,
  prices: Record<string, number>,
): PortfolioReads {
  const { data, isLoading, isError } = useReadContracts({
    contracts: address
      ? [
          // 0: G$ balance
          {
            address: CONTRACTS.GoodDollarToken,
            abi: GoodDollarTokenABI,
            functionName: 'balanceOf',
            args: [address],
          },
          // 1: gUSD balance
          {
            address: CONTRACTS.gUSD,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [address],
          },
          // 2: GoodLend aggregate account data
          {
            address: CONTRACTS.GoodLendPool,
            abi: GoodLendPoolABI,
            functionName: 'getUserAccountData',
            args: [address],
          },
          // 3: ETH vault — vaults(ilk, owner) → (collateral, normalizedDebt)
          {
            address: VAULT_MGR,
            abi: VaultManagerABI,
            functionName: 'vaults',
            args: [ILK_ETH, address],
          },
          // 4: ETH ilk accumulators(ilk) → (chi, lastDrip, totalNormalizedDebt)
          {
            address: VAULT_MGR,
            abi: VaultManagerABI,
            functionName: 'accumulators',
            args: [ILK_ETH],
          },
          // 5: G$ vault
          {
            address: VAULT_MGR,
            abi: VaultManagerABI,
            functionName: 'vaults',
            args: [ILK_GD, address],
          },
          // 6: G$ ilk accumulators
          {
            address: VAULT_MGR,
            abi: VaultManagerABI,
            functionName: 'accumulators',
            args: [ILK_GD],
          },
          // 7: USDC vault
          {
            address: VAULT_MGR,
            abi: VaultManagerABI,
            functionName: 'vaults',
            args: [ILK_USDC, address],
          },
          // 8: USDC ilk accumulators
          {
            address: VAULT_MGR,
            abi: VaultManagerABI,
            functionName: 'accumulators',
            args: [ILK_USDC],
          },
        ]
      : [],
    allowFailure: true,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  })

  return useMemo<PortfolioReads>(() => {
    if (!data) {
      return {
        gdBalance: 0,
        gusdBalance: 0,
        lend: null,
        ethVault: null,
        gdVault: null,
        usdcVault: null,
        isLoading,
        isError,
      }
    }

    const gdRaw = data[0]?.result as bigint | undefined
    const gusdRaw = data[1]?.result as bigint | undefined
    const lendRaw = data[2]?.result as readonly [bigint, bigint, bigint] | undefined
    const ethVaultRaw = data[3]?.result as readonly [bigint, bigint] | undefined
    const ethAccRaw = data[4]?.result as readonly [bigint, bigint, bigint] | undefined
    const gdVaultRaw = data[5]?.result as readonly [bigint, bigint] | undefined
    const gdAccRaw = data[6]?.result as readonly [bigint, bigint, bigint] | undefined
    const usdcVaultRaw = data[7]?.result as readonly [bigint, bigint] | undefined
    const usdcAccRaw = data[8]?.result as readonly [bigint, bigint, bigint] | undefined

    const wethPx = getPrice(prices, 'WETH')
    const gdPx = getPrice(prices, 'G$')
    const usdcPx = getPrice(prices, 'USDC')

    return {
      gdBalance: gdRaw !== undefined ? Number(formatUnits(gdRaw, 18)) : 0,
      gusdBalance: gusdRaw !== undefined ? Number(formatUnits(gusdRaw, 18)) : 0,
      lend: computeAccountData(lendRaw),
      ethVault: computeVaultState(ethVaultRaw, ethAccRaw, 18, wethPx, 1.5),
      gdVault: computeVaultState(gdVaultRaw, gdAccRaw, 18, gdPx, 2.0),
      usdcVault: computeVaultState(usdcVaultRaw, usdcAccRaw, 6, usdcPx, 1.01),
      isLoading,
      isError,
    }
    // We intentionally depend on `prices` (the object identity) rather than
    // its keys — the parent already memoizes `prices` inside usePriceFeeds
    // so identity stability is good, and listing keys risks missing one.
  }, [data, isLoading, isError, prices])
}
