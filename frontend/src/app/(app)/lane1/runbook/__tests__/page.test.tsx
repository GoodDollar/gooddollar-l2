import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import Lane1RunbookPage from '../page'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Lane1RunbookPage (task 0065)', () => {
  it('renders the shipped runbook body when the markdown file is readable', async () => {
    const ui = await Lane1RunbookPage()
    render(ui)

    expect(screen.getByTestId('lane1-runbook-body')).toBeInTheDocument()
    expect(screen.getByText(/Lane 1 — produce a live-prices-on-chain proof/)).toBeInTheDocument()
    expect(screen.getByTestId('lane1-runbook-back-link').getAttribute('href')).toBe('/lane1')
  })

  it('renders a degraded recovery panel when the runbook file is missing', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/tmp/lane1-runbook-missing-test/frontend')

    const ui = await Lane1RunbookPage()
    render(ui)

    const missing = screen.getByTestId('lane1-runbook-missing')
    expect(missing).toBeInTheDocument()
    expect(missing.textContent).toContain('ENOENT')
    expect(missing.textContent).toContain('docs/runbooks/lane1-live-prices-on-chain.md')
  })
})
