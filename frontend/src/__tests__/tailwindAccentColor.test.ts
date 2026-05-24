import { describe, it, expect } from 'vitest'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'

type ColorMap = Record<string, unknown>

function readAccent(colors: ColorMap | undefined): string | undefined {
  const raw = colors?.accent
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object') {
    const maybeDefault = (raw as { DEFAULT?: unknown }).DEFAULT
    if (typeof maybeDefault === 'string') return maybeDefault
  }
  return undefined
}

describe('tailwind accent token', () => {
  it('defines accent as the brand mint-teal #00B0A0 so text-accent / bg-accent / border-accent / ring-accent emit CSS', () => {
    const full = resolveConfig(tailwindConfig)
    const value = readAccent(full.theme?.colors as ColorMap | undefined)
    expect(value).toBeDefined()
    expect(value?.toLowerCase()).toBe('#00b0a0')
  })

  it('matches goodgreen.500 so the global :focus-visible outline (#00B0A0) and ring-accent share the same hue', () => {
    const full = resolveConfig(tailwindConfig)
    const colors = full.theme?.colors as ColorMap | undefined
    const accentValue = readAccent(colors)
    const goodgreen = colors?.goodgreen as Record<string, string> | undefined
    expect(accentValue?.toLowerCase()).toBe(goodgreen?.['500']?.toLowerCase())
  })
})
