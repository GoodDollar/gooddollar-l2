import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock fs module before importing the component
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: vi.fn(),
    },
  }
})

import Lane1RunbookPage from '../page'
import { promises as fsPromises } from 'fs'

beforeEach(() => {
  vi.mocked(fsPromises.readFile).mockReset()
})

describe('Lane1RunbookPage (task 0065)', () => {
  it('renders the runbook body when the markdown file is readable', async () => {
    const sampleRunbook =
      '# Lane 1 — produce a live-prices-on-chain proof\n\n' +
      'Operator runbook for the **first** artifact.\n'
    vi.mocked(fsPromises.readFile).mockResolvedValue(sampleRunbook)

    const ui = await Lane1RunbookPage()
    render(ui)

    expect(screen.getByTestId('lane1-runbook-body')).toBeInTheDocument()
    expect(screen.getByText(/Lane 1 — produce a live-prices-on-chain proof/)).toBeInTheDocument()
    expect(screen.getByTestId('lane1-runbook-back-link').getAttribute('href')).toBe('/lane1')
  })

  it('renders a degraded recovery panel when the runbook file is missing', async () => {
    const enoent = Object.assign(new Error('ENOENT: no such file or directory'), {
      code: 'ENOENT',
    })
    vi.mocked(fsPromises.readFile).mockRejectedValue(enoent)

    const ui = await Lane1RunbookPage()
    render(ui)

    const missing = screen.getByTestId('lane1-runbook-missing')
    expect(missing).toBeInTheDocument()
    expect(missing.textContent).toContain('ENOENT')
    expect(missing.textContent).toContain('docs/runbooks/lane1-live-prices-on-chain.md')
  })
})
