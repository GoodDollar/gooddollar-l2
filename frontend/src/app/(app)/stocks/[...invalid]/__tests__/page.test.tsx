import { describe, expect, it, vi } from 'vitest'

const { notFoundSpy } = vi.hoisted(() => ({
  notFoundSpy: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('next/navigation', () => ({
  notFound: notFoundSpy,
}))

import StocksInvalidPathPage from '../page'

describe('StocksInvalidPathPage', () => {
  it('routes invalid nested stocks paths to segment not-found', () => {
    expect(() => StocksInvalidPathPage()).toThrowError('NEXT_NOT_FOUND')
    expect(notFoundSpy).toHaveBeenCalledTimes(1)
  })
})
