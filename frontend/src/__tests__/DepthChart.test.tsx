import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DepthChart } from '@/components/stocks/DepthChart'

vi.mock('@/lib/stockData', () => ({
  formatStockPrice: (v: number) => `$${v.toFixed(2)}`,
}))

describe('DepthChart', () => {
  it('renders the depth chart container', () => {
    render(<DepthChart oraclePrice={150} />)
    expect(screen.getByTestId('depth-chart')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    const { container } = render(<DepthChart oraclePrice={150} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders buy and sell area paths', () => {
    const { container } = render(<DepthChart oraclePrice={200} />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBe(2)
  })

  it('renders the oracle reference line', () => {
    const { container } = render(<DepthChart oraclePrice={200} />)
    const lines = container.querySelectorAll('line')
    expect(lines.length).toBeGreaterThanOrEqual(1)
  })

  it('renders legend items', () => {
    render(<DepthChart oraclePrice={200} />)
    expect(screen.getByText('Buy Impact (cost)')).toBeInTheDocument()
    expect(screen.getByText('Sell Impact (receive)')).toBeInTheDocument()
    expect(screen.getByText('Oracle Price')).toBeInTheDocument()
  })

  it('renders oracle label text in the SVG', () => {
    render(<DepthChart oraclePrice={200} />)
    expect(screen.getByText('Oracle')).toBeInTheDocument()
  })

  it('accepts custom height', () => {
    const { container } = render(<DepthChart oraclePrice={150} height={400} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveStyle({ height: '400px' })
  })
})
