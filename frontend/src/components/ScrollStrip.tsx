import type { ReactNode } from 'react'

interface ScrollStripProps {
  children: ReactNode
  /** Tailwind classes applied to the inner horizontally scrollable container. */
  className?: string
  /** Tailwind classes applied to the outer relative wrapper. */
  wrapperClassName?: string
  /**
   * Tailwind `from-...` class controlling the fade gradient color.
   * Defaults to a theme-aware fade driven by the `--background` CSS variable
   * so the gradient matches the page background in both dark and light modes.
   */
  fadeFromClass?: string
  /** Tailwind width class for the fade gradient (e.g. `w-6`, `w-8`, `w-10`). */
  fadeWidthClass?: string
  /**
   * If provided, the scroll container is announced as a labelled group to
   * assistive tech. Recommended for strips that act as a navigation or
   * filter region.
   */
  ariaLabel?: string
}

/**
 * Horizontally scrolling strip with a fade gradient affordance on the right
 * edge and a cross-browser-hidden scrollbar.
 *
 * Used by category chips, sort options, market pair selectors, and section
 * navs to signal that there is more content off-screen on narrow viewports.
 * Replaces ad-hoc `overflow-x-auto scrollbar-none` markup with hardcoded
 * `from-[#0f1117]` fades that did not match the body background.
 *
 * Task 0086.
 */
export function ScrollStrip({
  children,
  className = '',
  wrapperClassName = '',
  fadeFromClass = 'from-[hsl(var(--background))]',
  fadeWidthClass = 'w-8',
  ariaLabel,
}: ScrollStripProps) {
  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <div
        data-scroll-strip-scroller=""
        className={`overflow-x-auto scrollbar-none ${className}`.trim()}
        {...(ariaLabel
          ? { role: 'group', 'aria-label': ariaLabel }
          : {})}
      >
        {children}
      </div>
      <span
        data-scroll-strip-fade=""
        aria-hidden="true"
        className={`pointer-events-none absolute right-0 top-0 bottom-0 ${fadeWidthClass} bg-gradient-to-l ${fadeFromClass} to-transparent`}
      />
    </div>
  )
}
