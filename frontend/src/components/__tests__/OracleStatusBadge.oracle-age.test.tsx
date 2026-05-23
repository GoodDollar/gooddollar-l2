/**
 * Task 0023: OracleStatusBadge MUST distinguish "the status feed
 * refreshed" from "the on-chain oracle actually republished". The
 * detail-variant freshness line reads from the per-symbol oracle-block
 * tracker (last increasing `oracleBlock`) instead of the polling
 * `lastUpdateMs`.
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
import {
  __resetPriceServiceStatusStoreForTests,
  __seedOracleBlockTrackerForTests,
  type PriceServiceStatus,
} from '@/lib/usePriceServiceStatus'

function statusFor(quote: {
  symbol: string
  lastUpdateMs: number
  sessionState: string
  confidence: number
  oracleBlock?: number
}): PriceServiceStatus {
  return {
    healthy: true,
    freshCount: 1,
    totalCount: 1,
    timestamp: Date.now(),
    quotes: [quote],
  }
}

describe('OracleStatusBadge — oracle-block age (task 0023)', () => {
  beforeEach(() => {
    __resetPriceServiceStatusStoreForTests()
    usePriceServiceStatusMock.mockReset()
  })

  it('renders "Oracle last published … (last close)" when oracleBlock has not advanced in 10 minutes', () => {
    const now = Date.now()
    __seedOracleBlockTrackerForTests('AAPL', 100, now - 600_000)
    usePriceServiceStatusMock.mockReturnValue({
      status: statusFor({
        symbol: 'AAPL',
        lastUpdateMs: 1_000,
        sessionState: 'closed',
        confidence: 82,
        oracleBlock: 100,
      }),
      isLoading: false,
      error: null,
      nextRetryAt: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    const detail = screen.getByTestId('oracle-status-detail')
    expect(detail.textContent).not.toMatch(/Updated 1s ago/)
    expect(detail.textContent).toMatch(/Oracle last published/)
    expect(detail.textContent).toMatch(/last close/)
  })

  it('renders "Oracle just published" when the on-chain block advanced within 15s', () => {
    const now = Date.now()
    __seedOracleBlockTrackerForTests('AAPL', 200, now - 5_000)
    usePriceServiceStatusMock.mockReturnValue({
      status: statusFor({
        symbol: 'AAPL',
        lastUpdateMs: 200_000,
        sessionState: 'open',
        confidence: 91,
        oracleBlock: 200,
      }),
      isLoading: false,
      error: null,
      nextRetryAt: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    const detail = screen.getByTestId('oracle-status-detail')
    expect(detail.textContent).toMatch(/Oracle just published/)
    expect(detail.textContent).not.toMatch(/Updated 3m ago/)
  })

  it('falls back to status-feed age when the tracker has never observed an oracle block', () => {
    usePriceServiceStatusMock.mockReturnValue({
      status: statusFor({
        symbol: 'AAPL',
        lastUpdateMs: 1_000,
        sessionState: 'open',
        confidence: 88,
      }),
      isLoading: false,
      error: null,
      nextRetryAt: null,
    })

    render(<OracleStatusBadge variant="detail" symbol="AAPL" />)
    const detail = screen.getByTestId('oracle-status-detail')
    expect(detail.textContent).toMatch(/Updated 1s ago/)
  })
})
