'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { TransactionProvider } from '@/lib/TransactionContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import WalletProviders from '@/components/WalletProviders'

/**
 * Root providers for the entire app.
 *
 * Includes WagmiProvider / RainbowKitProvider globally because the shared
 * Header owns the primary Connect Wallet button. Keeping the header outside
 * wagmi made that button a fake toast on routes like /faucet while route-local
 * buttons worked, which confused testnet users.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      }),
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <WalletProviders>
          <TransactionProvider>{children}</TransactionProvider>
        </WalletProviders>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
