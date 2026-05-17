'use client'

import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'
import { WalletReadyContext } from '@/lib/WalletReadyContext'

import '@rainbow-me/rainbowkit/styles.css'

/**
 * Wallet / web3 providers.
 *
 * Mounted only for routes that need wagmi (the `(app)` route group), so the
 * 3.2 MB web3 vendor bundle is not pulled into marketing/info pages such as
 * the landing page.
 */
export default function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: '#00B0A0',
          accentColorForeground: '#071311',
          borderRadius: 'medium',
        })}
      >
        <WalletReadyContext.Provider value={true}>{children}</WalletReadyContext.Provider>
      </RainbowKitProvider>
    </WagmiProvider>
  )
}
