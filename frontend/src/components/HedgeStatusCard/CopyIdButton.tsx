'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'

/**
 * Lane 5 — click-to-copy affordance for hedge receipt IDs.
 *
 * Task 0039 capped the visible eToro id at 10ch + truncated tooltip.
 * That fixed the table overflow but broke the *copy* workflow on
 * mobile (no hover, the hidden chars never reach the selection). The
 * order id is the single most copy-and-paste-worthy field in the
 * receipts table — it's what an operator pastes into eToro to verify
 * a demo trade. This button restores one-click copy without changing
 * the visible geometry.
 *
 * On click:
 *   - `event.stopPropagation()` so the future row-level drill-through
 *     (task 0045) doesn't navigate when the operator only wanted to
 *     copy the id.
 *   - `navigator.clipboard.writeText(value)` for the FULL id (not the
 *     truncated `label`).
 *   - On resolve: render a `copied` pill next to the value for 1.5 s
 *     with `aria-live="polite"` so screen readers announce it.
 *   - On reject (insecure context, iframe permissions, browser denial):
 *     fall back to selecting the visible text via a `Range` and
 *     render a `select-all` pill so the operator knows to use
 *     Ctrl/Cmd-C.
 *
 * When `value` is empty / undefined the component renders `placeholder`
 * as a plain non-interactive span, matching the existing `—` fallback
 * for receipts without an `etoroOrderId`.
 */

type CopyStatus = 'idle' | 'copied' | 'select-all'

const RESET_DELAY_MS = 1_500

interface CopyIdButtonProps {
  value: string | undefined
  ariaLabel: string
  label?: ReactNode
  visibleClassName?: string
  placeholder?: ReactNode
  testId?: string
}

export function CopyIdButton({
  value,
  ariaLabel,
  label,
  visibleClassName,
  placeholder,
  testId,
}: CopyIdButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [])

  const scheduleReset = useCallback(() => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setStatus('idle')
    }, RESET_DELAY_MS)
  }, [])

  const handleCopy = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      if (!value) return
      const clipboard = navigator.clipboard
      if (clipboard && typeof clipboard.writeText === 'function') {
        try {
          await clipboard.writeText(value)
          if (mountedRef.current) {
            setStatus('copied')
            scheduleReset()
          }
          return
        } catch {
          // fall through to manual select
        }
      }
      selectVisibleText(buttonRef.current)
      if (mountedRef.current) {
        setStatus('select-all')
        scheduleReset()
      }
    },
    [value, scheduleReset],
  )

  if (!value) {
    return <span>{placeholder ?? '—'}</span>
  }

  return (
    <span className="inline-flex items-center gap-1 align-bottom">
      <button
        ref={buttonRef}
        type="button"
        data-testid={testId}
        onClick={handleCopy}
        aria-label={ariaLabel}
        title={value}
        className={`${visibleClassName ?? ''} cursor-pointer hover:bg-dark-100/40 rounded -mx-0.5 px-0.5`}
      >
        {label ?? value}
      </button>
      <output
        aria-live="polite"
        data-testid={testId ? `${testId}-status` : undefined}
        className={`text-[10px] uppercase tracking-wide ${
          status === 'copied'
            ? 'text-goodgreen'
            : status === 'select-all'
            ? 'text-yellow-300'
            : 'sr-only'
        }`}
      >
        {status === 'copied' ? 'copied' : status === 'select-all' ? 'select-all' : ''}
      </output>
    </span>
  )
}

function selectVisibleText(node: HTMLElement | null): void {
  if (!node) return
  const sel = typeof window !== 'undefined' ? window.getSelection() : null
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(node)
  sel.removeAllRanges()
  sel.addRange(range)
}
