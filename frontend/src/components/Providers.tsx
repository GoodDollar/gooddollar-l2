'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { TransactionProvider } from '@/lib/TransactionContext'
import { ThemeProvider } from '@/components/ThemeProvider'

/**
 * Root providers for the entire app.
 *
 * Intentionally does NOT include WagmiProvider / RainbowKitProvider /
 * @rainbow-me/rainbowkit styles. Those are 3.2 MB of JS that should only
 * load for routes that actually need a wallet connection.
 *
 * Web3-dependent providers live in `src/components/WalletProviders.tsx` and
 * are mounted by `src/app/(app)/layout.tsx` for the wagmi-using route group.
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
        <TransactionProvider>{children}</TransactionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
