import { describe, it, expect } from 'vitest'
import { sanitizeNumericInput, formatAmount, compactAmount, formatUsdValue } from '../format'

describe('sanitizeNumericInput', () => {
  it('strips non-numeric characters', () => {
    expect(sanitizeNumericInput('abc123')).toBe('123')
    expect(sanitizeNumericInput('!@#$%')).toBe('')
    expect(sanitizeNumericInput('12.34.56')).toBe('12.3456')
  })

  it('limits to 20 characters', () => {
    expect(sanitizeNumericInput('123456789012345678901234')).toHaveLength(20)
  })

  it('strips leading zeros from integer inputs', () => {
    expect(sanitizeNumericInput('007')).toBe('7')
    expect(sanitizeNumericInput('000123')).toBe('123')
    expect(sanitizeNumericInput('00')).toBe('0')
    expect(sanitizeNumericInput('0')).toBe('0')
  })

  it('preserves valid zero-decimal patterns', () => {
    expect(sanitizeNumericInput('0.5')).toBe('0.5')
    expect(sanitizeNumericInput('0.001')).toBe('0.001')
    expect(sanitizeNumericInput('0.')).toBe('0.')
  })

  it('normalizes leading zeros before decimal', () => {
    expect(sanitizeNumericInput('00.5')).toBe('0.5')
    expect(sanitizeNumericInput('000.123')).toBe('0.123')
  })

  it('handles bare decimal point', () => {
    const result = sanitizeNumericInput('.')
    expect(result === '0.' || result === '.').toBeTruthy()
  })

  it('handles empty input', () => {
    expect(sanitizeNumericInput('')).toBe('')
  })

  it('passes through normal numbers', () => {
    expect(sanitizeNumericInput('123')).toBe('123')
    expect(sanitizeNumericInput('1.5')).toBe('1.5')
    expect(sanitizeNumericInput('999999')).toBe('999999')
  })
})

describe('formatAmount', () => {
  it('formats zero', () => {
    expect(formatAmount(0)).toBe('0')
  })

  it('formats large numbers with abbreviations', () => {
    expect(formatAmount(1500000)).toBe('1.5M')
    expect(formatAmount(2500000000)).toBe('2.5B')
    expect(formatAmount(1200000000000)).toBe('1.2T')
  })

  it('formats numbers with thousands separators', () => {
    expect(formatAmount(1234)).toBe('1,234')
    expect(formatAmount(999999)).toBe('999,999')
  })

  it('formats small decimals', () => {
    expect(formatAmount(0.123456)).toBe('0.123456')
    expect(formatAmount(1.5)).toBe('1.5')
  })

  // Task 0066: formatAmount must never return "0" for a non-zero numeric input.
  // Previously, formatAmount(1e-12) returned "0" because num.toFixed(6) is "0.000000",
  // which made the G$/USDC pool spot price (~1e-12 after broken /1e18 derivation)
  // render as "1 G$ = 0 USDC". After the fix the helper falls back to compact
  // scientific notation for sub-micro values so the UI never silently rounds a
  // real on-chain value to a misleading literal zero.
  describe('sub-micro values (decimal-mismatch defence)', () => {
    it('returns non-zero representation for 1e-12 (the G$/USDC raw spotPrice ratio)', () => {
      const result = formatAmount(1e-12)
      expect(result).not.toBe('0')
      expect(result).not.toBe('0.000000')
      // Should look like "1.0e-12" or similar (digits, optional dot, "e", digits).
      expect(result).toMatch(/^-?\d+(\.\d+)?e-?\d+$/i)
    })

    it('returns non-zero representation for 1e-9', () => {
      const result = formatAmount(1e-9)
      expect(result).not.toBe('0')
      expect(result).toMatch(/^-?\d+(\.\d+)?e-?\d+$/i)
    })

    it('returns non-zero representation for a realistic G$/USDC ratio (~9.5e-7)', () => {
      const result = formatAmount(9.5e-7)
      expect(result).not.toBe('0')
      expect(result).toMatch(/^-?\d+(\.\d+)?e-?\d+$/i)
    })

    it('preserves sign for negative sub-micro values', () => {
      const result = formatAmount(-1e-10)
      expect(result).not.toBe('0')
      expect(result.startsWith('-')).toBe(true)
    })

    it('still rounds exact zero to "0"', () => {
      expect(formatAmount(0)).toBe('0')
    })

    it('handles NaN as "0" (unchanged behaviour)', () => {
      expect(formatAmount(NaN)).toBe('0')
    })

    it('does not regress the [1e-6, 1) range', () => {
      // 1e-6 itself should still use the fixed-decimal branch.
      expect(formatAmount(0.000001)).toBe('0.000001')
      // 0.5 should still use the fixed-decimal branch.
      expect(formatAmount(0.5)).toBe('0.5')
    })

    it('does not regress the abbreviated range', () => {
      expect(formatAmount(1_500_000)).toBe('1.5M')
      expect(formatAmount(1_234)).toBe('1,234')
    })
  })
})

describe('compactAmount', () => {
  it('returns full format for short numbers', () => {
    expect(compactAmount(1234, 6)).toBe('1,234')
    expect(compactAmount(42.5, 6)).toBe('42.5')
  })

  it('abbreviates numbers that exceed maxChars', () => {
    const result = compactAmount(997000, 6)
    expect(result).toBe('997K')
  })

  it('abbreviates large numbers', () => {
    expect(compactAmount(1500000, 8)).toBe('1.5M')
  })

  it('returns 0 for zero', () => {
    expect(compactAmount(0, 6)).toBe('0')
  })

  it('handles numbers just under threshold', () => {
    expect(compactAmount(9999, 6)).toBe('9,999')
  })

  it('compacts 6-digit numbers when maxChars is small', () => {
    const result = compactAmount(149550, 5)
    expect(result).toBe('150K')
  })
})

describe('formatUsdValue', () => {
  it('returns empty string for zero or NaN', () => {
    expect(formatUsdValue(0)).toBe('')
    expect(formatUsdValue(NaN)).toBe('')
  })

  it('shows < $0.01 for very small values', () => {
    expect(formatUsdValue(0.001)).toBe('< $0.01')
    expect(formatUsdValue(0.009)).toBe('< $0.01')
  })

  it('formats small dollar values with 2 decimals', () => {
    expect(formatUsdValue(1.5)).toBe('~$1.50')
    expect(formatUsdValue(99.99)).toBe('~$99.99')
    expect(formatUsdValue(0.5)).toBe('~$0.50')
  })

  it('formats values in thousands with compact notation', () => {
    expect(formatUsdValue(1500)).toBe('~$1,500')
    expect(formatUsdValue(300000)).toBe('~$300K')
  })

  it('formats values in millions', () => {
    expect(formatUsdValue(1500000)).toBe('~$1.5M')
    expect(formatUsdValue(25000000)).toBe('~$25M')
  })

  it('formats values in billions', () => {
    expect(formatUsdValue(9970000000)).toBe('~$9.97B')
  })

  it('formats exact dollar amounts without trailing zeros', () => {
    expect(formatUsdValue(100)).toBe('~$100')
    expect(formatUsdValue(3000)).toBe('~$3,000')
  })
})
