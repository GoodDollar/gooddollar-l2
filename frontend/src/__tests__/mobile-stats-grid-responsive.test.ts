import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Stocks detail Key Statistics grid', () => {
  const source = readFileSync(
    resolve(__dirname, '../app/(app)/stocks/[ticker]/page.tsx'),
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
    const keyStatsIdx = source.indexOf('Key Statistics')
    const sectionEnd = source.indexOf('</div>\n              </div>', keyStatsIdx)
    const section = source.slice(keyStatsIdx, sectionEnd)

    expect(
      section.includes('min-w-0') || section.includes('truncate')
    ).toBe(true)
  })
})
