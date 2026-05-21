import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PortfolioPnLChart } from '@/components/stocks/PortfolioPnLChart'

describe('PortfolioPnLChart', () => {
  const defaultProps = {
    values: [100, 120, 115, 130, 125],
    range: '1M' as const,
    onRangeChange: vi.fn(),
    currentValue: 5000,
    unrealizedPnl: 350,
    height: 200,
  }

  it('renders without crashing', () => {
    render(<PortfolioPnLChart {...defaultProps} />)
    expect(screen.getByTestId('portfolio-pnl-chart')).toBeInTheDocument()
  })

  it('displays current value formatted', () => {
    render(<PortfolioPnLChart {...defaultProps} />)
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
  })

  it('shows positive PnL in green', () => {
    render(<PortfolioPnLChart {...defaultProps} />)
    const pnlEl = screen.getByText('+$350.00')
    expect(pnlEl).toBeInTheDocument()
    expect(pnlEl.className).toContain('text-green-400')
  })

  it('shows negative PnL in red', () => {
    render(<PortfolioPnLChart {...defaultProps} unrealizedPnl={-200} />)
    const pnlEl = screen.getByText('-$200.00')
    expect(pnlEl).toBeInTheDocument()
    expect(pnlEl.className).toContain('text-red-400')
  })

  it('renders range buttons', () => {
    render(<PortfolioPnLChart {...defaultProps} />)
    expect(screen.getByText('1W')).toBeInTheDocument()
    expect(screen.getByText('1M')).toBeInTheDocument()
    expect(screen.getByText('3M')).toBeInTheDocument()
    expect(screen.getByText('1Y')).toBeInTheDocument()
  })

  it('calls onRangeChange when a range button is clicked', () => {
    render(<PortfolioPnLChart {...defaultProps} />)
    fireEvent.click(screen.getByText('3M'))
    expect(defaultProps.onRangeChange).toHaveBeenCalledWith('3M')
  })

  it('renders an SVG chart element', () => {
    render(<PortfolioPnLChart {...defaultProps} />)
    const svg = screen.getByRole('img', { name: /Portfolio P&L chart/i })
    expect(svg).toBeInTheDocument()
  })

  it('handles empty values gracefully', () => {
    render(<PortfolioPnLChart {...defaultProps} values={[]} />)
    expect(screen.getByTestId('portfolio-pnl-chart')).toBeInTheDocument()
  })
})
