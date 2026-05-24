import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ReceiptsExportToolbar } from '../ReceiptsExportToolbar'
import type { HedgeReceiptExportInput } from '@/lib/hedge-receipts-export'

function makeReceipt(
  overrides: Partial<HedgeReceiptExportInput> = {},
): HedgeReceiptExportInput {
  return {
    v: 1,
    id: 'abc12345defg',
    timestamp: 1700000000000,
    symbol: 'AAPL',
    side: 'buy',
    notionalUsd: 50,
    success: true,
    etoroOrderId: 'etoro-1',
    beforeExposure: 100,
    afterExposure: 150,
    dryRun: false,
    mode: 'demo',
    ...overrides,
  }
}

interface UrlWithObjectUrl {
  createObjectURL?: (b: Blob) => string
  revokeObjectURL?: (u: string) => void
}

function stubObjectUrl(): {
  createSpy: ReturnType<typeof vi.fn>
  revokeSpy: ReturnType<typeof vi.fn>
  restore: () => void
} {
  const u = URL as unknown as UrlWithObjectUrl
  const originalCreate = u.createObjectURL
  const originalRevoke = u.revokeObjectURL
  const createSpy = vi.fn(() => 'blob:fake')
  const revokeSpy = vi.fn()
  u.createObjectURL = createSpy
  u.revokeObjectURL = revokeSpy
  return {
    createSpy,
    revokeSpy,
    restore: () => {
      u.createObjectURL = originalCreate
      u.revokeObjectURL = originalRevoke
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ReceiptsExportToolbar', () => {
  it('renders only the Export button when receipts are empty (chevron toggle hidden to avoid aria duplication, #0064)', () => {
    render(<ReceiptsExportToolbar receipts={[]} />)
    const btn = screen.getByTestId('hedge-receipts-export-csv-button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute(
      'title',
      'No receipts to export — nothing has happened yet',
    )
    expect(
      screen.queryByTestId('hedge-receipts-export-menu-toggle'),
    ).toBeNull()
  })

  it('exposes the engine-offline disabled copy on exactly one button (#0064)', () => {
    render(<ReceiptsExportToolbar receipts={[]} reason="engine-offline" />)
    const expected =
      'Engine offline — receipts will be exportable once it comes back'
    const btn = screen.getByTestId('hedge-receipts-export-csv-button')
    expect(btn).toHaveAttribute('title', expected)
    expect(btn).toHaveAttribute('aria-label', expected)
    expect(
      screen.queryByTestId('hedge-receipts-export-menu-toggle'),
    ).toBeNull()
    const matching = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label') === expected)
    expect(matching).toHaveLength(1)
  })

  it('exposes the degraded-source disabled copy on exactly one button (#0064)', () => {
    render(
      <ReceiptsExportToolbar receipts={[]} reason="receipts-source-degraded" />,
    )
    const expected =
      'Receipts source degraded — export disabled until receipts are healthy'
    const btn = screen.getByTestId('hedge-receipts-export-csv-button')
    expect(btn).toHaveAttribute('title', expected)
    expect(btn).toHaveAttribute('aria-label', expected)
    expect(
      screen.queryByTestId('hedge-receipts-export-menu-toggle'),
    ).toBeNull()
    const matching = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label') === expected)
    expect(matching).toHaveLength(1)
  })

  it('exposes the no-activity disabled copy on exactly one button (#0064)', () => {
    render(<ReceiptsExportToolbar receipts={[]} reason="no-activity" />)
    const expected = 'No receipts to export — nothing has happened yet'
    const btn = screen.getByTestId('hedge-receipts-export-csv-button')
    expect(btn).toHaveAttribute('title', expected)
    expect(btn).toHaveAttribute('aria-label', expected)
    expect(
      screen.queryByTestId('hedge-receipts-export-menu-toggle'),
    ).toBeNull()
    const matching = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-label') === expected)
    expect(matching).toHaveLength(1)
  })

  it('duplicate-aria-label invariant: every disabled reason exposes its copy on at most one button (#0064)', () => {
    const reasons = [
      'no-activity',
      'engine-offline',
      'receipts-source-degraded',
    ] as const
    for (const reason of reasons) {
      const { unmount } = render(
        <ReceiptsExportToolbar receipts={[]} reason={reason} />,
      )
      const labels = screen
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'))
        .filter((label): label is string => Boolean(label))
      const seen = new Set<string>()
      for (const label of labels) {
        expect(seen.has(label)).toBe(false)
        seen.add(label)
      }
      unmount()
    }
  })

  it('keeps enabled-state copy unchanged when receipts are present (regression guard)', () => {
    render(
      <ReceiptsExportToolbar
        receipts={[makeReceipt()]}
        reason="engine-offline"
      />,
    )
    const btn = screen.getByTestId('hedge-receipts-export-csv-button')
    const toggle = screen.getByTestId('hedge-receipts-export-menu-toggle')
    expect(btn).not.toBeDisabled()
    expect(toggle).not.toBeDisabled()
    expect(btn).toHaveAttribute('title', 'Download CSV')
    expect(toggle).toHaveAttribute('title', 'More export options')
    expect(toggle).toHaveAttribute('aria-label', 'More export options')
  })

  it('triggers CSV download with the receipts payload on click', () => {
    const { createSpy, restore } = stubObjectUrl()
    try {
      render(<ReceiptsExportToolbar receipts={[makeReceipt()]} />)
      fireEvent.click(screen.getByTestId('hedge-receipts-export-csv-button'))
      expect(createSpy).toHaveBeenCalledOnce()
      const blob = createSpy.mock.calls[0][0] as Blob
      expect(blob.type).toMatch(/text\/csv/)
    } finally {
      restore()
    }
  })

  it('opens the menu and exposes CSV + JSON menuitems with role=menu', () => {
    render(<ReceiptsExportToolbar receipts={[makeReceipt()]} />)
    fireEvent.click(screen.getByTestId('hedge-receipts-export-menu-toggle'))
    const menu = screen.getByTestId('hedge-receipts-export-menu')
    expect(menu).toHaveAttribute('role', 'menu')
    expect(screen.getByTestId('hedge-receipts-export-menu-csv')).toBeInTheDocument()
    expect(screen.getByTestId('hedge-receipts-export-menu-json')).toBeInTheDocument()
  })

  it('triggers JSON download from the menu', () => {
    const { createSpy, restore } = stubObjectUrl()
    try {
      render(<ReceiptsExportToolbar receipts={[makeReceipt()]} />)
      fireEvent.click(screen.getByTestId('hedge-receipts-export-menu-toggle'))
      fireEvent.click(screen.getByTestId('hedge-receipts-export-menu-json'))
      expect(createSpy).toHaveBeenCalledOnce()
      const blob = createSpy.mock.calls[0][0] as Blob
      expect(blob.type).toMatch(/application\/json/)
    } finally {
      restore()
    }
  })

  it('closes the menu when Escape is pressed', () => {
    render(<ReceiptsExportToolbar receipts={[makeReceipt()]} />)
    fireEvent.click(screen.getByTestId('hedge-receipts-export-menu-toggle'))
    expect(screen.getByTestId('hedge-receipts-export-menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('hedge-receipts-export-menu')).toBeNull()
  })

  it('uses an outline that is not the same dark-50 token as the receipts panel background (#0069)', () => {
    // The disabled Export button sits inside a `bg-dark-50` panel. If the
    // wrapper border is also `border-dark-50` the outline reads as
    // invisible and the disabled button collapses to ghost text.
    // Lock the wrapper to `border-white/10`, the idiomatic
    // outline-on-dark token used elsewhere in the dashboard.
    render(<ReceiptsExportToolbar receipts={[]} reason="engine-offline" />)
    const wrapper = screen.getByTestId('hedge-receipts-export-toolbar')
    expect(wrapper.className).toContain('border-white/10')
    expect(wrapper.className).not.toMatch(/\bborder-dark-50\b/)
  })

  it('keeps the wrapper outline visible against the panel even when receipts are present (#0069)', () => {
    render(<ReceiptsExportToolbar receipts={[makeReceipt()]} />)
    const wrapper = screen.getByTestId('hedge-receipts-export-toolbar')
    expect(wrapper.className).toContain('border-white/10')
    expect(wrapper.className).not.toMatch(/\bborder-dark-50\b/)
  })
})
