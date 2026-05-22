'use client'

import { usePathname } from 'next/navigation'

/**
 * Lightweight page-transition wrapper using CSS @keyframes (defined in globals.css).
 *
 * Replaces the previous framer-motion implementation to eliminate ~70 KB
 * compressed from the global bundle. The enter animation (fade + slide-up)
 * is identical; the exit animation is dropped (imperceptible at 180 ms).
 *
 * `prefers-reduced-motion` disables animation via CSS media query.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="page-transition-enter flex-1 flex flex-col items-center w-full">
      {children}
    </div>
  )
}
