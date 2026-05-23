import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  MonoLinkAtom,
  MonoSourceAtom,
  PanelHeaderMeta,
  shortAddress,
  shortenSourcePath,
} from '../PanelHeaderMeta'

describe('PanelHeaderMeta', () => {
  it('renders source-only rail without a middot separator', () => {
    render(<PanelHeaderMeta source={<MonoSourceAtom value="localhost:9300" />} />)
    const rail = screen.getByTestId('panel-header-meta')
    expect(rail).toBeInTheDocument()
    expect(rail.querySelector('[aria-hidden]')).toBeNull()
    expect(rail.textContent).toContain('localhost:9300')
  })

  it('renders cadence-only rail without a middot separator', () => {
    render(<PanelHeaderMeta cadence={<span>refreshes every 5s</span>} />)
    const rail = screen.getByTestId('panel-header-meta')
    expect(rail.querySelector('[aria-hidden]')).toBeNull()
    expect(rail.textContent).toContain('refreshes every 5s')
  })

  it('renders source + cadence with a single middot separator', () => {
    render(
      <PanelHeaderMeta
        source={<MonoSourceAtom value="localhost:9300" />}
        cadence={<span>refreshes every 5s</span>}
      />,
    )
    const rail = screen.getByTestId('panel-header-meta')
    const middots = rail.querySelectorAll('[aria-hidden]')
    expect(middots).toHaveLength(1)
    expect(middots[0].textContent).toBe('·')
    expect(rail.textContent).toContain('localhost:9300')
    expect(rail.textContent).toContain('refreshes every 5s')
  })

  it('renders nothing when both atoms are absent', () => {
    const { container } = render(<PanelHeaderMeta />)
    expect(container.firstChild).toBeNull()
  })

  it('rail container carries the shared text-xs text-gray-500 typography family', () => {
    render(<PanelHeaderMeta cadence={<span>cadence</span>} />)
    const rail = screen.getByTestId('panel-header-meta')
    expect(rail.className).toMatch(/\btext-xs\b/)
    expect(rail.className).toMatch(/\btext-gray-500\b/)
  })
})

describe('MonoSourceAtom', () => {
  it('renders as font-mono with title tooltip falling back to value', () => {
    render(<MonoSourceAtom value="localhost:9300" data-testid="atom" />)
    const atom = screen.getByTestId('atom')
    expect(atom.className).toMatch(/\bfont-mono\b/)
    expect(atom.className).toMatch(/\btruncate\b/)
    expect(atom.getAttribute('title')).toBe('localhost:9300')
  })

  it('honours an explicit title override', () => {
    render(<MonoSourceAtom value="0x4899…42b7" title="0xa4899d35897033b927acfcf422bc7459161397ab" data-testid="atom" />)
    expect(screen.getByTestId('atom').getAttribute('title')).toBe(
      '0xa4899d35897033b927acfcf422bc7459161397ab',
    )
  })
})

describe('MonoLinkAtom', () => {
  it('renders as a mono link with noopener / noreferrer and a hover-to-accent class', () => {
    render(
      <MonoLinkAtom
        value="0xabc…def"
        href="https://explorer.example.com/address/0xabc"
        data-testid="link"
      />,
    )
    const link = screen.getByTestId('link') as HTMLAnchorElement
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.className).toMatch(/\bfont-mono\b/)
    expect(link.className).toMatch(/\btext-gray-400\b/)
    expect(link.className).toMatch(/hover:text-accent/)
    expect(link.className).toMatch(/hover:underline/)
    expect(link.textContent).toContain('0xabc…def')
  })
})

describe('shortAddress', () => {
  it('returns the address in 0x{first4}…{last4} form', () => {
    expect(shortAddress('0xa4899d35897033b927acfcf422bc7459161397ab')).toBe('0xa489…97ab')
  })

  it('passes short inputs through unchanged', () => {
    expect(shortAddress('0x12')).toBe('0x12')
    expect(shortAddress('')).toBe('')
  })
})

describe('shortenSourcePath', () => {
  it('returns the last two segments of a longer path', () => {
    expect(shortenSourcePath('foo/bar/qa-proof/hedges/latest.json')).toBe('hedges/latest.json')
  })

  it('returns the path verbatim when it has ≤ 2 segments', () => {
    expect(shortenSourcePath('hedges/latest.json')).toBe('hedges/latest.json')
    expect(shortenSourcePath('latest.json')).toBe('latest.json')
  })

  it('handles empty input', () => {
    expect(shortenSourcePath('')).toBe('')
  })
})
