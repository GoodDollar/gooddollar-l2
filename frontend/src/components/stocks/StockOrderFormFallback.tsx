'use client'

export function StockOrderFormFallback() {
  return (
    <div
      className="bg-dark-100 rounded-2xl border border-gray-700/20 p-5"
      role="status"
      aria-live="polite"
      aria-label="Loading trade panel"
      data-testid="stocks-order-form-fallback"
    >
      <p className="text-sm font-semibold text-white mb-1">Preparing trade panel…</p>
      <p className="text-xs text-gray-400 mb-4">Loading Buy/Sell controls and order inputs.</p>

      <div className="grid grid-cols-2 gap-2 mb-4 animate-pulse">
        <button
          type="button"
          aria-label="Buy (loading)"
          disabled
          className="py-2 rounded-lg border border-green-500/20 bg-green-500/10 text-green-300/70 text-sm font-semibold cursor-not-allowed"
        >
          Buy
        </button>
        <button
          type="button"
          aria-label="Sell (loading)"
          disabled
          className="py-2 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300/70 text-sm font-semibold cursor-not-allowed"
        >
          Sell
        </button>
      </div>

      <div className="space-y-2.5 mb-4 animate-pulse">
        <div className="h-9 rounded-xl bg-dark-50/60" />
        <div className="h-9 rounded-xl bg-dark-50/50" />
        <div className="h-12 rounded-xl bg-dark-50/60" />
      </div>

      <button
        type="button"
        aria-label="Connect wallet (loading)"
        disabled
        className="w-full py-3 rounded-xl font-semibold text-sm bg-goodgreen/35 text-black/70 cursor-not-allowed"
      >
        Connect Wallet to Trade
      </button>
    </div>
  )
}
