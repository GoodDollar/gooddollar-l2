/**
 * Tests for EIP155RequestHandlerUtil - CVE-4 Security Fix Validation
 *
 * These tests verify that the transaction validation layer properly
 * prevents the security vulnerabilities described in GOO-1733.
 */

import { describe, it, expect } from 'vitest'
import { parseEther } from 'viem'
import {
  validateTransaction,
  isWhitelistedContract,
  addToWhitelist,
  getSecurityConfig,
  MAX_GAS_LIMIT,
  MAX_ETH_VALUE,
  WHITELISTED_CONTRACTS,
} from '../EIP155RequestHandlerUtil'
import { CONTRACTS } from '../chain'

const TEST_USER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const

describe('EIP155RequestHandlerUtil Security Validation', () => {

  describe('validateTransaction', () => {
    it('should approve low-risk transactions to whitelisted contracts', async () => {
      const lowRiskTransaction = {
        to: CONTRACTS.GoodDollarToken,
        value: parseEther('0.001'), // Small value
        gas: 50_000n, // Reasonable gas
        data: '0xa9059cbb' as const,
      }

      const result = await validateTransaction(lowRiskTransaction, TEST_USER_ADDRESS)

      expect(result.approved).toBe(true)
      expect(result.risk.level).toBe('low')
      expect(result.error).toBeUndefined()
    })

    it('should flag high ETH values as high risk', async () => {
      const highValueTransaction = {
        to: '0x1234567890123456789012345678901234567890' as const,
        value: parseEther('5.0'), // Above MAX_ETH_VALUE (1 ETH)
        gas: 21_000n,
        data: '0x' as const,
      }

      const result = await validateTransaction(highValueTransaction, TEST_USER_ADDRESS)

      expect(result.approved).toBe(false)
      expect(result.risk.level).toBe('high')
      expect(result.risk.reasons.some(r => r.includes('High ETH value'))).toBe(true)
      expect(result.risk.warnings).toContain('This transaction involves a large ETH transfer')
    })

    it('should flag excessive gas limits as high risk', async () => {
      const highGasTransaction = {
        to: CONTRACTS.GoodDollarToken,
        value: 0n,
        gas: 750_000n, // Above MAX_GAS_LIMIT (500k)
        data: '0xa9059cbb' as const,
      }

      const result = await validateTransaction(highGasTransaction, TEST_USER_ADDRESS)

      expect(result.approved).toBe(false)
      expect(result.risk.level).toBe('high')
      expect(result.risk.reasons).toContain('Excessive gas limit: 750000')
    })

    it('should flag unverified contracts as medium risk', async () => {
      const unverifiedContractTransaction = {
        to: '0x9999999999999999999999999999999999999999' as const,
        value: parseEther('0.1'),
        gas: 100_000n,
        data: '0xa9059cbb' as const,
      }

      const result = await validateTransaction(unverifiedContractTransaction, TEST_USER_ADDRESS)

      expect(result.approved).toBe(false) // Not approved because contract not whitelisted
      expect(result.risk.level).toBe('medium')
      expect(result.risk.reasons).toContain('Interacting with unverified contract')
      expect(result.risk.contractVerified).toBe(false)
    })

    it('should flag dangerous method signatures', async () => {
      const dangerousTransaction = {
        to: '0x9999999999999999999999999999999999999999' as const,
        value: 0n,
        gas: 100_000n,
        data: '0x095ea7b3000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000ff' as const, // approve with large amount
      }

      const result = await validateTransaction(dangerousTransaction, TEST_USER_ADDRESS)

      expect(result.risk.level).toBe('medium')
      expect(result.risk.reasons).toContain('Transaction involves token transfers or approvals')
      expect(result.risk.warnings).toContain('Carefully verify the recipient address and amounts')
    })

    it('should escalate to critical risk with multiple factors', async () => {
      const criticalTransaction = {
        to: '0x9999999999999999999999999999999999999999' as const,
        value: parseEther('2.0'), // High value
        gas: 600_000n, // High gas
        data: '0x095ea7b3000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000ff' as const, // dangerous method
      }

      const result = await validateTransaction(criticalTransaction, TEST_USER_ADDRESS)

      expect(result.approved).toBe(false)
      expect(result.risk.level).toBe('critical')
      expect(result.risk.warnings).toContain('CRITICAL: Multiple high-risk factors detected')
      expect(result.risk.reasons.length).toBeGreaterThan(2)
    })

    it('should reject transactions with invalid recipient address', async () => {
      const invalidTransaction = {
        to: '0xinvalid' as any,
        value: parseEther('0.1'),
        gas: 21_000n,
        data: '0x' as const,
      }

      const result = await validateTransaction(invalidTransaction, TEST_USER_ADDRESS)

      expect(result.approved).toBe(false)
      expect(result.risk.level).toBe('critical')
      expect(result.error).toBe('Invalid recipient address')
    })
  })

  describe('Contract Whitelisting', () => {
    it('should identify whitelisted contracts', () => {
      expect(isWhitelistedContract(CONTRACTS.GoodDollarToken)).toBe(true)
      expect(isWhitelistedContract(CONTRACTS.SwapPoolGdWeth)).toBe(true)
      expect(isWhitelistedContract('0x9999999999999999999999999999999999999999' as const)).toBe(false)
    })

    it('should allow adding contracts to whitelist', () => {
      const newContract = '0x1111111111111111111111111111111111111111' as const
      expect(isWhitelistedContract(newContract)).toBe(false)

      addToWhitelist(newContract)
      expect(isWhitelistedContract(newContract)).toBe(true)
    })

    it('should not add invalid addresses to whitelist', () => {
      const initialSize = WHITELISTED_CONTRACTS.size
      addToWhitelist('0xinvalid' as any)
      expect(WHITELISTED_CONTRACTS.size).toBe(initialSize)
    })
  })

  describe('Security Configuration', () => {
    it('should provide current security limits', () => {
      const config = getSecurityConfig()

      expect(config.maxGasLimit).toBe(MAX_GAS_LIMIT)
      expect(config.maxEthValue).toBe(MAX_ETH_VALUE)
      expect(config.whitelistedContracts).toContain(CONTRACTS.GoodDollarToken)
      expect(Array.isArray(config.whitelistedContracts)).toBe(true)
    })

    it('should have reasonable security limits', () => {
      const config = getSecurityConfig()

      // Gas limit should be reasonable for complex transactions but not excessive
      expect(config.maxGasLimit).toBeGreaterThan(100_000n)
      expect(config.maxGasLimit).toBeLessThan(1_000_000n)

      // ETH value limit should allow normal transactions but prevent large drains
      expect(config.maxEthValue).toBeGreaterThan(parseEther('0.1'))
      expect(config.maxEthValue).toBeLessThan(parseEther('10'))
    })
  })

  describe('CVE-4 Specific Vulnerability Tests', () => {
    it('should prevent unlimited gas limit attacks', async () => {
      // Simulate malicious dApp trying to drain wallet with gas griefing
      const gasGriefingAttack = {
        to: '0x9999999999999999999999999999999999999999' as const,
        value: 0n,
        gas: 10_000_000n, // Extremely high gas limit
        data: '0xa9059cbb' as const,
      }

      const result = await validateTransaction(gasGriefingAttack, TEST_USER_ADDRESS)

      expect(result.approved).toBe(false)
      expect(result.risk.level).toBe('critical')
      expect(result.risk.reasons.some(r => r.includes('Excessive gas limit'))).toBe(true)
    })

    it('should prevent large value transfers to unverified contracts', async () => {
      // Simulate malicious dApp trying to steal large ETH amounts
      const valueDrainAttack = {
        to: '0x9999999999999999999999999999999999999999' as const,
        value: parseEther('10'), // Large amount
        gas: 21_000n,
        data: '0x' as const,
      }

      const result = await validateTransaction(valueDrainAttack, TEST_USER_ADDRESS)

      expect(result.approved).toBe(false)
      expect(result.risk.level).toBe('high')
      expect(result.risk.warnings.some(w => w.includes('large ETH transfer'))).toBe(true)
    })

    it('should require user confirmation for medium/high risk transactions', async () => {
      const riskyTransaction = {
        to: '0x9999999999999999999999999999999999999999' as const,
        value: parseEther('0.5'),
        gas: 300_000n,
        data: '0xa9059cbb' as const,
      }

      const result = await validateTransaction(riskyTransaction, TEST_USER_ADDRESS)

      // Should not be auto-approved, requiring user interaction
      expect(result.approved).toBe(false)
      expect(['medium', 'high', 'critical']).toContain(result.risk.level)
    })
  })
})