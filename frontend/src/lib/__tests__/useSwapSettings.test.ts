import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  MAX_SLIPPAGE,
  classifySlippageInput,
  useSwapSettings,
} from '../useSwapSettings'

beforeEach(() => {
  localStorage.clear()
})

describe('useSwapSettings', () => {
  it('returns default slippage of 0.5', () => {
    const { result } = renderHook(() => useSwapSettings())
    expect(result.current.slippage).toBe(0.5)
  })

  it('returns default deadline of 30', () => {
    const { result } = renderHook(() => useSwapSettings())
    expect(result.current.deadline).toBe(30)
  })

  it('updates slippage', () => {
    const { result } = renderHook(() => useSwapSettings())
    act(() => result.current.setSlippage(1.0))
    expect(result.current.slippage).toBe(1.0)
  })

  it('updates deadline', () => {
    const { result } = renderHook(() => useSwapSettings())
    act(() => result.current.setDeadline(10))
    expect(result.current.deadline).toBe(10)
  })

  it('persists slippage to localStorage', () => {
    const { result } = renderHook(() => useSwapSettings())
    act(() => result.current.setSlippage(1.0))
    const stored = JSON.parse(localStorage.getItem('goodswap-settings') || '{}')
    expect(stored.slippage).toBe(1.0)
  })

  it('restores settings from localStorage', () => {
    localStorage.setItem('goodswap-settings', JSON.stringify({ slippage: 0.1, deadline: 15 }))
    const { result } = renderHook(() => useSwapSettings())
    expect(result.current.slippage).toBe(0.1)
    expect(result.current.deadline).toBe(15)
  })

  it('clamps slippage to valid range', () => {
    const { result } = renderHook(() => useSwapSettings())
    act(() => result.current.setSlippage(60))
    expect(result.current.slippage).toBe(50)
    act(() => result.current.setSlippage(-1))
    expect(result.current.slippage).toBe(0)
  })
})

describe('classifySlippageInput', () => {
  it('classifies blank, punctuation-only, and garbage input as blank', () => {
    expect(classifySlippageInput('')).toEqual({ kind: 'blank' })
    expect(classifySlippageInput('   ')).toEqual({ kind: 'blank' })
    expect(classifySlippageInput('.')).toEqual({ kind: 'blank' })
    expect(classifySlippageInput('abc')).toEqual({ kind: 'blank' })
  })

  it('rejects zero values explicitly', () => {
    expect(classifySlippageInput('0')).toEqual({ kind: 'invalid-zero' })
    expect(classifySlippageInput('0.00')).toEqual({ kind: 'invalid-zero' })
  })

  it('accepts low, normal, high-risk, and over-max values with distinct decisions', () => {
    expect(classifySlippageInput('0.01')).toEqual({ kind: 'low', value: 0.01 })
    expect(classifySlippageInput('0.5')).toEqual({ kind: 'ok', value: 0.5 })
    expect(classifySlippageInput('5.1')).toEqual({ kind: 'high-risk', value: 5.1 })
    expect(classifySlippageInput(String(MAX_SLIPPAGE + 1))).toEqual({
      kind: 'clamped-max',
    })
  })
})
