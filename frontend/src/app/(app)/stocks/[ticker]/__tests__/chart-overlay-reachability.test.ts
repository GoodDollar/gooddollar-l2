import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Regression guard for task 0065: the `DemoChartOverlay` pill must not lie on
// top of the chart toolbar row. The page must host the overlay inside an inner
// `data-chart-overlay-host` wrapper that surrounds only the chart canvas, so
// the timeframe button row stays pointer-event-reachable.
//
// We check the source text rather than mounting the (heavy) page component:
// the assertion is structural, not behavioural, and reading the source keeps
// the test fast and free of next/navigation, wagmi, and lightweight-charts
// dependencies.

const src = readFileSync(
  resolve(__dirname, '..', 'page.tsx'),
  'utf-8',
)

describe('stocks/[ticker] chart overlay reachability', () => {
  it('hosts DemoChartOverlay inside a data-chart-overlay-host wrapper', () => {
    expect(src).toContain('data-chart-overlay-host')
    const overlayMatches = src.match(/<DemoChartOverlay\b[^>]*\/?>/g) ?? []
    expect(overlayMatches.length).toBeGreaterThan(0)
    for (const tag of overlayMatches) {
      const idx = src.indexOf(tag)
      const before = src.slice(0, idx)
      const lastHost = before.lastIndexOf('data-chart-overlay-host')
      const lastToolbar = before.lastIndexOf('flex items-center justify-between mb-3')
      expect(lastHost).toBeGreaterThan(-1)
      expect(lastHost).toBeGreaterThan(lastToolbar)
    }
  })

  it('does not place DemoChartOverlay as a sibling of the timeframe toolbar', () => {
    const toolbarIdx = src.indexOf('{chartView === \'price\' && TIMEFRAMES.map')
    expect(toolbarIdx).toBeGreaterThan(-1)
    const toolbarRow = src.indexOf('flex items-center justify-between mb-3', Math.max(0, toolbarIdx - 400))
    expect(toolbarRow).toBeGreaterThan(-1)
    const before = src.slice(0, toolbarRow)
    const stretch = src.slice(before.lastIndexOf('<div'), toolbarRow + 800)
    expect(stretch).not.toContain('<DemoChartOverlay')
  })
})
