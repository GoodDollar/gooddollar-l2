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
  it('renders an Export button + menu toggle even when receipts are empty', () => {
    render(<ReceiptsExportToolbar receipts={[]} />)
    const btn = screen.getByTestId('hedge-receipts-export-csv-button')
    const toggle = screen.getByTestId('hedge-receipts-export-menu-toggle')
    expect(btn).toBeDisabled()
    expect(toggle).toBeDisabled()
    expect(btn).toHaveAttribute('title', 'No receipts to export')
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
})
