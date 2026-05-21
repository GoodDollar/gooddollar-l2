'use client'

interface StocksConnectFallbackRailProps {
  onUseInBrowserWallet: () => void
  onTryAnotherConnector: () => void
  onContinueReadOnly: () => void
  continueLabel?: string
}

export function StocksConnectFallbackRail({
  onUseInBrowserWallet,
  onTryAnotherConnector,
  onContinueReadOnly,
  continueLabel = 'Continue in Read-only Mode',
}: StocksConnectFallbackRailProps) {
  return (
    <div className="mt-3 rounded-xl border border-goodgreen/25 bg-goodgreen/5 p-3">
      <p className="text-[11px] font-medium text-goodgreen">Connection fallback options</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-goodgreen/35 bg-goodgreen/10 px-2 py-0.5 text-[10px] text-goodgreen">
          In-browser wallet: available
        </span>
        <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
          Mobile QR: unavailable
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onUseInBrowserWallet}
          className="rounded-lg bg-goodgreen px-3 py-2 text-xs font-semibold text-[#031615] hover:bg-[#22c5b6] transition-colors"
        >
          Use In-browser Wallet
        </button>
        <button
          type="button"
          onClick={onTryAnotherConnector}
          className="rounded-lg border border-gray-600/70 bg-dark-100/70 px-3 py-2 text-xs font-semibold text-gray-200 hover:border-goodgreen/50 hover:text-white transition-colors"
        >
          Try Another Connector
        </button>
        <button
          type="button"
          onClick={onContinueReadOnly}
          className="rounded-lg px-2 py-2 text-xs font-semibold text-goodgreen hover:text-[#22c5b6] transition-colors"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  )
}
