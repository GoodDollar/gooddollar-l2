import { describe, it, expect } from 'vitest'
import { getSyntheticStockHeader } from '../getSyntheticStockHeader'
import type { MarketSession } from '../marketHours'

function session(over: Partial<MarketSession>): MarketSession {
  return {
    label: 'Market Closed',
    state: 'closed',
    color: 'text-gray-400',
    dotColor: 'bg-gray-400',
    nextEventLabel: 'Opens Mon',
    nextEventDate: null,
    ...over,
  }
}

describe('getSyntheticStockHeader — task 0022', () => {
  it('A: weekend close → trade 24/7 pill, subhead mentions Opens Mon, no bare "Market Closed" label', () => {
    const out = getSyntheticStockHeader(session({ state: 'closed', nextEventLabel: 'Opens Mon' }))
    expect(out.pillLabel).toBe('Synthetic · trade 24/7')
    expect(out.pillTone).toBe('subdued')
    expect(out.subheadText).toMatch(/24\/7/i)
    expect(out.subheadText).toMatch(/underlying/i)
    expect(out.subheadText).toMatch(/Opens Mon/i)
    // The bare "Market Closed" badge label MUST NOT appear as a standalone
    // chip-style phrase in the new subhead — that was the old contradiction.
    expect(out.pillLabel).not.toMatch(/Market Closed/i)
  })

  it('B: open → live pill, subhead does not mention "until Mon"', () => {
    const out = getSyntheticStockHeader(session({
      state: 'open',
      label: 'Market Open',
      nextEventLabel: 'Closes 4:00 PM ET',
    }))
    expect(out.pillLabel).toBe('Live · oracle ticking')
    expect(out.pillTone).toBe('live')
    expect(out.subheadText).toMatch(/24\/7/i)
    expect(out.subheadText).toMatch(/oracle is publishing live prices/i)
    expect(out.subheadText).not.toMatch(/until Mon/i)
  })

  it('C: pre-market → subhead mentions pre-market', () => {
    const out = getSyntheticStockHeader(session({
      state: 'pre-market',
      label: 'Pre-Market',
      nextEventLabel: 'Opens 9:30 AM ET',
    }))
    expect(out.pillLabel).toBe('Synthetic · trade 24/7')
    expect(out.subheadText).toMatch(/pre-market/i)
  })

  it('D: after-hours → subhead mentions after-hours', () => {
    const out = getSyntheticStockHeader(session({
      state: 'after-hours',
      label: 'After-Hours',
      nextEventLabel: 'Closes 8:00 PM ET',
    }))
    expect(out.pillLabel).toBe('Synthetic · trade 24/7')
    expect(out.subheadText).toMatch(/after-hours/i)
  })

  it('InfoBanner description mirrors the subhead — never argues with the hero', () => {
    const closed = getSyntheticStockHeader(session({ state: 'closed' }))
    expect(closed.infoBannerDescription).toMatch(/24\/7/i)
    expect(closed.infoBannerDescription).toMatch(/underlying/i)

    const open = getSyntheticStockHeader(session({ state: 'open' }))
    expect(open.infoBannerDescription).toMatch(/oracle is updating live/i)
    expect(open.infoBannerDescription).not.toMatch(/closed/i)
  })
})
