import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/lib/usePriceServiceStatus', () => ({
  usePriceServiceStatus: vi.fn(),
}))

vi.mock('@/lib/useTestRegistry', () => ({
  useTestResults: () => ({ results: [], isLoading: false }),
  useContractCoverage: () => [],
  useTesterActivity: () => [],
  useRecentResults: () => [],
  contractName: (s: string) => s,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

import TestDashboardPage from '../page'

const { usePriceServiceStatus } = await import('@/lib/usePriceServiceStatus')

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('TestDashboardPage drift panel (task 0064)', () => {
  it('renders the unreachable card with /lane1 link when price-service errors', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: null,
      isLoading: false,
      error: 'fetch failed',
      nextRetryAt: null,
    })

    render(<TestDashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('drift-dashboard-error')).toBeInTheDocument()
    })
    const link = screen.getByTestId('drift-dashboard-pipeline-link')
    expect(link.getAttribute('href')).toBe('/lane1')
    expect(screen.getByText(/fetch failed/)).toBeInTheDocument()
  })

  it('shows "waiting for first quote" when status loaded but no quotes yet', async () => {
    vi.mocked(usePriceServiceStatus).mockReturnValue({
      status: { healthy: true, freshCount: 0, totalCount: 0, quotes: [], timestamp: Date.now() },
      isLoading: false,
      error: null,
      nextRetryAt: null,
    })

    render(<TestDashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/waiting for first quote/i)).toBeInTheDocument()
    })
  })
})
