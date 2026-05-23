/**
 * Task 0040 — landing hero "$2.4M already distributed to 640K+ people
 * worldwide" line is now a `<HeroImpactLine>` component gated on
 * `useLandingImpact().status === 'live'`. In the default `unknown` state
 * the component renders nothing (we don't replace the literal with new
 * copy because the surrounding paragraph already says "Every swap and
 * trade automatically funds universal basic income worldwide.").
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroImpactLine } from '../HeroImpactLine'
import * as useLandingImpactModule from '@/lib/useLandingImpact'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('HeroImpactLine', () => {
  it('renders nothing when status is unknown (no fabricated literals)', () => {
    const { container } = render(<HeroImpactLine />)
    expect(container.textContent ?? '').not.toMatch(/\$2\.4M/)
    expect(container.textContent ?? '').not.toMatch(/640K\+/)
    expect(screen.queryByTestId('hero-impact-line')).toBeNull()
  })

  it('renders attributed counters when status is live', () => {
    vi.spyOn(useLandingImpactModule, 'useLandingImpact').mockReturnValue({
      status: 'live',
      ubiDistributedUsd: 5_300_000,
      claimers: 720_000,
      updatedAtMs: Date.now(),
    })
    render(<HeroImpactLine />)
    const line = screen.getByTestId('hero-impact-line')
    expect(line.textContent ?? '').toMatch(/\$5\.30M/)
    expect(line.textContent ?? '').toMatch(/720K/)
  })
})
