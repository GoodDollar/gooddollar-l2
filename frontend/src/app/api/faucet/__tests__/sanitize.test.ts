/**
 * Unit tests for the faucet error/response sanitization helpers.
 *
 * These pin the contract introduced in iter-33 task 0046: the public
 * /api/faucet endpoint must never echo viem/internal details in its
 * generic 500 response, and the success log must redact the full
 * recipient address.
 */
import { describe, it, expect } from 'vitest'

import {
  generateErrorId,
  sanitizeFaucetError,
  shortenAddress,
} from '../sanitize'

describe('sanitizeFaucetError', () => {
  const FIXED_MSG = /please try again later/i

  // A representative viem-style error message: includes version, from, data,
  // docs URL — the exact shape we observed leaking on the live endpoint.
  const RAW_VIEM_ERROR = [
    'The contract function "claim" reverted with the following reason:',
    'execution reverted: insufficient liquidity',
    '',
    'Contract Call:',
    '  address:  0xabcdef0123456789abcdef0123456789abcdef01',
    '  function: claim(address recipient)',
    '  args:        (0xffffffffffffffffffffffffffffffffffffffff)',
    '  sender:   0x1111111111111111111111111111111111111111',
    '',
    'Docs: https://viem.sh/docs/contract/writeContract',
    'Details: revert',
    'Version: viem@2.21.0',
  ].join('\n')

  it('returns the fixed user-safe message for any input', () => {
    expect(sanitizeFaucetError(RAW_VIEM_ERROR)).toMatch(FIXED_MSG)
    expect(sanitizeFaucetError('')).toMatch(FIXED_MSG)
    expect(sanitizeFaucetError('boom')).toMatch(FIXED_MSG)
  })

  it('never contains any 0x-prefixed 40-char hex address', () => {
    const out = sanitizeFaucetError(RAW_VIEM_ERROR)
    expect(out).not.toMatch(/0x[0-9a-fA-F]{40}/)
  })

  it('does not leak the "viem" library name', () => {
    expect(sanitizeFaucetError(RAW_VIEM_ERROR)).not.toMatch(/viem/i)
  })

  it('does not leak the word "version"', () => {
    expect(sanitizeFaucetError(RAW_VIEM_ERROR)).not.toMatch(/version/i)
  })

  it('does not leak the "from" or "sender" labels', () => {
    const out = sanitizeFaucetError(RAW_VIEM_ERROR)
    expect(out).not.toMatch(/from:/i)
    expect(out).not.toMatch(/sender:/i)
  })

  it('does not leak any RPC URL', () => {
    const withUrl = `failed POSTing to https://eth.example.com:8545/rpc — ${RAW_VIEM_ERROR}`
    const out = sanitizeFaucetError(withUrl)
    expect(out).not.toMatch(/https?:\/\//)
  })

  it('does not leak transaction calldata', () => {
    const withData =
      RAW_VIEM_ERROR +
      '\n  data:        0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    const out = sanitizeFaucetError(withData)
    // long hex blobs (data fields) must not appear
    expect(out).not.toMatch(/0x[0-9a-fA-F]{20,}/)
  })

  it('is robust to non-string input', () => {
    // The route catches `unknown` errors, so the helper should not throw
    // even if called with a non-string.
    expect(sanitizeFaucetError(undefined)).toMatch(FIXED_MSG)
    expect(sanitizeFaucetError(null)).toMatch(FIXED_MSG)
    expect(sanitizeFaucetError(42)).toMatch(FIXED_MSG)
  })
})

describe('generateErrorId', () => {
  it('returns exactly 8 lowercase hex characters', () => {
    const id = generateErrorId()
    expect(id).toMatch(/^[0-9a-f]{8}$/)
  })

  it('returns different ids across calls (effectively unique)', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateErrorId())
    }
    // 100 draws from 2^32 space — collisions are astronomically unlikely
    expect(ids.size).toBe(100)
  })
})

describe('shortenAddress', () => {
  it('returns first 6 + ellipsis + last 4 chars for a valid address', () => {
    expect(
      shortenAddress('0x1234567890abcdef1234567890abcdef12345678'),
    ).toBe('0x1234…5678')
  })

  it('preserves the original casing in the visible segments', () => {
    expect(
      shortenAddress('0xABCDEF0123456789abcdef0123456789ABCDEF01'),
    ).toBe('0xABCD…EF01')
  })

  it('returns the input unchanged when it is too short to shorten', () => {
    expect(shortenAddress('0x123')).toBe('0x123')
    expect(shortenAddress('')).toBe('')
  })

  it('returns "unknown" when passed null/undefined/non-string', () => {
    expect(shortenAddress(undefined)).toBe('unknown')
    expect(shortenAddress(null)).toBe('unknown')
    expect(shortenAddress(0x123)).toBe('unknown')
  })
})
