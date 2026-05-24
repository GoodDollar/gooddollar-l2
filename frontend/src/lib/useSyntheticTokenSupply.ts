'use client'

/**
 * useSyntheticTokenSupply — task 0025.
 *
 * Reads the on-chain token address for a ticker from `SyntheticAssetFactory.
 * getAsset(ticker)` and then `totalSupply()` from the resulting ERC-20 so
 * the quote panel can show users "how many sAAPL tokens exist right now"
 * instead of inventing a fake order-book depth.
 *
 * Returns `{ supply: null, tokenAddress: null }` whenever the factory is
 * unconfigured, the lookup fails, or the token hasn't been listed yet —
 * callers fall back to Shape B (empty-state explanatory copy).
 */

import { useReadContract } from 'wagmi'
import { SyntheticAssetFactoryABI, ERC20ABI } from './abi'
import { CONTRACTS } from './chain'

export interface SyntheticTokenSupply {
  supply: number | null
  tokenAddress: `0x${string}` | null
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export function useSyntheticTokenSupply(ticker: string | undefined): SyntheticTokenSupply {
  const factory = CONTRACTS.SyntheticAssetFactory
  const enabledFactory = !!factory && !!ticker

  const addressResult = useReadContract({
    address: factory ?? undefined,
    abi: SyntheticAssetFactoryABI,
    functionName: 'getAsset',
    args: enabledFactory ? [ticker as string] : undefined,
    query: { enabled: enabledFactory, retry: false, staleTime: 60_000 },
  })

  const rawTokenAddress = addressResult.data as `0x${string}` | undefined
  const tokenAddress =
    rawTokenAddress && rawTokenAddress.toLowerCase() !== ZERO_ADDRESS ? rawTokenAddress : null

  const supplyResult = useReadContract({
    address: tokenAddress ?? undefined,
    abi: ERC20ABI,
    functionName: 'totalSupply',
    query: { enabled: !!tokenAddress, retry: false, refetchInterval: 60_000, staleTime: 60_000 },
  })

  const supplyBig = supplyResult.data as bigint | undefined
  const supply = supplyBig != null ? Number(supplyBig) / 1e18 : null

  return { supply, tokenAddress }
}
