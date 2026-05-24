/**
 * Task 0024: OracleStatusBadge `% conf` chip MUST be wrapped in an
 * `<abbr title="...">` so users can hover for an explanation of what
 * the confidence number measures.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const usePriceServiceStatusMock = vi.fn()

vi.mock('@/lib/usePriceServiceStatus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/usePriceServiceStatus')>()
  return {
    ...actual,
    usePriceServiceStatus: () => usePriceServiceStatusMock(),
  }
})

import { OracleStatusBadge } from '@/components/OracleStatusBadge'
import { __resetPriceServiceStatusStoreForTests, type PriceServiceStatus } from '@/lib/usePriceServiceStatus'

function statusWithConfidence(confidence: number): PriceServiceStatus {
  return {
    healthy: true,
    freshCount: 1,
    totalCount: 1,
    timestamp: Date.now(),
    quotes: [
      {
        symbol: 'AAPL',
        lastUpdateMs: 1_000,
        sessionState: 'open',
        confidence,
      },
    ],
  }
}

describe('OracleStatusBadge confidence chip tooltip (task 0024)', () => {
  beforeEach(() => {
    __resetPriceServiceStatusStoreForTests()
    usePriceServiceStatusMock.mockReset()
  })

  it('wraps the % conf value in an <abbr> with a hover-explainer title', () => {
    usePriceServiceStatusMock.mockReturnValue({
      status: statusWithConfidence(82),
      isLoading: false,
      error: null,
      nextRetryAt: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    const chip = screen.getByTestId('oracle-confidence-chip')
    expect(chip.tagName).toBe('ABBR')
    expect(chip.textContent).toBe('82% conf')
    const title = chip.getAttribute('title') ?? ''
    expect(title).toMatch(/signer/i)
    expect(title).toMatch(/70/)
  })

  it('renders the chip in yellow when confidence drops below 70', () => {
    usePriceServiceStatusMock.mockReturnValue({
      status: statusWithConfidence(55),
      isLoading: false,
      error: null,
      nextRetryAt: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    const chip = screen.getByTestId('oracle-confidence-chip')
    expect(chip.className).toMatch(/text-yellow-400/)
  })
})
