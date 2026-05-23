import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  __resetPageVisibilityForTests,
  isPageHidden,
  subscribePageVisibility,
} from '@/lib/usePageVisibility'

const originalHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')
const originalVisibility = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => state === 'hidden',
  })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('usePageVisibility', () => {
  beforeEach(() => {
    __resetPageVisibilityForTests()
    setVisibility('visible')
  })

  afterEach(() => {
    __resetPageVisibilityForTests()
    if (originalHidden) {
      Object.defineProperty(Document.prototype, 'hidden', originalHidden)
    }
    if (originalVisibility) {
      Object.defineProperty(Document.prototype, 'visibilityState', originalVisibility)
    }
  })

  it('reports the current visibility state', () => {
    setVisibility('visible')
    expect(isPageHidden()).toBe(false)
    setVisibility('hidden')
    expect(isPageHidden()).toBe(true)
  })

  it('notifies subscribers when visibility changes', () => {
    const listener = vi.fn()
    subscribePageVisibility(listener)

    setVisibility('hidden')
    setVisibility('visible')

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenNthCalledWith(1, true)
    expect(listener).toHaveBeenNthCalledWith(2, false)
  })

  it('detaches the document listener after the last unsubscribe', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const u1 = subscribePageVisibility(() => {})
    const u2 = subscribePageVisibility(() => {})
    u1()
    expect(removeSpy).not.toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    u2()
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })

  it('also responds to window pageshow/pagehide for bfcache transitions', () => {
    const listener = vi.fn()
    subscribePageVisibility(listener)

    window.dispatchEvent(new Event('pagehide'))
    window.dispatchEvent(new Event('pageshow'))

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('treats prerender / unknown visibility states as hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'prerender',
    })
    expect(isPageHidden()).toBe(true)
  })
})
