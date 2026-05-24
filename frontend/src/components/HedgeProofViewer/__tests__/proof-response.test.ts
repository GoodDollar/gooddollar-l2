import { describe, expect, it } from 'vitest'

import {
  copyForResponse,
  type ProofResponse,
} from '../proof-response'

/**
 * Task 0061 — `copyForResponse` must speak per-surface for the failing
 * branches (`engine_down`, `engine_error`). The /latest viewer keeps
 * its existing wording verbatim; the per-receipt viewer drops "latest"
 * and "pointer" in favour of receipt-aware copy. Surface-neutral
 * branches stay identical for both surfaces.
 */
describe('copyForResponse — per-surface error copy (#0061)', () => {
  describe('engine_down branch', () => {
    const envelope: ProofResponse = {
      status: 'engine_down',
      reason: 'unreachable',
    }

    it('latest surface keeps the historical "latest proof pointer" copy verbatim', () => {
      const copy = copyForResponse(envelope, 'latest')
      expect(copy.title).toBe('Hedge engine unreachable')
      expect(copy.detail).toBe(
        'Could not fetch the latest proof pointer from the hedge engine.',
      )
    })

    it('receipt surface drops "latest" and "pointer" and references "this receipt"', () => {
      const copy = copyForResponse(envelope, 'receipt')
      expect(copy.title).toBe('Hedge engine unreachable')
      expect(copy.detail.toLowerCase()).not.toContain('latest')
      expect(copy.detail.toLowerCase()).not.toContain('pointer')
      expect(copy.detail.toLowerCase()).toContain('this receipt')
    })

    it('defaults to the latest copy when no surface is supplied', () => {
      const explicit = copyForResponse(envelope, 'latest')
      const implicit = copyForResponse(envelope)
      expect(implicit).toEqual(explicit)
    })
  })

  describe('engine_error branch', () => {
    const envelope: ProofResponse = {
      status: 'engine_error',
      reason: 'upstream',
      httpStatus: 503,
    }

    it('latest surface keeps the historical "Proof pointer endpoint returned HTTP" copy verbatim', () => {
      const copy = copyForResponse(envelope, 'latest')
      expect(copy.title).toBe('Hedge engine returned an error')
      expect(copy.detail).toBe('Proof pointer endpoint returned HTTP 503.')
    })

    it('receipt surface drops "pointer" and references the receipt endpoint', () => {
      const copy = copyForResponse(envelope, 'receipt')
      expect(copy.title).toBe('Hedge engine returned an error')
      expect(copy.detail.toLowerCase()).not.toContain('pointer')
      expect(copy.detail).toContain('Receipt')
      expect(copy.detail).toContain('503')
    })

    it('defaults to the latest copy when no surface is supplied', () => {
      const explicit = copyForResponse(envelope, 'latest')
      const implicit = copyForResponse(envelope)
      expect(implicit).toEqual(explicit)
    })
  })

  describe('surface-neutral branches', () => {
    const cases: ProofResponse[] = [
      { status: 'no_proof' },
      { status: 'unreadable', reason: 'bad json' },
      { status: 'forbidden', reason: 'escaped dir' },
      { status: 'missing', reason: 'enoent' },
      { status: 'invalid_id', reason: 'malformed' },
      {
        status: 'ok',
        markdown: '# title',
        pointer: { path: 'p', timestamp: 0, summary: 's' },
      },
    ]

    for (const envelope of cases) {
      it(`returns identical copy for both surfaces on status="${envelope.status}"`, () => {
        const latest = copyForResponse(envelope, 'latest')
        const receipt = copyForResponse(envelope, 'receipt')
        expect(receipt).toEqual(latest)
      })
    }
  })
})
