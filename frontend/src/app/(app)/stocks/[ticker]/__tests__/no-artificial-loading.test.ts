import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const src = readFileSync(resolve(__dirname, '..', 'page.tsx'), 'utf-8')

describe('stocks/[ticker] analyst loading', () => {
  it('does not use an artificial timer to fake analyst loading', () => {
    expect(src).not.toMatch(/setAnalystLoading/)
  })

  it('passes isLoading={false} to AnalystOutlookCard', () => {
    expect(src).toMatch(/isLoading=\{false\}/)
  })
})
