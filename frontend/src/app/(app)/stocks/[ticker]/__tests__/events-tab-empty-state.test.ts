import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Regression guard for task 0068: the Events tab on the stocks detail page
// must not synthesize "Earnings call" / "Dividend ex-date" rows from
// `now() + N days`. No real corporate-actions / earnings calendar feed is
// wired in this lane, so the tab must render an honest empty state — same
// pattern as the News panel fix (task 0044).

const pageSrc = readFileSync(
  resolve(__dirname, '..', 'page.tsx'),
  'utf-8',
)

describe('stocks/[ticker] Events tab honest empty state', () => {
  it('does not synthesize event dates from now() + N days', () => {
    expect(pageSrc).not.toContain('formatEventDate')
    expect(pageSrc).not.toContain('eventTimeline')
  })

  it('does not render fabricated Earnings call or Dividend ex-date rows', () => {
    expect(pageSrc).not.toMatch(/Earnings call/)
    expect(pageSrc).not.toMatch(/Dividend ex-date/)
  })

  it('renders the honest empty-state copy when the Events tab is active', () => {
    const eventsSectionIdx = pageSrc.indexOf("{activeTab === 'events' &&")
    expect(eventsSectionIdx).toBeGreaterThan(-1)
    const section = pageSrc.slice(eventsSectionIdx, eventsSectionIdx + 1_200)
    expect(section).toMatch(/Events feed coming soon/)
    expect(section).toMatch(/none of this is fabricated/i)
  })
})
