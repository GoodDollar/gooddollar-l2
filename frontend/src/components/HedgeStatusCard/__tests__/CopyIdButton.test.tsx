import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { CopyIdButton } from '../CopyIdButton'

interface NavWithClipboard {
  clipboard?: { writeText?: (s: string) => Promise<void> }
}

function stubClipboard(impl: (text: string) => Promise<void>): () => void {
  const nav = navigator as NavWithClipboard
  const original = nav.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: impl },
  })
  return () => {
    if (original) {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: original,
      })
    } else {
      Reflect.deleteProperty(navigator, 'clipboard')
    }
  }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('CopyIdButton', () => {
  it('renders the placeholder as a non-interactive span when value is empty', () => {
    render(<CopyIdButton value="" ariaLabel="Copy id" placeholder="—" testId="x" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders a button and writes the FULL value (not the visible label) on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const restore = stubClipboard(writeText)
    try {
      render(
        <CopyIdButton
          value="full-and-long-id-12345"
          label="full-and-l…"
          ariaLabel="Copy hedge id"
          testId="copy-internal"
        />,
      )
      const btn = screen.getByTestId('copy-internal')
      fireEvent.click(btn)
      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('full-and-long-id-12345')
      })
    } finally {
      restore()
    }
  })

  it('shows a copied pill with aria-live polite for 1.5s after a successful copy', async () => {
    const restore = stubClipboard(() => Promise.resolve())
    try {
      render(
        <CopyIdButton
          value="abc"
          ariaLabel="Copy hedge id"
          testId="copy-internal"
        />,
      )
      await act(async () => {
        fireEvent.click(screen.getByTestId('copy-internal'))
      })
      const pill = await screen.findByText('copied')
      const status = pill.closest('output')
      expect(status).not.toBeNull()
      expect(status!.getAttribute('aria-live')).toBe('polite')

      act(() => {
        vi.advanceTimersByTime(1600)
      })
      await waitFor(() => {
        expect(screen.queryByText('copied')).toBeNull()
      })
    } finally {
      restore()
    }
  })

  it('falls back to select-all + select the button text when clipboard rejects', async () => {
    const restore = stubClipboard(() => Promise.reject(new Error('blocked')))
    try {
      render(
        <CopyIdButton
          value="abc"
          ariaLabel="Copy hedge id"
          testId="copy-internal"
        />,
      )
      await act(async () => {
        fireEvent.click(screen.getByTestId('copy-internal'))
      })
      await waitFor(() => {
        expect(screen.getByText('select-all')).toBeInTheDocument()
      })
      const sel = window.getSelection()
      expect(sel).not.toBeNull()
      expect(sel!.rangeCount).toBeGreaterThan(0)
    } finally {
      restore()
    }
  })

  it('stops click propagation so a future row-level handler does not fire', async () => {
    const restore = stubClipboard(() => Promise.resolve())
    try {
      const rowClick = vi.fn()
      const { container } = render(
        <div onClick={rowClick}>
          <CopyIdButton
            value="abc"
            ariaLabel="Copy hedge id"
            testId="copy-internal"
          />
        </div>,
      )
      const btn = container.querySelector('[data-testid="copy-internal"]')!
      fireEvent.click(btn)
      await Promise.resolve()
      expect(rowClick).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })

  it('exposes the full value via the title attribute for desktop hover parity', () => {
    render(
      <CopyIdButton
        value="full-id"
        ariaLabel="Copy hedge id"
        testId="copy-internal"
      />,
    )
    expect(screen.getByTestId('copy-internal').getAttribute('title')).toBe(
      'full-id',
    )
  })
})
