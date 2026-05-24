import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Button } from '../button'

describe('Button', () => {
  it('renders a native <button> by default and applies variant classes (#0066)', () => {
    render(<Button data-testid="cta">Save</Button>)
    const el = screen.getByTestId('cta')
    expect(el.tagName).toBe('BUTTON')
    // The default variant ships the goodgreen background class.
    expect(el.className).toContain('bg-goodgreen')
    // The asChild prop must NEVER reach the DOM as a lowercase attribute.
    expect(el.getAttribute('aschild')).toBeNull()
  })

  it('asChild=true renders the single child element with the button classes (#0066)', () => {
    // The canonical Radix Slot pattern: <Button asChild><a/></Button> must
    // render *only* the anchor (no parent <button>) so the resulting DOM
    // is a single, valid interactive control. Before #0066 this rendered
    // an invalid <button><a/></button> tree and emitted axe `serious`
    // "Interactive controls must not be nested" + a React unknown-prop
    // warning for `asChild`.
    render(
      <Button asChild>
        <a data-testid="cta" href="/recovery">
          Back to Swap
        </a>
      </Button>,
    )
    const el = screen.getByTestId('cta')
    expect(el.tagName).toBe('A')
    expect(el.getAttribute('href')).toBe('/recovery')
    // Variant classes flow through Slot to the anchor so visual styling
    // is byte-identical to the previous (broken) <button> render.
    expect(el.className).toContain('inline-flex')
    expect(el.className).toContain('bg-goodgreen')
    // No outer <button>, no leaked `aschild=""` attribute.
    expect(el.parentElement?.tagName).not.toBe('BUTTON')
    expect(el.getAttribute('aschild')).toBeNull()
  })

  it('asChild forwards refs to the underlying child element (#0066)', () => {
    const ref = React.createRef<HTMLAnchorElement>()
    render(
      <Button asChild>
        <a ref={ref} href="/x">
          X
        </a>
      </Button>,
    )
    expect(ref.current?.tagName).toBe('A')
  })
})
