import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock wagmi before the module under test imports it
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
  useReadContracts: vi.fn(),
  useAccount: vi.fn(() => ({ address: undefined })),
}))

vi.mock('@/lib/chain', () => ({
  CONTRACTS: {
    PerpEngine: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    MarginVault: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    FundingRate: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    PerpPriceOracle: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  },
}))

vi.mock('@/lib/usePerpsHistory', () => ({
  useOracleMarkPrices: vi.fn(() => ({ markPrices: {}, indexPrices: {}, isLoading: false })),
}))

import { useReadContract, useReadContracts } from 'wagmi'
import { useOracleMarkPrices } from '@/lib/usePerpsHistory'
import { useOnChainPairs } from '@/lib/useOnChainPerps'

/**
 * Task 0026 — `useOnChainPairs` must distinguish a real chain read from
 * a fallback substitution. When the RPC is unreachable (or the contract
 * returns `marketCount === 0`), the hook still returns rendering-friendly
 * pairs but tags each row with `isFallback: true` and sets `isLive: false`.
 * Downstream resolvers can then refuse to label them as `chain-oracle`.
 */
describe('useOnChainPairs — fallback substitution honesty (task 0026)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOracleMarkPrices).mockReturnValue({
      markPrices: {}, indexPrices: {}, isLoading: false,
    })
  })

  it('returns FALLBACK_PAIRS branded with isFallback:true when marketCount === 0 (RPC down)', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: BigInt(0),
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContract>)
    vi.mocked(useReadContracts).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useOnChainPairs())

    expect(result.current.isLive).toBe(false)
    expect(result.current.pairs.length).toBeGreaterThan(0)
    expect(result.current.pairs.every(p => p.isFallback === true)).toBe(true)
  })

  it('returns FALLBACK_PAIRS branded with isFallback:true when all contract reads fail', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: BigInt(2),
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContract>)
    vi.mocked(useReadContracts).mockReturnValue({
      data: [
        { status: 'failure', error: new Error('RPC 502'), result: undefined },
        { status: 'failure', error: new Error('RPC 502'), result: undefined },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)

    const { result } = renderHook(() => useOnChainPairs())

    expect(result.current.isLive).toBe(false)
    expect(result.current.pairs.every(p => p.isFallback === true)).toBe(true)
  })

  it('returns real chain pairs with isFallback:false when the RPC answers', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: BigInt(2),
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContract>)
    // markets(uint256) returns [bytes32 key, uint256 maxLeverage, bool isActive, ...]
    vi.mocked(useReadContracts).mockReturnValue({
      data: [
        { status: 'success', result: ['0xkeybtc', BigInt(100), true] },
        { status: 'success', result: ['0xkeyeth', BigInt(50), true] },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useReadContracts>)
    vi.mocked(useOracleMarkPrices).mockReturnValue({
      markPrices: { 0: 90_000, 1: 4_000 },
      indexPrices: { 0: 89_950, 1: 3_999 },
      isLoading: false,
    })

    const { result } = renderHook(() => useOnChainPairs())

    expect(result.current.isLive).toBe(true)
    expect(result.current.pairs.length).toBe(2)
    expect(result.current.pairs.every(p => p.isFallback === false)).toBe(true)
    expect(result.current.pairs[0].markPrice).toBe(90_000)
    expect(result.current.pairs[1].markPrice).toBe(4_000)
  })
})
