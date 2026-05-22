'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletButtonConnected() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain

        return (
          <div
            className="shrink-0"
            {...(!mounted && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    aria-label="Connect Wallet"
                    className="px-2.5 sm:px-4 py-2 rounded-xl bg-goodgreen/10 border border-goodgreen/30 text-goodgreen text-sm font-medium hover:bg-goodgreen/10 transition-colors whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="px-2.5 sm:px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs sm:text-sm font-medium hover:bg-red-500/20 transition-colors whitespace-nowrap"
                  >
                    Wrong Network
                  </button>
                )
              }

              return (
                <button
                  onClick={openAccountModal}
                  aria-label={`Wallet account ${account.displayName}`}
                  className="flex max-w-[5.5rem] sm:max-w-none items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-dark-50 border border-gray-700/50 hover:border-goodgreen/30 transition-colors"
                >
                  <div className="w-2 h-2 shrink-0 rounded-full bg-goodgreen" />
                  <span className="min-w-0 max-w-[4.25rem] truncate text-sm text-white font-medium sm:max-w-none">
                    {account.displayName}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {account.displayBalance}
                  </span>
                </button>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
