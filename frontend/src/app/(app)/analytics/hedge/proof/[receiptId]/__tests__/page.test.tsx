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
    const recap = await screen.findByTestId('hedge-proof-recovery-recap')
    expect(recap.textContent).toBe(
      'Endpoint: /api/hedge/proof/rcpt-1 · status: engine_down',
    )
  })

  it('renders the recap with status:no_proof on the per-receipt no_proof branch', async () => {
    mockJson({ status: 'no_proof' }, { status: 404 })
    renderPage('rcpt-2')
    await screen.findByTestId('hedge-proof-error')
    const recap = await screen.findByTestId('hedge-proof-recovery-recap')
    expect(recap.textContent).toBe(
      'Endpoint: /api/hedge/proof/rcpt-2 · status: no_proof',
    )
  })
})
