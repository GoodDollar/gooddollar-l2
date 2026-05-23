import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import {
  InstrumentBadge,
  monogram,
  resolveAssetClass,
  type InstrumentClass,
} from '../InstrumentBadge'

describe('resolveAssetClass', () => {
  const cases: Array<[string, InstrumentClass]> = [
    ['BTC', 'crypto'],
    ['ETH', 'crypto'],
    ['ETHUSDT', 'crypto'],
    ['BNBUSD', 'crypto'],
    ['AAPL', 'stock'],
    ['MSFT', 'stock'],
    ['EURUSD', 'fx'],
    ['EUR/USD', 'fx'],
    ['eurusd', 'fx'],
    ['', 'unknown'],
    ['123', 'unknown'],
    ['SOMETHING-LONG', 'unknown'],
    // Task 0051: hyphenated and slash-separated pairs are the engine's
    // canonical symbol form. Every classifier branch must split on the
    // separator and pivot off the base side.
    ['BTC-USD', 'crypto'],
    ['ETH-USD', 'crypto'],
    ['SOL-USDT', 'crypto'],
    ['MATIC-USD', 'crypto'],
    ['DOGE-USDC', 'crypto'],
    ['BTC/USD', 'crypto'],
    ['eth-usd', 'crypto'],
    // Crypto wins over FX when only the base is in CRYPTO_TICKERS
    // (BTC isn't a CURRENCY_CODE so FX never resolves; matches retail
    // convention where exchanges price BTC/EUR as a crypto market).
    ['BTC-EUR', 'crypto'],
    ['EUR-USD', 'fx'],
  ]
  for (const [input, expected] of cases) {
    it(`maps "${input}" to ${expected}`, () => {
      expect(resolveAssetClass(input)).toBe(expected)
    })
  }

  it('treats normalised input the same as raw input', () => {
    expect(resolveAssetClass('  btc  ')).toBe('crypto')
  })
})

describe('monogram', () => {
  it('takes the first 2 chars for crypto + stock', () => {
    expect(monogram('AAPL', 'stock')).toBe('AA')
    expect(monogram('BTC', 'crypto')).toBe('BT')
  })

  it('splits FX into two 2-char country codes', () => {
    expect(monogram('EURUSD', 'fx')).toBe('EU/US')
    expect(monogram('EUR/USD', 'fx')).toBe('EU/US')
    expect(monogram('EUR-USD', 'fx')).toBe('EU/US')
  })

  it('uses the BASE side of a separator-split crypto pair', () => {
    expect(monogram('BTC-USD', 'crypto')).toBe('BT')
    expect(monogram('MATIC-USD', 'crypto')).toBe('MA')
    expect(monogram('BTC/USD', 'crypto')).toBe('BT')
  })

  it('renders a "?" for unknown / empty input', () => {
    expect(monogram('', 'unknown')).toBe('?')
    expect(monogram('???', 'unknown')).toBe('?')
  })
})

describe('InstrumentBadge', () => {
  it('renders a 16x16 chip with the brand color for BTC', () => {
    const { container } = render(<InstrumentBadge ticker="BTC" testId="badge" />)
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip).not.toBeNull()
    expect(chip.getAttribute('data-instrument-class')).toBe('crypto')
    expect(chip.textContent).toBe('BT')
    expect(chip.className).toMatch(/bg-amber-500\/25/)
  })

  it('renders the EU/US split chip for EURUSD', () => {
    const { container } = render(
      <InstrumentBadge ticker="EURUSD" testId="badge" />,
    )
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip.textContent).toBe('EU/US')
    expect(chip.getAttribute('data-instrument-class')).toBe('fx')
  })

  it('renders a blue chip for stocks', () => {
    const { container } = render(<InstrumentBadge ticker="AAPL" testId="badge" />)
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip.getAttribute('data-instrument-class')).toBe('stock')
    expect(chip.className).toMatch(/bg-blue-500\/20/)
  })

  it('renders a grey ? chip for unknown', () => {
    const { container } = render(<InstrumentBadge ticker="???" testId="badge" />)
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip.getAttribute('data-instrument-class')).toBe('unknown')
    expect(chip.textContent).toBe('?')
  })

  it('is aria-hidden so screen readers do not read the symbol twice', () => {
    const { container } = render(<InstrumentBadge ticker="BTC" testId="badge" />)
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip.getAttribute('aria-hidden')).toBe('true')
  })

  // Task 0051: routing tests for the engine's canonical BASE-QUOTE form.
  it('routes BTC-USD to the BTC brand amber chip (not the unknown gray ?)', () => {
    const { container } = render(
      <InstrumentBadge ticker="BTC-USD" testId="badge" />,
    )
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip.getAttribute('data-instrument-class')).toBe('crypto')
    expect(chip.textContent).toBe('BT')
    expect(chip.className).toMatch(/bg-amber-500\/25/)
  })

  it('routes ETH-USD to the ETH brand indigo chip', () => {
    const { container } = render(
      <InstrumentBadge ticker="ETH-USD" testId="badge" />,
    )
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip.getAttribute('data-instrument-class')).toBe('crypto')
    expect(chip.textContent).toBe('ET')
    expect(chip.className).toMatch(/bg-indigo-500\/25/)
  })

  it('routes SOL-USDT to the SOL brand fuchsia chip', () => {
    const { container } = render(
      <InstrumentBadge ticker="SOL-USDT" testId="badge" />,
    )
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip.getAttribute('data-instrument-class')).toBe('crypto')
    expect(chip.className).toMatch(/bg-fuchsia-500\/25/)
  })

  it('keeps the dash-less form (BTCUSD) on the crypto class (no regression)', () => {
    const { container } = render(
      <InstrumentBadge ticker="BTCUSD" testId="badge" />,
    )
    const chip = container.querySelector('[data-testid="badge"]') as HTMLElement
    expect(chip.getAttribute('data-instrument-class')).toBe('crypto')
    expect(chip.className).toMatch(/bg-amber-500\/25/)
  })
})
