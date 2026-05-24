import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import TestsPage from '../page'

describe('TestsPage', () => {
  it('shows the all-tests inventory including Playwright', () => {
    render(<TestsPage />)

    expect(screen.getByRole('heading', { name: /all tests, one page/i })).toBeInTheDocument()
    expect(screen.getByText('Playwright E2E')).toBeInTheDocument()
    expect(screen.getAllByText(/cd frontend && npm run test:e2e:all/).length).toBeGreaterThan(0)
    expect(screen.getByText(/frontend\/e2e\/app-regression\.spec\.ts/)).toBeInTheDocument()
    expect(screen.getByText('Frontend Vitest + Testing Library')).toBeInTheDocument()
    expect(screen.getByText('All Playwright images')).toBeInTheDocument()
    expect(screen.getByText('Blockchain transactions')).toBeInTheDocument()
  })
})
