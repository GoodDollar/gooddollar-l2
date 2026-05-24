import { describe, expect, it } from 'vitest'

import { LANE1_RUNBOOK_HREF, LANE1_STATUS_HREF } from '../lane1Links'

describe('lane1Links', () => {
  it('LANE1_STATUS_HREF points at the in-app /lane1 route', () => {
    expect(LANE1_STATUS_HREF).toBe('/lane1')
  })

  it('LANE1_RUNBOOK_HREF is an in-app route, not a public GitHub URL (task 0065)', () => {
    expect(LANE1_RUNBOOK_HREF.startsWith('/')).toBe(true)
    expect(LANE1_RUNBOOK_HREF).not.toMatch(/^https?:\/\/github\.com\//)
  })

  it('LANE1_RUNBOOK_HREF resolves to the in-app runbook page so the recovery link cannot 404 (task 0065)', () => {
    expect(LANE1_RUNBOOK_HREF).toBe('/lane1/runbook')
  })
})
