import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrollStrip } from '../ScrollStrip'

// Task 0086 — horizontal scroll strips on mobile (category chips, sort
// options, pair selectors, section navs) were inconsistently styled:
// some had a hardcoded `#0f1117` fade that did not match the body
// background, others had no fade at all, and the `scrollbar-none` class
// they relied on was never defined. ScrollStrip wraps these patterns in
// a single component that hides the scrollbar cross-browser, renders a
// theme-driven fade gradient on the right edge, and exposes a stable
// API for the four call sites.
describe('ScrollStrip', () => {
  it('renders children inside a horizontally scrollable container', () => {
    render(
      <ScrollStrip>
        <button>Chip A</button>
        <button>Chip B</button>
      </ScrollStrip>
    )
    expect(screen.getByText('Chip A')).toBeInTheDocument()
    expect(screen.getByText('Chip B')).toBeInTheDocument()
  })

  it('applies overflow-x-auto and scrollbar-none to the scroll container', () => {
    const { container } = render(
      <ScrollStrip>
        <span>child</span>
      </ScrollStrip>
    )
    const scrollEl = container.querySelector('[data-scroll-strip-scroller]')
    expect(scrollEl).not.toBeNull()
    const classes = scrollEl!.className
    expect(classes).toContain('overflow-x-auto')
    expect(classes).toContain('scrollbar-none')
  })

  it('renders a decorative fade gradient on the right edge', () => {
    const { container } = render(
      <ScrollStrip>
        <span>child</span>
      </ScrollStrip>
    )
    const fade = container.querySelector('[data-scroll-strip-fade]')
    expect(fade).not.toBeNull()
    // Fade is purely decorative — hidden from assistive tech and
    // non-interactive so it never intercepts clicks/taps on chips.
    expect(fade!.getAttribute('aria-hidden')).toBe('true')
    expect(fade!.className).toContain('pointer-events-none')
    expect(fade!.className).toContain('bg-gradient-to-l')
  })

  it('merges custom className into the scroll container', () => {
    const { container } = render(
      <ScrollStrip className="gap-2 pb-1">
        <span>child</span>
      </ScrollStrip>
    )
    const scrollEl = container.querySelector('[data-scroll-strip-scroller]')
    expect(scrollEl!.className).toContain('gap-2')
    expect(scrollEl!.className).toContain('pb-1')
  })

  it('exposes ariaLabel as aria-label on the scroll container', () => {
    render(
      <ScrollStrip ariaLabel="Market categories">
        <span>child</span>
      </ScrollStrip>
    )
    const labelled = screen.getByLabelText('Market categories')
    expect(labelled).toBeInTheDocument()
    expect(labelled.getAttribute('role')).toBe('group')
  })

  it('does not set role or aria-label when ariaLabel is omitted', () => {
    const { container } = render(
      <ScrollStrip>
        <span>child</span>
      </ScrollStrip>
    )
    const scrollEl = container.querySelector('[data-scroll-strip-scroller]')
    expect(scrollEl!.getAttribute('aria-label')).toBeNull()
    expect(scrollEl!.getAttribute('role')).toBeNull()
  })

  it('allows overriding the fade color via fadeFromClass', () => {
    const { container } = render(
      <ScrollStrip fadeFromClass="from-red-500">
        <span>child</span>
      </ScrollStrip>
    )
    const fade = container.querySelector('[data-scroll-strip-fade]')
    expect(fade!.className).toContain('from-red-500')
  })

  it('falls back to the theme background fade when no override is given', () => {
    const { container } = render(
      <ScrollStrip>
        <span>child</span>
      </ScrollStrip>
    )
    const fade = container.querySelector('[data-scroll-strip-fade]')
    // Theme-driven fade — uses the --background CSS variable so the
    // gradient automatically matches dark and light themes.
    expect(fade!.className).toMatch(/from-\[hsl\(var\(--background\)\)\]/)
  })

  it('allows tuning the fade width via fadeWidthClass', () => {
    const { container } = render(
      <ScrollStrip fadeWidthClass="w-12">
        <span>child</span>
      </ScrollStrip>
    )
    const fade = container.querySelector('[data-scroll-strip-fade]')
    expect(fade!.className).toContain('w-12')
  })
})
