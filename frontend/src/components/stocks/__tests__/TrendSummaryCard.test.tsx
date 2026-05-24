import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrendSummaryCard } from '@/components/stocks/TrendSummaryCard'
import type { OHLCData } from '@/lib/chartData'

function makeChart(closes: number[]): OHLCData[] {
  return closes.map((close, i) => ({
    time: `2026-05-${(i + 1).toString().padStart(2, '0')}`,
    open: close,
    high: close * 1.01,
    low: close * 0.99,
    close,
    volume: 1_000_000,
  }))
}

describe('TrendSummaryCard', () => {
  it('renders honest empty state when isLive=false (regardless of chart data)', () => {
    render(<TrendSummaryCard chartData={makeChart([100, 95, 90])} timeframe="3M" isLive={false} />)
    expect(screen.getByTestId('trend-summary-empty')).toBeInTheDocument()
    expect(screen.getByText(/oracle feed degraded/i)).toBeInTheDocument()
    expect(screen.getByText(/illustrative/i)).toBeInTheDocument()
    expect(screen.queryByText(/Bullish|Bearish|Neutral/)).not.toBeInTheDocument()
  })

  it('renders the loading copy when isLive=true but no chart data', () => {
    render(<TrendSummaryCard chartData={[]} timeframe="3M" isLive={true} />)
    expect(screen.getByTestId('trend-summary-empty')).toBeInTheDocument()
    expect(screen.getByText(/chart data loads/i)).toBeInTheDocument()
    expect(screen.queryByText(/oracle feed degraded/i)).not.toBeInTheDocument()
  })

  it('renders three tiles when isLive=true and chartData is healthy', () => {
    render(<TrendSummaryCard chartData={makeChart([100, 105, 110])} timeframe="3M" isLive={true} />)
    expect(screen.queryByTestId('trend-summary-empty')).not.toBeInTheDocument()
    expect(screen.getByText('Bullish')).toBeInTheDocument()
    expect(screen.getByText('Signal')).toBeInTheDocument()
    expect(screen.getByText('3M move')).toBeInTheDocument()
    expect(screen.getByText('Range spread')).toBeInTheDocument()
  })

  it('labels the move tile with the active timeframe', () => {
    render(<TrendSummaryCard chartData={makeChart([100, 105])} timeframe="1W" isLive={true} />)
    expect(screen.getByText('1W move')).toBeInTheDocument()
  })

  it('renders Bearish in red when the live data trends down >2%', () => {
    render(<TrendSummaryCard chartData={makeChart([100, 95])} timeframe="3M" isLive={true} />)
    const signal = screen.getByText('Bearish')
    expect(signal.className).toMatch(/text-red-400/)
  })

  it('does NOT render Bullish/Bearish chips when oracle is degraded but candles trend down', () => {
    render(<TrendSummaryCard chartData={makeChart([244, 230, 218])} timeframe="3M" isLive={false} />)
    expect(screen.queryByText('Bearish')).not.toBeInTheDocument()
    expect(screen.queryByText(/-6\.\d+%/)).not.toBeInTheDocument()
  })
})
