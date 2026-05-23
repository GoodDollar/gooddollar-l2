/**
 * Task 0040 — `useLandingImpact` defaults to `{ status: 'unknown' }` until
 * a real impact-metrics feed is wired. Locking the default shape here
 * prevents future regressions where the landing page UI silently
 * starts presenting fabricated literals as live counters again.
 */
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLandingImpact } from '../useLandingImpact'

describe('useLandingImpact', () => {
  it('defaults to status: "unknown" with no metric fields populated', () => {
    const { result } = renderHook(() => useLandingImpact())
    expect(result.current.status).toBe('unknown')
    expect(result.current.ubiDistributedUsd).toBeUndefined()
    expect(result.current.claimers).toBeUndefined()
    expect(result.current.totalSwaps).toBeUndefined()
    expect(result.current.updatedAtMs).toBeUndefined()
  })

  it('returns a stable object reference across re-renders (memoised)', () => {
    const { result, rerender } = renderHook(() => useLandingImpact())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
