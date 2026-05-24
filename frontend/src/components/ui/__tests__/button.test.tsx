import * as React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  it('asChild merges parent and child classNames so callers can extend variant styles (#0083)', () => {
    render(
      <Button asChild variant="secondary" className="px-9">
        <a data-testid="cta" href="/x" className="custom-extra">
          X
        </a>
      </Button>,
    )
    const el = screen.getByTestId('cta')
    expect(el.className).toContain('px-9')
    expect(el.className).toContain('custom-extra')
    expect(el.className).toContain('bg-dark-50')
  })

  it('asChild composes parent and child refs so both observers receive the DOM node (#0083)', () => {
    const parentRef = React.createRef<HTMLAnchorElement>()
    const childRef = React.createRef<HTMLAnchorElement>()
    render(
      <Button
        asChild
        ref={parentRef as unknown as React.Ref<HTMLButtonElement>}
      >
        <a ref={childRef} href="/x">
          X
        </a>
      </Button>,
    )
    expect(parentRef.current?.tagName).toBe('A')
    expect(childRef.current?.tagName).toBe('A')
    expect(parentRef.current).toBe(childRef.current)
  })

  it('does not import @radix-ui/react-slot so Turbopack cannot evict a Slot chunk under button.tsx (#0083)', () => {
    // The whole point of this fix is to remove the cross-module dependency
    // that caused the dev server to return HTTP 500 sitewide after new
    // routes were added (Turbopack would evict the Slot factory and the
    // button.tsx chunk would crash on the next request). A static-source
    // assertion is the cheapest guard against the import sneaking back in.
    const source = readFileSync(
      resolve(__dirname, '..', 'button.tsx'),
      'utf8',
    )
    expect(source).not.toMatch(/^\s*import[^\n]*['"]@radix-ui\/react-slot['"]/m)
  })
})
