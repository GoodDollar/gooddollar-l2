import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DemoChartOverlay } from '@/components/stocks/DemoChartOverlay'

describe('DemoChartOverlay', () => {
  it('renders the illustrative pill when the rail is not live', () => {
    render(<DemoChartOverlay isLive={false} />)
    const pill = screen.getByRole('note')
    expect(pill).toBeInTheDocument()
    expect(pill.textContent).toMatch(/Demo chart/i)
    expect(pill.textContent).toMatch(/illustrative/i)
  })

  it('renders nothing when the rail is live', () => {
    const { container } = render(<DemoChartOverlay isLive={true} />)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    expect(container.firstChild).toBeNull()
  })

  it('applies the StalePriceBanner amber palette', () => {
    render(<DemoChartOverlay isLive={false} />)
    const pill = screen.getByRole('note')
    expect(pill.className).toMatch(/bg-yellow-500\/10/)
    expect(pill.className).toMatch(/text-yellow-300/)
    expect(pill.className).toMatch(/border-yellow-500\/25/)
  })

  it('positions itself absolutely at the top-left of its container', () => {
    render(<DemoChartOverlay isLive={false} />)
    const pill = screen.getByRole('note')
    expect(pill.className).toMatch(/absolute/)
    expect(pill.className).toMatch(/top-2/)
    expect(pill.className).toMatch(/left-2/)
  })
})
