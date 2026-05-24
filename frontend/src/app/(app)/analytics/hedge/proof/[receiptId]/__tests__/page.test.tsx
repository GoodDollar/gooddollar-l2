import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PerReceiptProofView, truncateReceiptId } from '../page'

/**
 * Task 0063 — long receipt ids in the per-receipt no_proof title must
 * be collapsed to head…tail in the visible h2 (so the card doesn't
 * overflow narrow viewports), with the full id reachable via the h2's
 * `title=` attribute for copy-paste recovery. Short ids render
 * verbatim so the common case is unchanged.
 */

function mockJson(body: unknown, init: ResponseInit = { status: 200 }) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: init.status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function renderPage(receiptId: string) {
  return render(<PerReceiptProofView receiptId={receiptId} />)
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('truncateReceiptId', () => {
  it('returns ids up to 24 chars verbatim', () => {
    expect(truncateReceiptId('short-id')).toBe('short-id')
    expect(truncateReceiptId('a'.repeat(24))).toBe('a'.repeat(24))
  })

  it('collapses ids longer than 24 chars to head(12)…tail(8)', () => {
    expect(truncateReceiptId('a'.repeat(25))).toBe(
      `${'a'.repeat(12)}…${'a'.repeat(8)}`,
    )
    expect(truncateReceiptId('a'.repeat(200))).toBe(
      `${'a'.repeat(12)}…${'a'.repeat(8)}`,
    )
  })
})

describe('HedgeProofViewerPerReceiptPage — long-id title (#0063)', () => {
  it('renders short ids verbatim in the no_proof title (no truncation)', async () => {
    mockJson({ status: 'no_proof' }, { status: 404 })
    renderPage('short-id')
    const heading = await screen.findByRole('heading', { level: 2 })
    expect(heading.textContent).toBe('Proof not found for receipt short-id')
    expect(heading.getAttribute('title')).toBeNull()
  })

  it('truncates ids longer than 24 chars to head…tail in the no_proof title', async () => {
    mockJson({ status: 'no_proof' }, { status: 404 })
    const longId = 'a'.repeat(200)
    renderPage(longId)
    const heading = await screen.findByRole('heading', { level: 2 })
    const expected = `Proof not found for receipt ${'a'.repeat(12)}…${'a'.repeat(8)}`
    expect(heading.textContent).toBe(expected)
  })

  it('surfaces the full id via the h2 title attribute when truncated', async () => {
    mockJson({ status: 'no_proof' }, { status: 404 })
    const longId = 'a'.repeat(200)
    renderPage(longId)
    const heading = await screen.findByRole('heading', { level: 2 })
    expect(heading.getAttribute('title')).toBe(longId)
  })

  it('renders a 24-char id verbatim (right at the truncation threshold)', async () => {
    mockJson({ status: 'no_proof' }, { status: 404 })
    const id = 'a'.repeat(24)
    renderPage(id)
    const heading = await screen.findByRole('heading', { level: 2 })
    expect(heading.textContent).toBe(`Proof not found for receipt ${id}`)
    expect(heading.getAttribute('title')).toBeNull()
  })
})

describe('HedgeProofViewerPerReceiptPage — error-state recovery row (#0071)', () => {
  it('suppresses the raw markdown link (no rawMarkdownHref on the per-receipt page)', async () => {
    mockJson(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    )
    renderPage('rcpt-1')
    await screen.findByTestId('hedge-proof-error')
    const row = await screen.findByTestId('hedge-proof-recovery-row')
    expect(
      row.querySelector('[data-testid="hedge-proof-recovery-raw-link"]'),
    ).toBeNull()
  })

  it('renders the jump-to-receipts link with the same anchor as the latest viewer', async () => {
    mockJson(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    )
    renderPage('rcpt-1')
    await screen.findByTestId('hedge-proof-error')
    const jump = await screen.findByTestId('hedge-proof-recovery-jump-link')
    expect(jump.getAttribute('href')).toBe('/analytics#hedge-status-card')
  })

  it('renders the recap with the per-receipt endpoint and the resolved status', async () => {
    mockJson(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    )
    renderPage('rcpt-1')
    await screen.findByTestId('hedge-proof-error')
    expect(
      screen.getByTestId('hedge-proof-recovery-recap-endpoint').textContent,
    ).toBe('Endpoint: /api/hedge/proof/rcpt-1')
    expect(
      screen.getByTestId('hedge-proof-recovery-recap-status').textContent,
    ).toBe('status: engine_down')
  })

  it('renders the recap with status:no_proof on the per-receipt no_proof branch', async () => {
    mockJson({ status: 'no_proof' }, { status: 404 })
    renderPage('rcpt-2')
    await screen.findByTestId('hedge-proof-error')
    expect(
      screen.getByTestId('hedge-proof-recovery-recap-endpoint').textContent,
    ).toBe('Endpoint: /api/hedge/proof/rcpt-2')
    expect(
      screen.getByTestId('hedge-proof-recovery-recap-status').textContent,
    ).toBe('status: no_proof')
  })
})

describe('HedgeProofViewerPerReceiptPage — recap line truncation for long receipt ids (#0073)', () => {
  it('renders the endpoint and status as separate child spans (no single-line concat)', async () => {
    mockJson(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    )
    renderPage('a'.repeat(200))
    await screen.findByTestId('hedge-proof-error')
    const recap = await screen.findByTestId('hedge-proof-recovery-recap')
    const fullEndpoint = `/api/hedge/proof/${encodeURIComponent('a'.repeat(200))}`
    const endpointSpan = recap.querySelector(
      '[data-testid="hedge-proof-recovery-recap-endpoint"]',
    )
    expect(endpointSpan).not.toBeNull()
    expect(endpointSpan!.textContent).toBe(`Endpoint: ${fullEndpoint}`)
    expect(endpointSpan!.className).toMatch(/\btruncate\b/)
    expect(endpointSpan!.getAttribute('title')).toBe(fullEndpoint)
    const statusSpan = screen.getByTestId('hedge-proof-recovery-recap-status')
    expect(statusSpan.textContent).toBe('status: engine_down')
  })

  it('applies min-w-0 on the recap container so truncate clips inside flex/grid ancestors', async () => {
    mockJson(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    )
    renderPage('a'.repeat(200))
    const recap = await screen.findByTestId('hedge-proof-recovery-recap')
    expect(recap.className).toMatch(/\bmin-w-0\b/)
  })

  it('preserves the same two-span shape for short ids (regression — no special-case)', async () => {
    mockJson(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    )
    renderPage('abc')
    await screen.findByTestId('hedge-proof-error')
    const endpointSpan = screen
      .getByTestId('hedge-proof-recovery-recap')
      .querySelector('[data-testid="hedge-proof-recovery-recap-endpoint"]')
    expect(endpointSpan!.textContent).toBe('Endpoint: /api/hedge/proof/abc')
    expect(endpointSpan!.getAttribute('title')).toBe('/api/hedge/proof/abc')
    expect(
      screen.getByTestId('hedge-proof-recovery-recap-status').textContent,
    ).toBe('status: engine_down')
  })
})

describe('HedgeProofViewerPerReceiptPage — invalid_id Retry suppression (#0072)', () => {
  it('omits the Retry button on invalid_id and renders an Open receipts table link', async () => {
    mockJson(
      { status: 'invalid_id', reason: 'Receipt id is too long' },
      { status: 400 },
    )
    renderPage('a'.repeat(200))
    await screen.findByTestId('hedge-proof-error')
    expect(screen.queryByTestId('hedge-proof-retry')).toBeNull()
    const link = screen.getByRole('link', { name: /open receipts table/i })
    expect(link.getAttribute('href')).toBe('/analytics#hedge-status-card')
  })

  it('keeps the Retry button on engine_down (regression — Retry is still appropriate)', async () => {
    mockJson(
      { status: 'engine_down', reason: 'Hedge engine unreachable' },
      { status: 502 },
    )
    renderPage('rcpt-1')
    await screen.findByTestId('hedge-proof-error')
    expect(screen.getByTestId('hedge-proof-retry')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /open receipts table/i }),
    ).toBeNull()
  })

  it('still renders the error card title and detail on the invalid_id branch', async () => {
    mockJson(
      { status: 'invalid_id', reason: 'Receipt id is too long' },
      { status: 400 },
    )
    renderPage('a'.repeat(200))
    const card = await screen.findByTestId('hedge-proof-error')
    expect(card.textContent).toMatch(/Receipt id was rejected/i)
    expect(card.textContent).toMatch(/Receipt id is too long/)
  })
})
