'use client'

import { isWalletConnectConfigured } from '@/lib/walletConnectReadiness'
import { WalletConnectNotice } from '@/components/stocks/WalletConnectNotice'
import { StocksConnectFallbackRail } from '@/components/stocks/StocksConnectFallbackRail'

interface StocksOnboardingCardProps {
  onPrepareBrowse: () => void
  onStartTrading: () => void
}

export function StocksOnboardingCard({
  onPrepareBrowse,
  onStartTrading,
}: StocksOnboardingCardProps) {
  const walletConnectConfigured = isWalletConnectConfigured()
  const showDisconnectedFunnel = !walletConnectConfigured

  return (
    <div className="mb-4 p-4 sm:p-5 rounded-2xl border border-goodgreen/25 bg-gradient-to-r from-goodgreen/10 to-goodgreen/5">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white">
            {showDisconnectedFunnel ? 'Start Your Stocks Journey' : 'Connect Wallet to Trade Stocks'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Get started in under a minute: connect wallet, pick a stock, place your first buy or sell order.
          </p>
          <div className="mt-2">
            <p className="text-[11px] sm:text-xs font-medium text-goodgreen">How to start</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-gray-600/60 bg-dark-100/60 px-2 py-0.5 text-[11px] text-gray-200">1. Connect wallet</span>
              <span className="rounded-full border border-gray-600/60 bg-dark-100/60 px-2 py-0.5 text-[11px] text-gray-200">2. Choose a stock</span>
              <span className="rounded-full border border-gray-600/60 bg-dark-100/60 px-2 py-0.5 text-[11px] text-gray-200">3. Place your first trade</span>
            </div>
          </div>
          {showDisconnectedFunnel && (
            <>
              <WalletConnectNotice className="mt-3" />
              <StocksConnectFallbackRail
                onUseInBrowserWallet={onStartTrading}
                onTryAnotherConnector={onStartTrading}
                onContinueReadOnly={onPrepareBrowse}
              />
            </>
          )}
        </div>
        {walletConnectConfigured && (
          <button
            onClick={onStartTrading}
            className="shrink-0 self-start px-4 py-2.5 rounded-xl bg-goodgreen text-[#031615] font-semibold text-sm hover:bg-[#22c5b6] active:bg-[#00a697] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/70 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100 transition-colors"
          >
            Open Featured Stock to Start Trading
          </button>
        )}
      </div>
    </div>
  )
}
