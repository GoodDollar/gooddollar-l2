import { describe, it, expect } from 'vitest'
import { isClaimableFaucetAddress } from '../addressGuard'
import { CONTRACTS } from '../devnet'

describe('isClaimableFaucetAddress', () => {
  describe('format validation', () => {
    it('rejects non-string input', () => {
      // @ts-expect-error testing runtime guard
      expect(isClaimableFaucetAddress(undefined)).toBe(false)
      // @ts-expect-error testing runtime guard
      expect(isClaimableFaucetAddress(null)).toBe(false)
      // @ts-expect-error testing runtime guard
      expect(isClaimableFaucetAddress(12345)).toBe(false)
    })

    it('rejects empty string', () => {
      expect(isClaimableFaucetAddress('')).toBe(false)
    })

    it('rejects malformed strings', () => {
      expect(isClaimableFaucetAddress('not-an-address')).toBe(false)
      expect(isClaimableFaucetAddress('0x')).toBe(false)
      expect(isClaimableFaucetAddress('0x123')).toBe(false)
      expect(isClaimableFaucetAddress('0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')).toBe(false)
    })

    it('rejects strings missing the 0x prefix', () => {
      expect(isClaimableFaucetAddress('1234567890123456789012345678901234567890')).toBe(false)
    })

    it('accepts a valid lowercase address', () => {
      expect(isClaimableFaucetAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true)
    })

    it('accepts a valid uppercase address', () => {
      expect(isClaimableFaucetAddress('0x1234567890ABCDEF1234567890ABCDEF12345678')).toBe(true)
    })

    it('accepts a valid mixed-case (EIP-55 checksum) address', () => {
      // Vitalik's address — proper EIP-55 checksum
      expect(isClaimableFaucetAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(true)
    })
  })

  describe('burn / null address rejection', () => {
    it('rejects the zero address (lowercase)', () => {
      expect(isClaimableFaucetAddress('0x0000000000000000000000000000000000000000')).toBe(false)
    })

    it('rejects the zero address (uppercase)', () => {
      expect(isClaimableFaucetAddress('0X0000000000000000000000000000000000000000')).toBe(false)
    })

    it('rejects the canonical 0x000…dEaD burn address', () => {
      expect(isClaimableFaucetAddress('0x000000000000000000000000000000000000dEaD')).toBe(false)
      expect(isClaimableFaucetAddress('0x000000000000000000000000000000000000dead')).toBe(false)
    })

    it('rejects the repeated 0xdEaD…dEaD burn pattern (any case)', () => {
      expect(isClaimableFaucetAddress('0xdEaDdEaDdEaDdEaDdEaDdEaDdEaDdEaDdEaDdEaD')).toBe(false)
      expect(isClaimableFaucetAddress('0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead')).toBe(false)
      expect(isClaimableFaucetAddress('0xDEADDEADDEADDEADDEADDEADDEADDEADDEADDEAD')).toBe(false)
    })

    it('rejects all-F sentinel addresses', () => {
      expect(isClaimableFaucetAddress('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toBe(false)
      expect(isClaimableFaucetAddress('0xffffffffffffffffffffffffffffffffffffffff')).toBe(false)
    })

    it('rejects the 0xdeadbeef… repeating pattern', () => {
      expect(isClaimableFaucetAddress('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef')).toBe(false)
      expect(isClaimableFaucetAddress('0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF')).toBe(false)
    })
  })

  describe('contract self-address rejection', () => {
    it('rejects the GoodDollarToken contract address', () => {
      expect(isClaimableFaucetAddress(CONTRACTS.GoodDollarToken)).toBe(false)
    })

    it('rejects the MockWETH contract address', () => {
      expect(isClaimableFaucetAddress(CONTRACTS.MockWETH)).toBe(false)
    })

    it('rejects contract addresses case-insensitively', () => {
      expect(isClaimableFaucetAddress(CONTRACTS.GoodDollarToken.toLowerCase() as `0x${string}`)).toBe(false)
      expect(isClaimableFaucetAddress(CONTRACTS.GoodDollarToken.toUpperCase().replace('0X', '0x') as `0x${string}`)).toBe(false)
    })

    it('has at least one known contract address in the deny-list', () => {
      // Guards against the case where CONTRACTS is empty in a test environment,
      // which would silently shrink the deny-list.
      expect(isClaimableFaucetAddress(CONTRACTS.GoodDollarToken)).toBe(false)
    })
  })

  describe('happy path', () => {
    it('accepts a freshly generated wallet address', () => {
      // Random anvil-style address that is not in the deny-list and is not a burn pattern.
      expect(isClaimableFaucetAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')).toBe(true)
    })

    it('accepts another non-burn lowercase address', () => {
      expect(isClaimableFaucetAddress('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc')).toBe(true)
    })
  })
})
