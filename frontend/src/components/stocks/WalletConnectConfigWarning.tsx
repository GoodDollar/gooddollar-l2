'use client'

import { isWalletConnectConfigured } from '@/lib/walletConnectConfig'

interface WalletConnectConfigWarningProps {
  className?: string
}

export function WalletConnectConfigWarning({ className = '' }: WalletConnectConfigWarningProps) {
  if (isWalletConnectConfigured) return null

  return (
    <div
      role="status"
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 ${className}`.trim()}
    >
      Mobile wallet connectors are unavailable in this environment. Use an injected browser wallet, or configure WalletConnect project ID.
    </div>
  )
}
