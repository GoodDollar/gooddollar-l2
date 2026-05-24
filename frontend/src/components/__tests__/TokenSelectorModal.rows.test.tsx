import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useAccount: vi.fn().mockReturnValue({ address: undefined }),
  useReadContracts: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useBalance: vi.fn().mockReturnValue({ data: undefined }),
}))

const mockBalances = vi.fn()
const mockPrices = vi.fn()

vi.mock('@/lib/useSwapPickerBalances', async () => {
  const actual = await vi.importActual<typeof import('@/lib/useSwapPickerBalances')>(
    '@/lib/useSwapPickerBalances',
  )
  return {
    ...actual,
    useSwapPickerBalances: (...args: unknown[]) => mockBalances(...args),
  }
})

vi.mock('@/lib/useAttributedPrice', () => ({
  useAttributedPrices: (...args: unknown[]) => mockPrices(...args),
}))

import { TokenSelectorModal } from '../TokenSelectorModal'
import { TOKENS } from '@/lib/tokens'

const ETH_TOKEN  = TOKENS.find(t => t.symbol === 'ETH')!
const LINK_TOKEN = TOKENS.find(t => t.symbol === 'LINK')!

beforeEach(() => {
  mockBalances.mockReset()
  mockPrices.mockReset()
  mockBalances.mockReturnValue({})
  mockPrices.mockReturnValue({})
})

function renderModal(props: Partial<React.ComponentProps<typeof TokenSelectorModal>> = {}) {
  return render(
    <TokenSelectorModal
      open
      onClose={() => {}}
      onSelect={() => {}}
      selected={ETH_TOKEN}
      {...props}
    />,
  )
}

describe('TokenSelectorModal — three-column layout (task 0050)', () => {
  it('renders balance + USD value + source chip on the ETH row when both are known', () => {
    mockBalances.mockReturnValue({
      ETH: { raw: 1_200_000_000_000_000_000n, formatted: 1.2 },
    })
    mockPrices.mockReturnValue({
      ETH:  { priceUsd: 3000, source: 'chain-oracle' },
    })

    renderModal()

    const ethRow = screen.getByTestId('token-row-ETH')
    const balance = within(ethRow).getByTestId('token-row-balance')
    const usd     = within(ethRow).getByTestId('token-row-usd')

    expect(balance.textContent).toContain('1.2')
    // formatUsdValue produces "~$3,600" — assert the digits the user sees.
    expect(usd.textContent).toContain('3,600')

    // Source badge follows the canonical `PriceSourceBadge` data-source attribute.
    const badge = within(ethRow).getByTestId('price-source-badge')
    expect(badge.getAttribute('data-source')).toBe('chain-oracle')
  })

  it('renders an em-dash placeholder when balance is unknown (wallet disconnected)', () => {
    mockBalances.mockReturnValue({})
    mockPrices.mockReturnValue({})

    renderModal()

    // Every row must reserve the balance column even when empty so the
    // layout does not jump between rows with and without a number.
    for (const token of TOKENS) {
      const row = screen.getByTestId(`token-row-${token.symbol}`)
      const balance = within(row).getByTestId('token-row-balance')
      expect(balance.textContent).toBe('—')
    }
  })

  it('shows an "On chain" pill on SWAP_TOKENS rows but not on off-chain tokens', () => {
    renderModal()

    const ethRow  = screen.getByTestId('token-row-ETH')
    const linkRow = screen.getByTestId('token-row-LINK')
    expect(within(ethRow).queryByTestId('token-row-onchain-pill')).not.toBeNull()
    expect(within(linkRow).queryByTestId('token-row-onchain-pill')).toBeNull()
    expect(ethRow.getAttribute('data-on-chain')).toBe('true')
    expect(linkRow.getAttribute('data-on-chain')).toBe('false')
  })

  it('sorts non-zero-balance rows above zero-balance rows', () => {
    mockBalances.mockReturnValue({
      ETH: { raw: 0n, formatted: 1.2 },
    })
    mockPrices.mockReturnValue({
      ETH: { priceUsd: 3000, source: 'chain-oracle' },
    })

    renderModal()

    const allRows = screen.getAllByRole('option')
    const ethIdx  = allRows.findIndex(r => r.getAttribute('data-testid') === `token-row-${ETH_TOKEN.symbol}`)
    const linkIdx = allRows.findIndex(r => r.getAttribute('data-testid') === `token-row-${LINK_TOKEN.symbol}`)
    expect(ethIdx).toBeLessThan(linkIdx)
    expect(ethIdx).toBe(0)
  })
})
