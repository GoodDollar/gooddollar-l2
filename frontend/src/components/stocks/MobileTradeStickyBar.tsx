'use client'

import { useEffect, useState, type RefObject } from 'react'

interface MobileTradeStickyBarProps {
  targetRef: RefObject<HTMLDivElement | null>
  ticker: string
}

export function MobileTradeStickyBar({ targetRef, ticker }: MobileTradeStickyBarProps) {
  const [isFormVisible, setIsFormVisible] = useState(false)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsFormVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [targetRef])

  if (isFormVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      <div className="bg-dark-100/90 backdrop-blur-lg border-t border-gray-700/30 px-4 py-3 safe-area-pb">
        <button
          type="button"
          onClick={() => targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="w-full py-3 rounded-xl bg-goodgreen hover:bg-goodgreen/90 text-white font-semibold text-sm transition-colors active:scale-[0.98]"
        >
          Trade {ticker}
        </button>
      </div>
    </div>
  )
}
