import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsRow } from '../StatsRow'
import * as useLandingImpactModule from '@/lib/useLandingImpact'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('StatsRow — task 0040: em-dash tiles + caption when impact feed is unknown', () => {
  it('renders three labelled tiles with em-dash values when status is unknown', () => {
    render(<StatsRow />)
    expect(screen.getByText('UBI Distributed')).toBeInTheDocument()
    expect(screen.getByText('Daily Claimers')).toBeInTheDocument()
    expect(screen.getByText('Total Swaps')).toBeInTheDocument()
    // No fabricated literals from the old hardcoded `stats` array.
    expect(screen.queryByText('$2.4M')).toBeNull()
    expect(screen.queryByText('640K+')).toBeNull()
    expect(screen.queryByText('1.2M')).toBeNull()
    // Each tile renders the em-dash sentinel.
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('renders the "coming soon" caption when status is unknown', () => {
    render(<StatsRow />)
    const caption = screen.getByTestId('stats-row-caption')
    expect(caption.textContent ?? '').toMatch(/coming soon/i)
  })

  it('renders attributed values + "as of" caption when status is live', () => {
    const updatedAtMs = new Date('2026-05-23T12:00:00Z').getTime()
    vi.spyOn(useLandingImpactModule, 'useLandingImpact').mockReturnValue({
      status: 'live',
      ubiDistributedUsd: 5_300_000,
      claimers: 720_000,
      totalSwaps: 1_700_000,
      updatedAtMs,
    })
    render(<StatsRow />)
    expect(screen.getByText('$5.30M')).toBeInTheDocument()
    expect(screen.getByText('720K')).toBeInTheDocument()
    expect(screen.getByText('1.7M')).toBeInTheDocument()
    expect(screen.getByTestId('stats-row-caption').textContent ?? '').toMatch(/as of/i)
  })
})
