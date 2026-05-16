const ABBREVIATIONS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
]

export function formatAmount(value: number | string, maxDecimals = 6): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || num === 0) return '0'

  const abs = Math.abs(num)

  for (const [threshold, suffix] of ABBREVIATIONS) {
    if (abs >= threshold) {
      const abbreviated = num / threshold
      const fixed = abbreviated.toFixed(2).replace(/\.?0+$/, '')
      return `${fixed}${suffix}`
    }
  }

  if (abs >= 1000) {
    const intPart = Math.floor(abs)
    const decPart = abs - intPart
    const formatted = intPart.toLocaleString('en-US')
    if (decPart > 0.005) {
      const decimals = Math.min(maxDecimals, 2)
      const decStr = decPart.toFixed(decimals).slice(1).replace(/0+$/, '').replace(/\.$/, '')
      return (num < 0 ? '-' : '') + formatted + decStr
    }
    return (num < 0 ? '-' : '') + formatted
  }

  if (abs >= 1) {
    const decimals = Math.min(maxDecimals, 4)
    return trimTrailingZeros(num.toFixed(decimals))
  }

  // Sub-1 range: only safe to use fixed decimals while abs >= 10^-maxDecimals,
  // otherwise toFixed(maxDecimals) silently rounds to "0.000000" and the UI
  // shows a misleading literal "0" for real on-chain values (e.g. the
  // G$/USDC pool spotPrice ratio ~1e-12). Fall back to compact scientific
  // notation so the magnitude is preserved.
  const significantDecimals = Math.min(maxDecimals, 6)
  if (abs < Math.pow(10, -significantDecimals)) {
    return compactScientific(num)
  }
  return trimTrailingZeros(num.toFixed(significantDecimals))
}

function compactScientific(num: number): string {
  // toExponential picks the smallest mantissa precision that still survives
  // JS's Number → string round-trip, then we trim trailing zeros so e.g.
  // 1e-12 → "1e-12" rather than "1.000000e-12".
  const raw = num.toExponential()
  const [mantissa, exponent] = raw.split('e')
  const cleanMantissa = mantissa.includes('.')
    ? mantissa.replace(/0+$/, '').replace(/\.$/, '')
    : mantissa
  return `${cleanMantissa}e${exponent}`
}

function trimTrailingZeros(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/0+$/, '').replace(/\.$/, '')
}

const COMPACT_THRESHOLDS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
]

export function compactAmount(value: number, maxChars: number): string {
  if (value === 0 || isNaN(value)) return '0'

  const full = formatAmount(value)
  if (full.length <= maxChars) return full

  for (const [threshold, suffix] of COMPACT_THRESHOLDS) {
    if (Math.abs(value) >= threshold) {
      const abbreviated = value / threshold
      const decimals = abbreviated >= 100 ? 0 : abbreviated >= 10 ? 1 : 2
      let fixed = abbreviated.toFixed(decimals)
      if (fixed.includes('.')) fixed = fixed.replace(/0+$/, '').replace(/\.$/, '')
      return `${fixed}${suffix}`
    }
  }

  return full
}

const USD_COMPACT: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
]

export function formatUsdValue(usd: number): string {
  if (!usd || isNaN(usd)) return ''
  if (usd < 0.01) return '< $0.01'

  for (const [threshold, suffix] of USD_COMPACT) {
    if (usd >= threshold) {
      const abbr = usd / threshold
      const fixed = abbr >= 100 ? abbr.toFixed(0) : abbr >= 10 ? abbr.toFixed(1) : abbr.toFixed(2)
      const clean = fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed
      return `~$${clean}${suffix}`
    }
  }

  if (usd >= 100_000) {
    const k = usd / 1000
    const fixed = k >= 100 ? k.toFixed(0) : k.toFixed(1)
    const clean = fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed
    return `~$${clean}K`
  }

  if (usd >= 1000) {
    const intPart = Math.floor(usd)
    const decPart = usd - intPart
    const formatted = intPart.toLocaleString('en-US')
    if (decPart >= 0.005) {
      return `~$${formatted}.${decPart.toFixed(2).slice(2)}`
    }
    return `~$${formatted}`
  }

  if (Number.isInteger(usd)) return `~$${usd}`
  return `~$${usd.toFixed(2)}`
}

// Exact-dollar formatter for trade preview rows (Fee, → UBI Pool, etc).
// Distinct from formatUsdValue (which prefixes with "~$" for approximations)
// and from stockData.formatLargeNumber (which rounds anything < $1,000 to
// the nearest whole dollar — that helper is correct for market caps but
// silently collapses small fees to "$0", which hides the UBI contribution
// on retail-sized trades). For exact values like fee math we keep cents
// below the K threshold and abbreviate above it.
export function formatTradeAmount(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '$0.00'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs === 0) return '$0.00'
  if (abs < 0.01) return '< $0.01'
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`
  return `${sign}$${abs.toFixed(2)}`
}

export function sanitizeNumericInput(value: string): string {
  let sanitized = value.replace(/[^0-9.]/g, '')

  const dotIndex = sanitized.indexOf('.')
  if (dotIndex !== -1) {
    sanitized = sanitized.slice(0, dotIndex + 1) + sanitized.slice(dotIndex + 1).replace(/\./g, '')
  }

  if (dotIndex !== -1) {
    const intPart = sanitized.slice(0, dotIndex)
    const stripped = intPart.replace(/^0+/, '') || '0'
    sanitized = stripped + sanitized.slice(dotIndex)
  } else if (sanitized.length > 1) {
    sanitized = sanitized.replace(/^0+/, '') || '0'
  }

  if (sanitized.length > 20) {
    sanitized = sanitized.slice(0, 20)
  }

  return sanitized
}
