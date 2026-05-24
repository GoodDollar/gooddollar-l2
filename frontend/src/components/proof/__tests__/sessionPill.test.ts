import { describe, it, expect } from 'vitest'
import { sessionPillClass } from '../sessionPill'

describe('sessionPillClass', () => {
  it('returns green styling for "open" and "Open"', () => {
    expect(sessionPillClass('open')).toMatch(/bg-green/)
    expect(sessionPillClass('Open')).toMatch(/bg-green/)
    expect(sessionPillClass('OPEN')).toMatch(/bg-green/)
  })

  it('returns yellow styling for "premarket" and "AfterHours"', () => {
    expect(sessionPillClass('premarket')).toMatch(/bg-yellow/)
    expect(sessionPillClass('PreMarket')).toMatch(/bg-yellow/)
    expect(sessionPillClass('pre-market')).toMatch(/bg-yellow/)
    expect(sessionPillClass('AfterHours')).toMatch(/bg-yellow/)
    expect(sessionPillClass('after-hours')).toMatch(/bg-yellow/)
  })

  it('returns red styling for "Halted"', () => {
    expect(sessionPillClass('Halted')).toMatch(/bg-red/)
    expect(sessionPillClass('halted')).toMatch(/bg-red/)
  })

  it('returns neutral gray for "closed" and unknown values', () => {
    expect(sessionPillClass('closed')).toMatch(/bg-white\/5/)
    expect(sessionPillClass('Closed')).toMatch(/bg-white\/5/)
    expect(sessionPillClass('enum(7)')).toMatch(/bg-white\/5/)
  })
})
