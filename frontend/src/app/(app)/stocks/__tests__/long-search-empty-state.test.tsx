import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-utils/wrapper'

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList))
})

const push = vi.fn()
const replace = vi.fn()
const walletState = { address: undefined as `0x${string}` | undefined }
const mountedState = { mounted: true }
const searchParamsState = { value: '' }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/stocks',
  useSearchParams: () => new URLSearchParams(searchParamsState.value),
  useParams: () => ({}),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => walletState,
  }
})

vi.mock('@/lib/useMounted', () => ({
  useMounted: () => mountedState.mounted,
}))

const stocksFixture = [
  {
    ticker: 'AAPL',
    name: 'sAAPL',
    sector: 'Technology',
    description: 'Apple synthetic',
    price: 218.27,
    change24h: 1.3,
    volume24h: 62000000,
    marketCap: 3340000000000,
    high52w: 260,
    low52w: 150,
    sparkline7d: [210, 212, 214, 216, 218],
    peRatio: 32,
    eps: 6.8,
    dividendYield: 0.5,
    avgVolume: 55000000,
  },
]

vi.mock('@/lib/useOnChainStocks', () => ({
  useOnChainStocks: () => ({
    stocks: stocksFixture,
    isLoading: false,
    isLive: true,
  }),
}))

import StocksPage from '../page'

describe('StocksPage long-search empty-state', () => {
  beforeEach(() => {
    push.mockClear()
    replace.mockClear()
    mountedState.mounted = true
    searchParamsState.value = ''
  })

  it('truncates the echoed query at 24 chars in the empty-state copy and does not render the full 128-char run', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    const input = screen.getByPlaceholderText('Search stocks...')
    const longRun = 'Z'.repeat(128)
    fireEvent.change(input, { target: { value: longRun } })

    const empty = screen.getAllByTestId(/^stocks-empty-state-(desktop|mobile)$/)
    expect(empty.length).toBeGreaterThan(0)

    for (const el of empty) {
      expect(el.textContent).toContain('No matches for')
      expect(el.textContent).toContain('ZZZZZZZZZZZZZZZZZZZZZZZZ…')
      expect(el.textContent ?? '').not.toContain(longRun)
    }
  })

  it('marks the empty-state span with spellCheck=false and a break-all word-break utility class', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    const input = screen.getByPlaceholderText('Search stocks...')
    fireEvent.change(input, { target: { value: 'Z'.repeat(128) } })

    const empty = screen.getAllByTestId(/^stocks-empty-state-(desktop|mobile)$/)
    expect(empty.length).toBeGreaterThan(0)

    for (const el of empty) {
      expect(el.getAttribute('spellcheck')).toBe('false')
      expect(el.className).toContain('break-all')
    }
  })

  it('leaves short queries unchanged in the empty-state copy', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    const input = screen.getByPlaceholderText('Search stocks...')
    fireEvent.change(input, { target: { value: 'NOT_A_TICKER_XYZ' } })

    const empty = screen.getAllByTestId(/^stocks-empty-state-(desktop|mobile)$/)
    expect(empty.length).toBeGreaterThan(0)

    for (const el of empty) {
      expect(el.textContent).toContain('No matches for')
      expect(el.textContent).toContain('NOT_A_TICKER_XYZ')
      expect(el.textContent ?? '').not.toContain('…')
    }
  })

  it('escapes HTML-like inputs as text and does not render an actual <script> element', () => {
    render(
      <TestWrapper>
        <StocksPage />
      </TestWrapper>,
    )

    const input = screen.getByPlaceholderText('Search stocks...')
    fireEvent.change(input, { target: { value: '<script>alert(1)</script>' } })

    expect(document.querySelectorAll('script').length).toBe(0)

    const empty = screen.getAllByTestId(/^stocks-empty-state-(desktop|mobile)$/)
    expect(empty.length).toBeGreaterThan(0)
    for (const el of empty) {
      expect(el.textContent ?? '').toContain('<script>alert(1)')
    }
  })
})
