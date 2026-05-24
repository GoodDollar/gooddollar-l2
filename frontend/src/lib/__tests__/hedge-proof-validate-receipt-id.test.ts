import { describe, expect, it } from 'vitest'

import { validateReceiptId } from '../hedge-proof-validate-receipt-id'

/**
 * Task 0062 — receipt-id validator: structural sanity gate before any
 * engine round-trip. Reject empty/whitespace, control + format
 * unicode (null bytes, ZWSP, BOM, embedded tabs/newlines), and ids
 * longer than 256 chars. Engine remains the source of truth for
 * whether a well-formed id corresponds to a real receipt.
 */
describe('validateReceiptId', () => {
  it('accepts a slug-shaped id verbatim', () => {
    expect(validateReceiptId('abc-123_xyz')).toEqual({
      ok: true,
      id: 'abc-123_xyz',
    })
  })

  it('accepts a 256-char id at the upper bound', () => {
    const id = 'a'.repeat(256)
    expect(validateReceiptId(id)).toEqual({ ok: true, id })
  })

  it('trims surrounding whitespace and accepts the trimmed value', () => {
    expect(validateReceiptId('  abc  ')).toEqual({ ok: true, id: 'abc' })
  })

  it('rejects an empty string with a whitespace-only reason', () => {
    const res = validateReceiptId('')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/empty.*whitespace|whitespace/i)
  })

  it('rejects a pure-whitespace string with a whitespace-only reason', () => {
    const res = validateReceiptId('   ')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/empty.*whitespace|whitespace/i)
  })

  it('rejects a null byte with an "invalid characters" reason', () => {
    const res = validateReceiptId('\x00')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/invalid characters/i)
  })

  it('rejects newlines with an "invalid characters" reason', () => {
    const res = validateReceiptId('\n\n')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/invalid characters/i)
  })

  it('rejects an embedded tab with an "invalid characters" reason', () => {
    const res = validateReceiptId('abc\tdef')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/invalid characters/i)
  })

  it('rejects a zero-width space with an "invalid characters" reason', () => {
    const res = validateReceiptId('abc\u200Bdef')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/invalid characters/i)
  })

  it('rejects a BOM with an "invalid characters" reason', () => {
    const res = validateReceiptId('\uFEFFabc')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/invalid characters/i)
  })

  it('rejects ids longer than 256 chars with a "too long" reason', () => {
    const res = validateReceiptId('a'.repeat(257))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/too long/i)
  })

  it('treats null/undefined inputs as empty', () => {
    const a = validateReceiptId(null as unknown as string)
    const b = validateReceiptId(undefined as unknown as string)
    expect(a.ok).toBe(false)
    expect(b.ok).toBe(false)
  })
})
