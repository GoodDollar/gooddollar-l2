/**
 * PerpsOrderForm over-cap input guard tests (task 0011).
 *
 * Sister to `SwapCard.input-cap.test.tsx` (task 0010). Without a per-symbol
 * cap, typing `99,999,999,999,999` BTC into the Size input yields a confident
 * `$8425Q` notional, `$842Q` margin, `$2.78Q` UBI line and a "Connect Wallet
 * to Trade" green CTA. The cap shipped here flips the panel to a chip + five
 * em-dash rows + a disabled "Size too large" CTA.
 *
 * The three observable states are pinned:
 *   1. under cap   — chip absent, CTA path unchanged
 *   2. at cap      — chip absent, CTA path unchanged (cap is inclusive)
 *   3. over cap    — chip present, all five rows render `—`, CTA disabled
 *                    with label "Size too large"
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('wagmi', async () => {
  const actual = await vi.importActual<typeof import('wagmi')>('wagmi')
  return {
    ...actual,
    useAccount: () => ({ address: undefined, isConnected: false }),
    useReadContract: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
    useWriteContract: () => ({ writeContractAsync: vi.fn() }),
  }
})

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => React.ReactNode }) => (
      <>{children({ openConnectModal: vi.fn() })}</>
    ),
  },
}))

vi.mock('@/lib/usePerps', () => ({
  useOpenPosition: () => ({
    openPosition: vi.fn(),
    phase: 'idle' as const,
    error: null,
    isDeployed: false,
  }),
}))

vi.mock('@/lib/useSymbolSyncGuard', () => ({
  useSymbolSyncGuard: () => ({ allowRiskIncrease: true, reason: null }),
}))

import { OrderForm } from '@/app/(app)/perps/page'
import type { PerpPair, AccountSummaryData } from '@/lib/perpsData'

const PAIR: PerpPair = {
  marketId: 0,
  symbol: 'BTC-USD',
  baseAsset: 'BTC',
  quoteAsset: 'USD',
  markPrice: 84_250,
  indexPrice: 84_250,
  change24h: 1.5,
  volume24h: 0,
  fundingRate: 0,
  nextFundingTime: 0,
  openInterest: 0,
  maxLeverage: 100,
}

const ACCOUNT: AccountSummaryData = {
  balance: 0,
  equity: 0,
  unrealizedPnl: 0,
  marginUsed: 0,
  availableMargin: 0,
  marginRatio: 0,
}

function setSize(value: string) {
  // The Size <AmountInput> is the input whose label is "Size (BTC)".
  const label = screen.getByText('Size (BTC)')
  const wrapper = label.parentElement!
  const input = within(wrapper).getByPlaceholderText('0.00') as HTMLInputElement
  fireEvent.change(input, { target: { value } })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PerpsOrderForm over-cap input guard (task 0011)', () => {
  it('renders normally for a Size comfortably under the BTC cap (0.5 BTC)', () => {
    render(
      <TestWrapper>
        <OrderForm pair={PAIR} account={ACCOUNT} marketId={PAIR.marketId} />
      </TestWrapper>
    )

    setSize('0.5')

    expect(screen.queryByTestId('perp-size-over-cap')).not.toBeInTheDocument()
    expect(screen.queryByTestId('perp-summary-overcap')).not.toBeInTheDocument()
    expect(screen.queryByTestId('perp-cta-over-cap')).not.toBeInTheDocument()
  })

  it('still passes when the Size is exactly at the cap (1,000 BTC)', () => {
    render(
      <TestWrapper>
        <OrderForm pair={PAIR} account={ACCOUNT} marketId={PAIR.marketId} />
      </TestWrapper>
    )

    setSize('1000')

    expect(screen.queryByTestId('perp-size-over-cap')).not.toBeInTheDocument()
    expect(screen.queryByTestId('perp-summary-overcap')).not.toBeInTheDocument()
    expect(screen.queryByTestId('perp-cta-over-cap')).not.toBeInTheDocument()
  })

  it('shows the chip, dashes every quote row, and disables the CTA for absurd Sizes', () => {
    render(
      <TestWrapper>
        <OrderForm pair={PAIR} account={ACCOUNT} marketId={PAIR.marketId} />
      </TestWrapper>
    )

    setSize('99999999999999')

    const chip = screen.getByTestId('perp-size-over-cap')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveTextContent(/exceeds per-symbol perp cap/i)
    expect(chip).toHaveTextContent(/1,000 BTC/)

    // All five quote rows render `—` instead of $###Q figures.
    const summary = screen.getByTestId('perp-summary-overcap')
    expect(within(summary).getByText('Notional')).toBeInTheDocument()
    expect(within(summary).getByText('Margin')).toBeInTheDocument()
    expect(within(summary).getByText('Liq. Price')).toBeInTheDocument()
    expect(within(summary).getByText(/^Fee \(/)).toBeInTheDocument()
    expect(within(summary).getByText(/UBI \(33%\)/)).toBeInTheDocument()
    const dashes = within(summary).getAllByText('—')
    expect(dashes).toHaveLength(5)

    // CTA is the over-cap guard, disabled, and reads "Size too large".
    const cta = screen.getByTestId('perp-cta-over-cap')
    expect(cta).toHaveTextContent(/size too large/i)
    expect(cta).toBeDisabled()
  })

  it('gates by symbol — ETH cap (50,000) lets 1,000 ETH through but blocks 60,000', () => {
    const ethPair: PerpPair = { ...PAIR, baseAsset: 'ETH', symbol: 'ETH-USD', markPrice: 3_500 }

    const { rerender } = render(
      <TestWrapper>
        <OrderForm pair={ethPair} account={ACCOUNT} marketId={ethPair.marketId} />
      </TestWrapper>
    )

    // Size label changes to "Size (ETH)" — re-query for ETH.
    const ethLabel = screen.getByText('Size (ETH)')
    const ethInput = within(ethLabel.parentElement!).getByPlaceholderText('0.00') as HTMLInputElement
    fireEvent.change(ethInput, { target: { value: '1000' } })
    expect(screen.queryByTestId('perp-size-over-cap')).not.toBeInTheDocument()

    fireEvent.change(ethInput, { target: { value: '60000' } })
    expect(screen.getByTestId('perp-size-over-cap')).toHaveTextContent(/50,000 ETH/)

    rerender(
      <TestWrapper>
        <OrderForm pair={PAIR} account={ACCOUNT} marketId={PAIR.marketId} />
      </TestWrapper>
    )
  })
})
