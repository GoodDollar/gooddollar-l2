import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SwapSettings } from '../SwapSettings'

beforeEach(() => {
  localStorage.clear()
})

describe('SwapSettings', () => {
  it('renders gear icon button', () => {
    render(<SwapSettings />)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('opens settings panel on click', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument()
  })

  it('shows slippage presets', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText('0.1%')).toBeInTheDocument()
    expect(screen.getByText('0.5%')).toBeInTheDocument()
    expect(screen.getByText('1%')).toBeInTheDocument()
  })

  it('selects a slippage preset', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    fireEvent.click(screen.getByText('1%'))
    const stored = JSON.parse(localStorage.getItem('goodswap-settings') || '{}')
    expect(stored.slippage).toBe(1.0)
  })

  it('shows transaction deadline input', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText('Transaction Deadline')).toBeInTheDocument()
  })

  it('closes panel on second click', () => {
    render(<SwapSettings />)
    const btn = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(btn)
    expect(screen.getByText('Slippage Tolerance')).toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.queryByText('Slippage Tolerance')).not.toBeInTheDocument()
  })

  it('clamps custom slippage to 50% in real-time when value exceeds max', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    const customInput = screen.getByPlaceholderText('Custom')
    fireEvent.change(customInput, { target: { value: '100' } })
    expect(customInput).toHaveValue('50')
    expect(screen.getByText(/maximum slippage/i)).toBeInTheDocument()
  })

  it('does not clamp custom slippage when value is within range', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    const customInput = screen.getByPlaceholderText('Custom')
    fireEvent.change(customInput, { target: { value: '25' } })
    fireEvent.blur(customInput)
    expect(customInput).toHaveValue('25')
    expect(screen.queryByText(/maximum slippage/i)).not.toBeInTheDocument()
  })

  it('shows deadline bounds hint', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByText(/min 1, max 180/i)).toBeInTheDocument()
  })

  it('shows high slippage warning for values above 5%', () => {
    render(<SwapSettings />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    const customInput = screen.getByPlaceholderText('Custom')
    fireEvent.change(customInput, { target: { value: '10' } })
    expect(screen.getByText(/high slippage/i)).toBeInTheDocument()
  })

  it('aria-label on the gear includes the current slippage and deadline values', () => {
    render(<SwapSettings />)
    const btn = screen.getByRole('button', { name: /swap settings/i })
    // Default: slippage 0.5%, deadline 30 minutes.
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('0.5%'))
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('30 minutes'))
  })

  it('does NOT render the non-default dot at default slippage/deadline', () => {
    render(<SwapSettings />)
    expect(screen.queryByTestId('settings-non-default-dot')).not.toBeInTheDocument()
  })

  it('renders the non-default dot when slippage differs from the default', () => {
    // Pre-seed localStorage with a non-default setting before mount.
    localStorage.setItem('goodswap-settings', JSON.stringify({ slippage: 2, deadline: 30 }))
    render(<SwapSettings />)
    expect(screen.getByTestId('settings-non-default-dot')).toBeInTheDocument()
  })

  it('renders the non-default dot when deadline differs from the default', () => {
    localStorage.setItem('goodswap-settings', JSON.stringify({ slippage: 0.5, deadline: 60 }))
    render(<SwapSettings />)
    expect(screen.getByTestId('settings-non-default-dot')).toBeInTheDocument()
  })
})
