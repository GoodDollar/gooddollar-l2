import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('wagmi', () => ({
  useAccount: vi.fn().mockReturnValue({ address: undefined }),
  useReadContracts: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useBalance: vi.fn().mockReturnValue({ data: undefined }),
}))

vi.mock('@/lib/useSwapPickerBalances', async () => {
  const actual = await vi.importActual<typeof import('@/lib/useSwapPickerBalances')>(
    '@/lib/useSwapPickerBalances',
  )
  return { ...actual, useSwapPickerBalances: () => ({}) }
})

vi.mock('@/lib/useAttributedPrice', () => ({
  useAttributedPrices: () => ({}),
}))

const toastInfoSpy = vi.fn()
vi.mock('../ui/toast', () => ({
  toastInfo: (...args: unknown[]) => toastInfoSpy(...args),
}))

import { TokenSelectorModal } from '../TokenSelectorModal'
import { TOKENS } from '@/lib/tokens'

const ETH_TOKEN = TOKENS.find(t => t.symbol === 'ETH')!

beforeEach(() => {
  toastInfoSpy.mockReset()
})

function renderModal() {
  return render(
    <TokenSelectorModal
      open
      onClose={() => {}}
      onSelect={() => {}}
      selected={ETH_TOKEN}
    />,
  )
}

describe('TokenSelectorModal — empty-state polish (task 0050)', () => {
  it('shows the typed query verbatim and a Paste-from-clipboard hint when no tokens match', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('Search by name or symbol'), {
      target: { value: 'XYZ' },
    })

    expect(screen.getByText(/no tokens match/i)).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && /XYZ/.test(el.textContent ?? ''))).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /paste contract address from clipboard/i }),
    ).toBeInTheDocument()
  })

  it('clicking the Paste affordance fires the toastInfo "coming soon" stub', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('Search by name or symbol'), {
      target: { value: 'XYZ' },
    })

    fireEvent.click(
      screen.getByRole('button', { name: /paste contract address from clipboard/i }),
    )

    expect(toastInfoSpy).toHaveBeenCalledTimes(1)
    expect(toastInfoSpy.mock.calls[0][0]).toMatch(/custom tokens coming soon/i)
  })
})
