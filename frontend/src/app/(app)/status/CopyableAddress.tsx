'use client'

/**
 * CopyableAddress — renders a long hex address (signer, oracle, tx hash)
 * truncated to `0x1234…cdef` plus a small copy-to-clipboard control.
 *
 * The full address is intentionally NOT placed in the DOM at rest; we
 * truncate the visible string and feed the full value through
 * `navigator.clipboard.writeText` when the user clicks copy. Screen
 * readers get the full value via `aria-label` so the abbreviation does
 * not hide the underlying identifier.
 */

import { useCallback, useState } from 'react'

interface Props {
  address: string | null | undefined
  label: string
  // Lead/tail glyph counts for the truncated form (e.g. 6/6 → 0x1234…cdef).
  lead?: number
  tail?: number
}

function truncate(addr: string, lead: number, tail: number): string {
  if (addr.length <= lead + tail + 1) return addr
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`
}

export function CopyableAddress({ address, label, lead = 6, tail = 6 }: Props) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  const copy = useCallback(async () => {
    if (!address) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setError(false)
        setTimeout(() => setCopied(false), 1500)
      }
    } catch {
      setError(true)
      setTimeout(() => setError(false), 1500)
    }
  }, [address])

  if (!address) {
    return (
      <span className="font-mono text-xs text-gray-500" data-testid={`copyable-${label}`}>
        not configured
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-300"
      data-testid={`copyable-${label}`}
    >
      <span aria-label={`${label}: ${address}`} title={address}>
        {truncate(address, lead, tail)}
      </span>
      <button
        type="button"
        onClick={copy}
        className="text-gray-500 hover:text-goodgreen transition-colors text-[10px] underline underline-offset-2"
        aria-label={`Copy ${label} address ${address}`}
      >
        {copied ? 'copied' : error ? 'copy failed' : 'copy'}
      </button>
    </span>
  )
}
