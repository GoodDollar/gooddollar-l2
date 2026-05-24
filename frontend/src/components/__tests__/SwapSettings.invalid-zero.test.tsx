/**
 * SwapSettings — custom slippage validation tests (task 0049).
 *
 * Covers the table in the task spec — every row of typed input must
 * either accept the value or surface a visible warning. The previous
 * behaviour silently dropped 0/blank/garbage so visible value !== stored
 * slippage, with no UI signal.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SwapSettings } from '../SwapSettings'

beforeEach(() => {
  localStorage.clear()
})

function openPopover() {
  fireEvent.click(screen.getByRole('button', { name: /swap settings/i }))
}

function getCustomInput() {
  return screen.getByPlaceholderText('Custom') as HTMLInputElement
}

function getStoredSlippage(): number | undefined {
  const raw = localStorage.getItem('goodswap-settings')
  if (!raw) return undefined
  const parsed = JSON.parse(raw) as { slippage?: number }
  return parsed.slippage
}

describe('SwapSettings — typing 0 into custom slippage', () => {
  it('shows the invalid-zero warning and does not change stored slippage', () => {
    render(<SwapSettings />)
    openPopover()
    const input = getCustomInput()
    fireEvent.change(input, { target: { value: '0' } })

    expect(input.value).toBe('0')
    expect(screen.getByTestId('slippage-invalid-zero-warning')).toBeInTheDocument()
    expect(screen.getByText(/slippage must be greater than 0/i)).toBeInTheDocument()
    // Stored slippage must NOT have been written to 0 — the silent drop is gone
    // but the actual stored value should still be the default (0.5).
    expect(getStoredSlippage() ?? 0.5).not.toBe(0)
  })

  it('deselects the default preset chip while invalid-zero is active', () => {
    render(<SwapSettings />)
    openPopover()
    // Default preset 0.5% chip should start with aria-pressed=true.
    const halfPercent = screen.getByRole('button', { name: '0.5%' })
    expect(halfPercent).toHaveAttribute('aria-pressed', 'true')

    fireEvent.change(getCustomInput(), { target: { value: '0' } })

    // After typing 0 the chip should be visually deselected.
    expect(screen.getByRole('button', { name: '0.5%' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('SwapSettings — low slippage warning (below 0.05%)', () => {
  it('accepts the value but shows the low-slippage hint', () => {
    render(<SwapSettings />)
    openPopover()
    fireEvent.change(getCustomInput(), { target: { value: '0.01' } })

    expect(screen.getByTestId('slippage-low-warning')).toBeInTheDocument()
    expect(screen.getByText(/most trades will fail/i)).toBeInTheDocument()
    expect(getStoredSlippage()).toBe(0.01)
  })
})

describe('SwapSettings — clamped-max regression', () => {
  it('clamps inputs above 50% and surfaces the max warning', () => {
    render(<SwapSettings />)
    openPopover()
    fireEvent.change(getCustomInput(), { target: { value: '100' } })

    const input = getCustomInput()
    expect(input.value).toBe('50')
    expect(screen.getByText(/maximum slippage is 50%/i)).toBeInTheDocument()
    expect(getStoredSlippage()).toBe(50)
  })
})

describe('SwapSettings — happy path clears warnings', () => {
  it('typing a valid value (2) clears all warnings and updates stored slippage', () => {
    render(<SwapSettings />)
    openPopover()
    // First type 0 to surface the warning.
    fireEvent.change(getCustomInput(), { target: { value: '0' } })
    expect(screen.queryByTestId('slippage-invalid-zero-warning')).toBeInTheDocument()

    // Then type 2 — warnings should clear and slippage should be stored.
    fireEvent.change(getCustomInput(), { target: { value: '2' } })

    expect(screen.queryByTestId('slippage-invalid-zero-warning')).not.toBeInTheDocument()
    expect(screen.queryByTestId('slippage-low-warning')).not.toBeInTheDocument()
    expect(getStoredSlippage()).toBe(2)
  })
})
