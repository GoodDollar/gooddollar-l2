/**
 * /lend Markets table — per-row source attribution & banner state.
 *
 * Task 0034: the table must read live `useReserveData` for WETH/USDC, render
 * a `PriceSourceBadge` per live row, and switch the banner to a red
 * "Couldn't reach the chain RPC" pattern when both readers fail. Fixture
 * numbers ($14.52M etc.) must never surface dressed up as live data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type React from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
  usePathname: () => '/lend',
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => null,
}))

vi.mock('@/lib/useGoodLend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/useGoodLend')>()
  return {
    ...actual,
    useReserveData: vi.fn(),
    useUserAccountData: vi.fn().mockReturnValue({ data: null, isLoading: false }),
    useConnectedAccount: vi.fn().mockReturnValue({ address: undefined, isConnected: false }),
    useTokenBalance: vi.fn().mockReturnValue({ balance: BigInt(0), isLoading: false }),
    useLendAction: vi.fn().mockReturnValue({ execute: vi.fn(), phase: 'idle', error: null, reset: vi.fn(), isConnected: false }),
  }
})

vi.mock('@/lib/useAttributedPrice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/useAttributedPrice')>()
  return {
    ...actual,
    useAttributedPrice: vi.fn(),
  }
})

import { useReserveData } from '@/lib/useGoodLend'
import type { ReserveDataResult, OnChainReserveData } from '@/lib/useGoodLend'
import { useAttributedPrice } from '@/lib/useAttributedPrice'
import { CONTRACTS } from '@/lib/chain'
import LendPage from '@/app/(app)/lend/page'
import { TestWrapper } from '@/test-utils/wrapper'

function makeReserveResult(over: Partial<ReserveDataResult>): ReserveDataResult {
  return {
    data: null,
    isLoading: false,
    error: null,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
    ...over,
  }
}

function makeReserveData(over: Partial<OnChainReserveData>): OnChainReserveData {
  const RAY = BigInt('1000000000000000000000000000')
  return {
    totalDeposits: BigInt(0),
    totalBorrows: BigInt(0),
    liquidityIndex: RAY,
    borrowIndex: RAY,
    supplyRate: BigInt(0),
    borrowRate: BigInt(0),
    accruedToTreasury: BigInt(0),
    supplyAPY: 0,
    borrowAPY: 0,
    utilization: 0,
    ...over,
  }
}

function setupAttributedPrice(over: Partial<{ priceUsd: number; source: 'coingecko' | 'chain-oracle' | 'fallback' | 'unknown' }> = {}): void {
  vi.mocked(useAttributedPrice).mockReturnValue({
    symbol: 'ETH',
    priceUsd: over.priceUsd ?? 2_069,
    source: over.source ?? 'coingecko',
    change24h: -0.95,
    ageMs: 1_000,
    divergent: false,
    divergenceOtherUsd: null,
  })
}

function renderLend(): ReturnType<typeof render> {
  return render(<TestWrapper><LendPage /></TestWrapper>)
}

describe('LendPage Markets table — task 0034 honest source attribution', () => {
  beforeEach(() => {
    vi.mocked(useReserveData).mockReset()
    setupAttributedPrice()
  })

  it('renders em-dashes + stale badge when both readers fail (RPC down)', () => {
    const refetch = vi.fn()
    vi.mocked(useReserveData).mockImplementation((addr) => {
      return makeReserveResult({
        data: null,
        error: new Error('HTTP 502'),
        refetch,
      })
    })

    const { container } = renderLend()

    // WETH and USDC live-row badges read stale, NOT chain-oracle.
    const wethBadge = container.querySelector('[data-testid="lend-row-source-WETH"]')
    const usdcBadge = container.querySelector('[data-testid="lend-row-source-USDC"]')
    expect(wethBadge?.getAttribute('data-source')).toBe('stale')
    expect(usdcBadge?.getAttribute('data-source')).toBe('stale')

    // No fixture numbers appear in the live rows.
    const wethRow = wethBadge?.closest('tr')
    const usdcRow = usdcBadge?.closest('tr')
    expect(wethRow?.textContent ?? '').not.toContain('$14.52M')
    expect(wethRow?.textContent ?? '').not.toContain('1.85%')
    expect(usdcRow?.textContent ?? '').not.toContain('$12.40M')
    expect(usdcRow?.textContent ?? '').not.toContain('6.24%')

    // Red RPC-down banner is shown (replaces green "Devnet Preview").
    const banner = screen.getByTestId('lend-chain-status-banner')
    expect(banner.getAttribute('data-state')).toBe('error')
    expect(banner.textContent).toMatch(/Couldn't reach the chain RPC/i)

    // Retry button calls the refetch hooks.
    const retry = screen.getByRole('button', { name: /retry now/i })
    fireEvent.click(retry)
    expect(refetch).toHaveBeenCalled()
  })

  it('renders chain-derived numbers + chain-oracle badge when readers return data', () => {
    vi.mocked(useReserveData).mockImplementation((addr) => {
      if (addr === CONTRACTS.MockWETH) {
        return makeReserveResult({
          data: makeReserveData({
            totalDeposits: BigInt('100000000000000000000'), // 100 WETH
            totalBorrows: BigInt('60000000000000000000'),   // 60  WETH
            supplyAPY: 0.025,
            borrowAPY: 0.041,
            utilization: 0.6,
          }),
          dataUpdatedAt: Date.now(),
        })
      }
      if (addr === CONTRACTS.MockUSDC) {
        return makeReserveResult({
          data: makeReserveData({
            totalDeposits: BigInt('200000000'),   // 200 USDC (6 decimals)
            totalBorrows: BigInt('150000000'),    // 150 USDC
            supplyAPY: 0.052,
            borrowAPY: 0.078,
            utilization: 0.75,
          }),
          dataUpdatedAt: Date.now(),
        })
      }
      return makeReserveResult({})
    })

    const { container } = renderLend()

    const wethBadge = container.querySelector('[data-testid="lend-row-source-WETH"]')
    const usdcBadge = container.querySelector('[data-testid="lend-row-source-USDC"]')
    expect(wethBadge?.getAttribute('data-source')).toBe('chain-oracle')
    expect(usdcBadge?.getAttribute('data-source')).toBe('chain-oracle')

    const wethRow = wethBadge?.closest('tr')
    // 100 WETH × $2,069 = $206,900 → formatted as "$206.90K". Crucially, the
    // fixture's $14.52M number must NOT appear in the chain-driven row.
    expect(wethRow?.textContent ?? '').not.toContain('$14.52M')
    expect(wethRow?.textContent ?? '').not.toContain('1.85%')
    expect(wethRow?.textContent ?? '').toMatch(/\$206\.\d+K/)
    expect(wethRow?.textContent ?? '').toContain('2.50%')

    // Green "Devnet Preview" banner shows again when chain is reachable.
    const banner = screen.getByTestId('lend-chain-status-banner')
    expect(banner.getAttribute('data-state')).toBe('ok')
  })
})
