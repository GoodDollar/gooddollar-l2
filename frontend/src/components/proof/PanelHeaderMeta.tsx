import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

/**
 * Shared header-meta rail for the four proof data panels. Every panel's
 * right-hand header content goes through this helper so the four panels
 * read as one family: text-xs text-gray-500, a mono machine-identifier
 * source atom on the left, a sans cadence/scope atom on the right,
 * joined by a single middot.
 *
 * Renders nothing when both atoms are absent (no standalone em-dash
 * placeholder). The middot is only drawn when both atoms are present.
 */

interface PanelHeaderMetaProps {
  /** Source atom: host, contract address, or short filename. */
  source?: ReactNode
  /** Cadence / scope atom: refresh rate, event count, mode tag. */
  cadence?: ReactNode
}

export function PanelHeaderMeta({ source, cadence }: PanelHeaderMetaProps) {
  if (!source && !cadence) return null
  return (
    <div
      data-testid="panel-header-meta"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500"
    >
      {source}
      {source && cadence ? <span aria-hidden>·</span> : null}
      {cadence}
    </div>
  )
}

type SpanRest = Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'title' | 'children'>

interface MonoSourceAtomProps extends SpanRest {
  value: string
  title?: string
}

export function MonoSourceAtom({ value, title, ...rest }: MonoSourceAtomProps) {
  return (
    <span
      className="font-mono text-gray-400 truncate max-w-[55%]"
      title={title ?? value}
      {...rest}
    >
      {value}
    </span>
  )
}

type AnchorRest = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'href' | 'title' | 'children' | 'target' | 'rel'>

interface MonoLinkAtomProps extends AnchorRest {
  value: string
  href: string
  title?: string
}

export function MonoLinkAtom({ value, href, title, ...rest }: MonoLinkAtomProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-gray-400 truncate max-w-[55%] underline-offset-2 hover:text-accent hover:underline transition-colors"
      title={title ?? value}
      {...rest}
    >
      {value} ↗
    </a>
  )
}

/** `0x4899…42b7` — short form suitable for inline rail metadata. */
export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Trim a long file path to its last two `/`-separated segments. */
export function shortenSourcePath(path: string): string {
  if (!path) return path
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 2) return parts.join('/')
  return parts.slice(-2).join('/')
}
