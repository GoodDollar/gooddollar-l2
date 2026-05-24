import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Stocks detail Key Statistics grid', () => {
  // KeyStatistics was extracted from `[ticker]/page.tsx` into its own
  // component as part of the honest-no-data refactor (task 0028). The
  // layout invariants (responsive gap, overflow protection) still apply
  // and live in the extracted component now.
  const source = readFileSync(
    resolve(__dirname, '../components/stocks/KeyStatistics.tsx'),
    'utf-8'
  )

  it('uses responsive gap (gap-2 sm:gap-4) instead of fixed gap-4', () => {
    const keyStatsIdx = source.indexOf('Key Statistics')
    expect(keyStatsIdx).toBeGreaterThan(-1)

    const gridAfter = source.slice(keyStatsIdx, keyStatsIdx + 300)
    expect(gridAfter).toContain('gap-2 sm:gap-4')
    expect(gridAfter).not.toContain(' gap-4 ')
  })

  it('stat values have overflow protection (min-w-0 or truncate)', () => {
    expect(source.includes('min-w-0') || source.includes('truncate')).toBe(true)
  })
})
