import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const pathnameState = { value: '/stocks' }

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameState.value,
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ address: undefined }),
  }
})

import { FeedbackButton } from '../FeedbackButton'

describe('FeedbackButton route-aware positioning', () => {
  it('uses compact stocks positioning classes on /stocks routes', () => {
    pathnameState.value = '/stocks'
    render(<FeedbackButton />)

    const button = screen.getByRole('button', { name: /send feedback/i })
    expect(button.className).toContain('bottom-4')
    expect(button.className).toContain('right-3')
  })

  it('uses default global positioning on non-stocks routes', () => {
    pathnameState.value = '/predict'
    render(<FeedbackButton />)

    const button = screen.getByRole('button', { name: /send feedback/i })
    expect(button.className).toContain('bottom-6')
    expect(button.className).toContain('right-6')
  })
})
