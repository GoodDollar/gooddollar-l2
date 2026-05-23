'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  CSV_MIME,
  JSON_MIME,
  downloadBlob,
  receiptsExportFilename,
  receiptsToCsv,
  receiptsToJson,
  type HedgeReceiptExportInput,
} from '@/lib/hedge-receipts-export'

/**
 * Lane 5 — `Export ▾` split-button for the recent-receipts panel.
 *
 * Serialises the already-rendered `receipts` array client-side so the
 * downloaded file always matches what the operator sees on screen
 * (task 0042). Stays visible — but disabled with a clear tooltip —
 * when receipts is empty so the affordance is always discoverable.
 */

interface ReceiptsExportToolbarProps {
  receipts: readonly HedgeReceiptExportInput[]
}

export function ReceiptsExportToolbar({ receipts }: ReceiptsExportToolbarProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const disabled = receipts.length === 0

  const handleCsv = useCallback(() => {
    setOpen(false)
    const filename = receiptsExportFilename('csv', receipts.length)
    downloadBlob(filename, CSV_MIME, receiptsToCsv(receipts))
  }, [receipts])

  const handleJson = useCallback(() => {
    setOpen(false)
    const filename = receiptsExportFilename('json', receipts.length)
    downloadBlob(filename, JSON_MIME, receiptsToJson(receipts))
  }, [receipts])

  // Close on click-outside and Escape so the popover behaves like the
  // rest of the dashboard's menus without pulling in a headless-UI dep.
  useEffect(() => {
    if (!open) return
    const handleDown = (ev: MouseEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(ev.target as Node)) return
      setOpen(false)
    }
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const baseBtn =
    'text-xs px-2.5 py-1.5 rounded-md border border-dark-50 text-gray-300 hover:bg-dark-50 disabled:opacity-50 disabled:hover:bg-transparent'

  return (
    <div
      ref={containerRef}
      data-testid="hedge-receipts-export-toolbar"
      className="relative inline-flex items-stretch rounded-md border border-dark-50 overflow-hidden"
    >
      <button
        type="button"
        data-testid="hedge-receipts-export-csv-button"
        onClick={handleCsv}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        title={disabled ? 'No receipts to export' : 'Download CSV'}
        className={`${baseBtn} border-0 rounded-none rounded-l-md`}
      >
        Export
      </button>
      <button
        type="button"
        data-testid="hedge-receipts-export-menu-toggle"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={disabled ? 'No receipts to export' : 'More export options'}
        title={disabled ? 'No receipts to export' : 'More export options'}
        className={`${baseBtn} border-0 border-l border-dark-50 rounded-none rounded-r-md px-1.5`}
      >
        <span aria-hidden="true">▾</span>
      </button>
      {open && !disabled && (
        <div
          role="menu"
          data-testid="hedge-receipts-export-menu"
          className="absolute right-0 top-full mt-1 z-10 min-w-[10rem] rounded-md border border-dark-50 bg-dark-100 shadow-lg text-xs py-1"
        >
          <button
            type="button"
            role="menuitem"
            data-testid="hedge-receipts-export-menu-csv"
            onClick={handleCsv}
            className="block w-full text-left px-3 py-1.5 text-gray-200 hover:bg-dark-50"
          >
            Download CSV
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid="hedge-receipts-export-menu-json"
            onClick={handleJson}
            className="block w-full text-left px-3 py-1.5 text-gray-200 hover:bg-dark-50"
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  )
}
