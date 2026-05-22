import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MobileTradeStickyBar } from '../MobileTradeStickyBar'
import { createRef } from 'react'

let observerCallback: (entries: Array<{ isIntersecting: boolean }>) => void

class MockIntersectionObserver {
  constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
    observerCallback = cb
  }
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

describe('MobileTradeStickyBar', () => {
  it('renders trade button with ticker', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <>
        <div ref={ref} />
        <MobileTradeStickyBar ticker="AAPL" targetRef={ref} />
      </>
    )
    expect(screen.getByRole('button', { name: /trade aapl/i })).toBeInTheDocument()
  })

  it('hides when target is visible', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <>
        <div ref={ref} />
        <MobileTradeStickyBar ticker="TSLA" targetRef={ref} />
      </>
    )
    act(() => {
      observerCallback([{ isIntersecting: true }])
    })
    expect(screen.queryByRole('button', { name: /trade tsla/i })).not.toBeInTheDocument()
  })

  it('scrolls to target on click', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(
      <>
        <div ref={ref} />
        <MobileTradeStickyBar ticker="NVDA" targetRef={ref} />
      </>
    )
    const scrollSpy = vi.fn()
    if (ref.current) {
      ref.current.scrollIntoView = scrollSpy
    }
    fireEvent.click(screen.getByRole('button', { name: /trade nvda/i }))
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })
})
