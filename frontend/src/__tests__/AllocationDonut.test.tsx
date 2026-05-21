import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AllocationDonut } from '@/components/stocks/AllocationDonut'

describe('AllocationDonut', () => {
  it('renders without crashing', () => {
    render(<AllocationDonut segments={[]} />)
    expect(screen.getByTestId('allocation-donut')).toBeInTheDocument()
  })

  it('shows "No positions" when segments are empty', () => {
    render(<AllocationDonut segments={[]} />)
    expect(screen.getByText('No positions')).toBeInTheDocument()
  })

  it('renders segment labels with percentages', () => {
    const segments = [
      { ticker: 'gAAPL', pct: 60 },
      { ticker: 'gTSLA', pct: 40 },
    ]
    render(<AllocationDonut segments={segments} />)
    expect(screen.getByText('gAAPL')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('gTSLA')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    const segments = [{ ticker: 'gNVDA', pct: 100 }]
    render(<AllocationDonut segments={segments} />)
    const svg = screen.getByTestId('allocation-donut').querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('respects custom size prop', () => {
    const segments = [{ ticker: 'gAAPL', pct: 100 }]
    render(<AllocationDonut segments={segments} size={200} />)
    const svg = screen.getByTestId('allocation-donut').querySelector('svg')
    expect(svg).toHaveAttribute('width', '200')
    expect(svg).toHaveAttribute('height', '200')
  })
})
