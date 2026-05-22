import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: { Custom: ({ children }: { children: (args: { openConnectModal: () => void }) => React.ReactNode }) => <>{children({ openConnectModal: () => {} })}</> },
}))

vi.mock('@/lib/WalletReadyContext', () => ({
  useWalletReady: vi.fn(),
  WalletReadyContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
}))

vi.mock('@/lib/useStocks', () => ({
  useMintSynthetic: vi.fn(),
  useRedeemSynthetic: vi.fn(),
  useStockPosition: vi.fn(() => ({ position: null, isLoading: false, refetch: vi.fn() })),
}))

vi.mock('@/lib/useMounted', () => ({
  useMounted: () => true,
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/stocks/AAPL',
  useSearchParams: () => new URLSearchParams(),
}))

const { useAccount } = await import('wagmi')
const { useWalletReady } = await import('@/lib/WalletReadyContext')
const { useMintSynthetic, useRedeemSynthetic } = await import('@/lib/useStocks')
const { StockOrderForm } = await import('@/components/stocks/StockOrderForm')

const stock = { ticker: 'AAPL', price: 175 }

function setupHooks({ isDeployed = false } = {}) {
  vi.mocked(useAccount).mockReturnValue({
    address: '0x1111111111111111111111111111111111111111',
    isConnected: true,
  } as unknown as ReturnType<typeof useAccount>)

  vi.mocked(useWalletReady).mockReturnValue(true)

  vi.mocked(useMintSynthetic).mockReturnValue({
    mint: vi.fn(),
    phase: 'idle',
    error: null,
    reset: vi.fn(),
    isConnected: true,
    isDeployed,
  } as unknown as ReturnType<typeof useMintSynthetic>)

  vi.mocked(useRedeemSynthetic).mockReturnValue({
    redeem: vi.fn(),
    phase: 'idle',
    error: null,
    reset: vi.fn(),
    isConnected: true,
  } as unknown as ReturnType<typeof useRedeemSynthetic>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPush.mockReset()
})

describe('<StockOrderForm> post-trade confirmation — task 0081', () => {
  it('shows confirmation panel after demo-mode submit', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()
    render(<StockOrderForm stock={stock} position={null} />)

    const amountInput = screen.getByTestId('stocks-order-amount-input')
    await user.type(amountInput, '100')
    await user.click(screen.getByRole('button', { name: /buy aapl/i }))

    expect(screen.getByTestId('stocks-order-confirmation')).toBeInTheDocument()
  })

  it('confirmation shows order details: ticker, side, shares, price', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()
    render(<StockOrderForm stock={stock} position={null} />)

    await user.type(screen.getByTestId('stocks-order-amount-input'), '175')
    await user.click(screen.getByRole('button', { name: /buy aapl/i }))

    const panel = screen.getByTestId('stocks-order-confirmation')
    expect(within(panel).getByText(/buy aapl/i)).toBeInTheDocument()
    expect(within(panel).getByText(/shares/i)).toBeInTheDocument()
  })

  it('"View Portfolio" button navigates to /stocks/portfolio', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()
    render(<StockOrderForm stock={stock} position={null} />)

    await user.type(screen.getByTestId('stocks-order-amount-input'), '100')
    await user.click(screen.getByRole('button', { name: /buy aapl/i }))

    const viewPortfolioBtn = screen.getByRole('button', { name: /view portfolio/i })
    await user.click(viewPortfolioBtn)
    expect(mockPush).toHaveBeenCalledWith('/stocks/portfolio')
  })

  it('"Trade Again" button resets to form view', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()
    render(<StockOrderForm stock={stock} position={null} />)

    await user.type(screen.getByTestId('stocks-order-amount-input'), '100')
    await user.click(screen.getByRole('button', { name: /buy aapl/i }))

    expect(screen.getByTestId('stocks-order-confirmation')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /trade again/i }))

    expect(screen.queryByTestId('stocks-order-confirmation')).not.toBeInTheDocument()
    expect(screen.getByTestId('stocks-order-amount-input')).toBeInTheDocument()
  })

  it('clears amount input after submission when returning to form', async () => {
    setupHooks({ isDeployed: false })
    const user = userEvent.setup()
    render(<StockOrderForm stock={stock} position={null} />)

    await user.type(screen.getByTestId('stocks-order-amount-input'), '100')
    await user.click(screen.getByRole('button', { name: /buy aapl/i }))
    await user.click(screen.getByRole('button', { name: /trade again/i }))

    expect(screen.getByTestId('stocks-order-amount-input')).toHaveValue('')
  })
})
