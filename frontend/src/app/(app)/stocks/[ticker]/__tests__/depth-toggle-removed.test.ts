import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Regression guard for task 0066: the fabricated `Depth` view (driven by the
// hardcoded `computeDepthCurve` AMM model) must not return to the stocks
// detail page while no real liquidity feed is wired. The companion Order Book
// already says "No on-chain depth available — none of this is fabricated." —
// the chart card must not contradict it with a synthetic impact curve.
//
// We assert against the source file rather than mounting the page so that
// the test stays fast and free of lightweight-charts / wagmi / next/navigation
// boot dependencies.

const pageSrc = readFileSync(
  resolve(__dirname, '..', 'page.tsx'),
  'utf-8',
)

describe('stocks/[ticker] Depth toggle removed', () => {
  it('does not import the fabricated DepthChart component', () => {
    expect(pageSrc).not.toMatch(/from\s+['"]@\/components\/stocks\/DepthChart['"]/)
    expect(pageSrc).not.toContain('DepthChart')
  })

  it('does not maintain a chartView state with a depth branch', () => {
    expect(pageSrc).not.toMatch(/chartView/)
    expect(pageSrc).not.toMatch(/'depth'/)
  })

  it('does not render a Price/Depth toggle row', () => {
    expect(pageSrc).not.toMatch(/setChartView/)
    expect(pageSrc).not.toMatch(/>Depth<\/button>/)
  })

  it('removes the fabricated AMM impact curve modules from the tree', () => {
    expect(existsSync(resolve(__dirname, '..', '..', '..', '..', '..', 'components', 'stocks', 'DepthChart.tsx'))).toBe(false)
    expect(existsSync(resolve(__dirname, '..', '..', '..', '..', '..', 'lib', 'computeDepthCurve.ts'))).toBe(false)
  })
})
