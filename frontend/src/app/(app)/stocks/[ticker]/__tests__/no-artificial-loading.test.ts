import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = readFileSync(resolve(__dirname, '..', 'page.tsx'), 'utf-8')

describe('stocks/[ticker] analyst loading', () => {
  it('uses a short bounded analyst loading transition', () => {
    expect(src).toMatch(/setAnalystLoading\(true\)/)
    expect(src).toMatch(/setTimeout\(\(\) => setAnalystLoading\(false\), 140\)/)
  })

  it('passes the analyst loading state to AnalystOutlookCard', () => {
    expect(src).toMatch(/isLoading=\{analystLoading\}/)
  })
})
