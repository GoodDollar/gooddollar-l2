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
})
