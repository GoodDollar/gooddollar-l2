import { describe, it, expect, vi, afterEach } from 'vitest'

import {
  CSV_MIME,
  JSON_MIME,
  downloadBlob,
  receiptsExportFilename,
  receiptsToCsv,
  receiptsToJson,
  type HedgeReceiptExportInput,
} from '../hedge-receipts-export'

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
    error: undefined,
    etoroOrderId: 'etoro-1',
    beforeExposure: 100,
    afterExposure: 150,
    dryRun: false,
    mode: 'demo',
    ...overrides,
  }
}

describe('receiptsToCsv', () => {
  it('emits the RFC-4180 header row with CRLF when receipts are empty', () => {
    const csv = receiptsToCsv([])
    expect(csv).toBe(
      'time_iso,id,etoro_order_id,symbol,side,notional_usd,before_exposure,after_exposure,exposure_delta,status,mode,dry_run\r\n',
    )
  })

  it('serialises a single happy-path receipt with all canonical columns', () => {
    const csv = receiptsToCsv([makeReceipt()])
    const [header, row] = csv.split('\r\n')
    expect(header).toBe(
      'time_iso,id,etoro_order_id,symbol,side,notional_usd,before_exposure,after_exposure,exposure_delta,status,mode,dry_run',
    )
    expect(row).toBe(
      '2023-11-14T22:13:20.000Z,abc12345defg,etoro-1,AAPL,buy,50.00,100.00,150.00,50.00,ok,demo,false',
    )
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('quotes fields containing commas, quotes, or newlines per RFC 4180', () => {
    const csv = receiptsToCsv([
      makeReceipt({ symbol: 'A,B', error: 'he said "no"', success: false }),
    ])
    const row = csv.split('\r\n')[1]
    expect(row).toContain('"A,B"')
    expect(row).toContain('"he said ""no"""')
  })

  it('renders missing etoroOrderId as an unquoted empty field', () => {
    const csv = receiptsToCsv([makeReceipt({ etoroOrderId: undefined })])
    const row = csv.split('\r\n')[1].split(',')
    expect(row[2]).toBe('')
  })

  it('omits exposure_delta when before/after exposures are non-finite', () => {
    const csv = receiptsToCsv([
      makeReceipt({ beforeExposure: NaN, afterExposure: 50 }),
    ])
    const row = csv.split('\r\n')[1].split(',')
    expect(row[6]).toBe('')
    expect(row[7]).toBe('50.00')
    expect(row[8]).toBe('')
  })

  it('renders dry_run as plain string true/false', () => {
    const trueCsv = receiptsToCsv([makeReceipt({ dryRun: true })])
    expect(trueCsv.split('\r\n')[1].split(',').at(-1)).toBe('true')
    const falseCsv = receiptsToCsv([makeReceipt({ dryRun: false })])
    expect(falseCsv.split('\r\n')[1].split(',').at(-1)).toBe('false')
  })

  it('uses CRLF terminators between rows', () => {
    const csv = receiptsToCsv([makeReceipt(), makeReceipt({ id: 'second' })])
    const matches = csv.match(/\r\n/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })
})

describe('receiptsToJson', () => {
  it('round-trips through JSON.parse unchanged', () => {
    const r1 = makeReceipt()
    const json = receiptsToJson([r1])
    const parsed = JSON.parse(json) as HedgeReceiptExportInput[]
    expect(parsed).toEqual([r1])
  })

  it('renders an empty array for empty input', () => {
    const json = receiptsToJson([])
    expect(json.trim()).toBe('[]')
  })

  it('is pretty-printed with 2-space indent for diff-ability', () => {
    const json = receiptsToJson([makeReceipt()])
    expect(json).toContain('\n    "v"')
  })
})

describe('receiptsExportFilename', () => {
  it('builds `hedge-receipts-<YYYY-MM-DD>-<count>.<ext>`', () => {
    const now = new Date('2026-05-23T15:30:00Z')
    expect(receiptsExportFilename('csv', 5, now)).toBe(
      'hedge-receipts-2026-05-23-5.csv',
    )
    expect(receiptsExportFilename('json', 3, now)).toBe(
      'hedge-receipts-2026-05-23-3.json',
    )
  })
})

interface UrlWithObjectUrl {
  createObjectURL?: (b: Blob) => string
  revokeObjectURL?: (u: string) => void
}

describe('downloadBlob', () => {
  const u = URL as unknown as UrlWithObjectUrl
  const originalCreateObjectURL = u.createObjectURL
  const originalRevokeObjectURL = u.revokeObjectURL

  afterEach(() => {
    u.createObjectURL = originalCreateObjectURL
    u.revokeObjectURL = originalRevokeObjectURL
  })

  it('synthesises a download anchor and clicks it', () => {
    const createSpy = vi.fn(() => 'blob:fake')
    const revokeSpy = vi.fn()
    u.createObjectURL = createSpy
    u.revokeObjectURL = revokeSpy

    const clickSpy = vi.fn()
    const realCreate = document.createElement.bind(document)
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = realCreate(tag) as HTMLAnchorElement
        if (tag === 'a') {
          el.click = clickSpy
        }
        return el
      })

    try {
      downloadBlob('hedge-receipts-2026-05-23-1.csv', CSV_MIME, 'a,b\r\n')
      expect(createSpy).toHaveBeenCalledOnce()
      expect(clickSpy).toHaveBeenCalledOnce()
    } finally {
      createElementSpy.mockRestore()
    }
  })

  it('is a no-op outside the browser (no document)', () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, 'document')
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: undefined,
    })
    try {
      expect(() =>
        downloadBlob('x.csv', CSV_MIME, 'a,b\r\n'),
      ).not.toThrow()
    } finally {
      if (desc) Object.defineProperty(globalThis, 'document', desc)
    }
  })

  it('exports stable MIME constants', () => {
    expect(CSV_MIME).toMatch(/text\/csv/)
    expect(JSON_MIME).toMatch(/application\/json/)
  })
})
