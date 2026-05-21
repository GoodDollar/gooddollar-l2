import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PerformanceStatsPanel } from '@/components/stocks/PerformanceStatsPanel'
import type { PerformanceStats } from '@/lib/computePerformanceStats'

describe('PerformanceStatsPanel', () => {
  const defaultStats: PerformanceStats = {
    winRate: 65.5,
    avgGainLossRatio: 2.1,
    bestTrade: 500,
    worstTrade: -300,
    totalRealizedPnl: 1200,
    tradeCount: 24,
  }

  it('renders without crashing', () => {
    render(<PerformanceStatsPanel stats={defaultStats} />)
    expect(screen.getByTestId('performance-stats-panel')).toBeInTheDocument()
  })

  it('displays win rate', () => {
    render(<PerformanceStatsPanel stats={defaultStats} />)
    expect(screen.getByText('65.5%')).toBeInTheDocument()
  })

  it('displays gain/loss ratio', () => {
    render(<PerformanceStatsPanel stats={defaultStats} />)
    expect(screen.getByText('2.10')).toBeInTheDocument()
  })

  it('displays best trade in green', () => {
    render(<PerformanceStatsPanel stats={defaultStats} />)
    expect(screen.getByText('$500.00')).toBeInTheDocument()
  })

  it('displays worst trade in red', () => {
    render(<PerformanceStatsPanel stats={defaultStats} />)
    expect(screen.getByText('-$300.00')).toBeInTheDocument()
  })

  it('displays total trades', () => {
    render(<PerformanceStatsPanel stats={defaultStats} />)
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('displays realized pnl with sign', () => {
    render(<PerformanceStatsPanel stats={defaultStats} />)
    expect(screen.getByText('+$1,200.00')).toBeInTheDocument()
  })

  it('shows negative realized pnl correctly', () => {
    render(<PerformanceStatsPanel stats={{ ...defaultStats, totalRealizedPnl: -400 }} />)
    expect(screen.getByText('-$400.00')).toBeInTheDocument()
  })
})
