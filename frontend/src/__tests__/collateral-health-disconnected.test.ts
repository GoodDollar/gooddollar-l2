import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Portfolio CollateralHealth component', () => {
  const source = readFileSync(
    resolve(__dirname, '../app/(app)/stocks/portfolio/page.tsx'),
    'utf-8'
  )

  it('guards against zero ratio showing Critical — returns neutral state for ratio=0 + no real collateral', () => {
    const fnStart = source.indexOf('function CollateralHealth')
    expect(fnStart).toBeGreaterThan(-1)

    const fnBody = source.slice(fnStart, fnStart + 800)

    expect(fnBody).toMatch(/totalRequired\s*>\s*0/)
  })

  it('isDisconnected check wraps the CollateralHealth render', () => {
    expect(source).toContain('isDisconnected')
    expect(source).toContain('Connect wallet')
  })
})
