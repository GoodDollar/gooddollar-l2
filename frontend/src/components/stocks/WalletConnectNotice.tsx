'use client'

interface WalletConnectNoticeProps {
  className?: string
}

export function WalletConnectNotice({ className = '' }: WalletConnectNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 ${className}`.trim()}
    >
      Mobile wallet QR connections are temporarily unavailable in this environment. Use an injected browser wallet, or ask ops to set <code className="text-amber-100">NEXT_PUBLIC_WC_PROJECT_ID</code>.
    </div>
  )
}

