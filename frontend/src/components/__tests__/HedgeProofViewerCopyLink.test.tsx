import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import HedgeProofViewer from '../HedgeProofViewer'

/**
 * Task 0077 — the hedge proof page exists to be shared. The page header
 * exposes a "Copy link" button that copies `window.location.href` to the
 * clipboard via `navigator.clipboard.writeText`. On insecure contexts /
 * denied-permission iframes, the button falls back to a focusable
 * read-only `<input>` so the user can keyboard-copy.
 *
 * These tests cover the four contract points from the task spec:
 *   1. success: writeText is called with window.location.href, label
 *      flips to "Copied" then reverts to "Copy link" after ~1.5s.
 *   2. missing clipboard: clicking renders the fallback input + hint.
 *   3. rejected writeText: same fallback path is taken.
 *   4. shape: aria-label is stable + button is keyboard-reachable.
 */

const STILL_LOADING_FETCH = () => new Promise<Response>(() => {})

function setClipboard(impl: Pick<Clipboard, 'writeText'> | undefined) {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: impl,
    configurable: true,
    writable: true,
  })
}

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(STILL_LOADING_FETCH)
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('CopyLinkButton in HedgeProofViewer page header (#0077)', () => {
  it('renders the button with the default "Copy link" label and a stable aria-label', async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    const button = await screen.findByTestId('hedge-proof-copy-link-button')
    expect(button.getAttribute('aria-label')).toBe('Copy proof page link')
    expect(button.textContent).toContain('Copy link')
  })

  it('on click, calls navigator.clipboard.writeText with window.location.href and flips the label to "Copied"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    const button = await screen.findByTestId('hedge-proof-copy-link-button')
    await act(async () => {
      fireEvent.click(button)
    })
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    await waitFor(() => {
      expect(button.textContent).toContain('Copied')
    })
  })

  it('reverts the label from "Copied" back to "Copy link" after ~1.5s', async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    const button = await screen.findByTestId('hedge-proof-copy-link-button')
    await act(async () => {
      fireEvent.click(button)
    })
    await waitFor(() => {
      expect(button.textContent).toContain('Copied')
    })
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(button.textContent).toContain('Copy link')
  })

  it('falls back to a focusable readonly input + ⌘C hint when navigator.clipboard is undefined', async () => {
    setClipboard(undefined)
    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    const button = await screen.findByTestId('hedge-proof-copy-link-button')
    await act(async () => {
      fireEvent.click(button)
    })
    const input = await screen.findByTestId(
      'hedge-proof-copy-link-fallback-input',
    )
    expect(input).toBeInstanceOf(HTMLInputElement)
    expect((input as HTMLInputElement).value).toBe(window.location.href)
    expect((input as HTMLInputElement).readOnly).toBe(true)
    expect(document.activeElement).toBe(input)
    const hint = await screen.findByTestId(
      'hedge-proof-copy-link-fallback-hint',
    )
    expect(hint.textContent).toMatch(/Press ⌘C \/ Ctrl\+C to copy/)
  })

  it('falls back to the input path when writeText rejects (e.g. NotAllowedError on insecure / iframe contexts)', async () => {
    setClipboard({
      writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
    })
    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    const button = await screen.findByTestId('hedge-proof-copy-link-button')
    await act(async () => {
      fireEvent.click(button)
    })
    const input = await screen.findByTestId(
      'hedge-proof-copy-link-fallback-input',
    )
    expect((input as HTMLInputElement).value).toBe(window.location.href)
  })

  it('does NOT regress the back-link or h1 — both still render alongside the button', async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    render(<HedgeProofViewer endpoint="/api/hedge/proof/latest.json" />)
    expect(await screen.findByTestId('hedge-proof-back-link')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Hedge proof',
    )
    expect(screen.getByTestId('hedge-proof-copy-link-button')).toBeInTheDocument()
  })
})
