// Inline SVG icons for HedgeStatusCard. Kept in a dedicated module so
// the main component file can stay focused on state + layout. All icons
// accept an optional `size` prop (default 16 px) so callers like the
// empty-receipts state can render a larger 28 px version without
// duplicating the SVG markup.

interface IconProps {
  size?: number
}

export function ArrowPathIcon({
  spinning = false,
  size = 14,
}: IconProps & { spinning?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'animate-spin' : undefined}
    >
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 4v4h-4" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 20v-4h4" />
    </svg>
  )
}

export function CloudOffIcon({ size = 16 }: IconProps = {}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2l20 20" />
      <path d="M5.78 5.78A6 6 0 003 11a4 4 0 004 4h9.5" />
      <path d="M21 17.5a4 4 0 00-1.83-3.36" />
      <path d="M9 4.07A6 6 0 0119 8.5" />
    </svg>
  )
}

export function AlertTriangleIcon({ size = 16 }: IconProps = {}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </svg>
  )
}

export function InboxIcon({ size = 16 }: IconProps = {}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 13l3-7h12l3 7" />
      <path d="M3 13v6h18v-6h-6a3 3 0 01-6 0H3z" />
    </svg>
  )
}
