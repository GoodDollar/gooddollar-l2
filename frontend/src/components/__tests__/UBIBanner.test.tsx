import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UBIBanner } from '../UBIBanner'
import * as useLandingImpactModule from '@/lib/useLandingImpact'

const mockStorage: Record<string, string> = {}

beforeEach(() => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(k => mockStorage[k] ?? null)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { mockStorage[k] = v })
  vi.restoreAllMocks()
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(k => mockStorage[k] ?? null)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { mockStorage[k] = v })
})

describe('UBIBanner — task 0040: honest empty state until impact feed lands', () => {
  it('renders the unknown-state coming-soon copy when useLandingImpact returns status: unknown (default)', async () => {
    render(<UBIBanner />)
    const copy = await screen.findByTestId('ubi-banner-copy')
    expect(copy.textContent ?? '').toMatch(/Every swap funds UBI/i)
    expect(copy.textContent ?? '').toMatch(/coming soon/i)
    // No fabricated literals.
    expect(copy.textContent ?? '').not.toMatch(/\$2\.4M/)
    expect(copy.textContent ?? '').not.toMatch(/640K\+/)
  })

  it('renders attributed counters when useLandingImpact returns status: live', async () => {
    vi.spyOn(useLandingImpactModule, 'useLandingImpact').mockReturnValue({
      status: 'live',
      ubiDistributedUsd: 5_300_000,
      claimers: 720_000,
      updatedAtMs: Date.now(),
    })
    render(<UBIBanner />)
    const copy = await screen.findByTestId('ubi-banner-copy')
    expect(copy.textContent ?? '').toMatch(/\$5\.30M/)
    expect(copy.textContent ?? '').toMatch(/720K/)
    expect(copy.textContent ?? '').toMatch(/funded by your trades/i)
  })

  it('does not render when already dismissed in localStorage', () => {
    mockStorage['ubi-banner-dismissed'] = 'true'
    render(<UBIBanner />)
    expect(screen.queryByTestId('ubi-banner-copy')).not.toBeInTheDocument()
  })

  it('dismisses and persists to localStorage when close is clicked', async () => {
    render(<UBIBanner />)
    const btn = await screen.findByLabelText('Dismiss UBI banner')
    fireEvent.click(btn)
    expect(screen.queryByTestId('ubi-banner-copy')).not.toBeInTheDocument()
    expect(mockStorage['ubi-banner-dismissed']).toBe('true')
  })

  it('exposes a UBI impact landmark region after mount', async () => {
    render(<UBIBanner />)
    await screen.findByTestId('ubi-banner-copy')
    const region = screen.getByRole('region', { name: /UBI/i })
    expect(region).toBeInTheDocument()
    expect(screen.getByLabelText('Dismiss UBI banner')).toBeInTheDocument()
  })
})
