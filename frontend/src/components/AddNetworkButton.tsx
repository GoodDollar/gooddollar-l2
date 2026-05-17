'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DEVNET_CHAIN_ID,
  DEVNET_RPC_URL,
  DEVNET_EXPLORER_URL,
} from '@/lib/devnet'

/**
 * One-click "Add GoodChain Testnet to Wallet" button.
 *
 * Uses EIP-3085 `wallet_addEthereumChain` against the injected provider
 * (window.ethereum) so new testers do not have to copy four values into
 * MetaMask by hand.
 *
 * All network values are sourced from `@/lib/devnet`, which itself is sourced
 * from `op-stack/addresses.json`. This guarantees the button cannot drift from
 * the canonical chain config.
 *
 * Two variants:
 *   - default: full-width primary button on the testnet guide.
 *   - "compact": tighter outline button used above the faucet's address input.
 *
 * Acceptance proof for Iter 13 of docs/TESTNET-READINESS-50-ITERATIONS.md.
 */

type EthereumRequest = (args: {
  method: string
  params?: unknown[]
}) => Promise<unknown>

interface InjectedEthereum {
  request: EthereumRequest
}

// Read window.ethereum through a narrow accessor instead of `declare global`.
// `cbw-sdk` (a transitive dep of @coinbase/wallet-sdk) already declares
// `Window.ethereum?: any`, and re-declaring it with a stricter type triggers
// TS2717 ("subsequent property declarations must have the same type"). The
// accessor keeps our call sites type-safe without fighting the global.
function getInjectedEthereum(): InjectedEthereum | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { ethereum?: InjectedEthereum }
  return w.ethereum
}

type State = 'idle' | 'pending' | 'success' | 'rejected' | 'no-wallet' | 'error'

export interface AddNetworkButtonProps {
  variant?: 'default' | 'compact'
  /**
   * Optional success-state CTA. When present, rendered as a link below the
   * success message (e.g. "Open Faucet →").
   */
  successCta?: { label: string; href: string }
  className?: string
}

function buildParams() {
  return [
    {
      chainId: `0x${DEVNET_CHAIN_ID.toString(16)}`,
      chainName: 'GoodChain Testnet',
      rpcUrls: [DEVNET_RPC_URL],
      blockExplorerUrls: [DEVNET_EXPLORER_URL],
      nativeCurrency: { name: 'GoodDollar', symbol: 'G$', decimals: 18 },
      iconUrls: ['/icons/g-dollar-coin.svg'],
    },
  ] as const
}

export function AddNetworkButton({
  variant = 'default',
  successCta,
  className = '',
}: AddNetworkButtonProps) {
  // Detect wallet only on the client; SSR has no window.
  const [hasWallet, setHasWallet] = useState<boolean>(true)
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    const detected = typeof getInjectedEthereum() !== 'undefined'
    setHasWallet(detected)
    if (!detected) setState('no-wallet')
  }, [])

  const handleClick = useCallback(async () => {
    const eth = getInjectedEthereum()
    if (!eth) {
      setState('no-wallet')
      return
    }
    setState('pending')
    setErrorMsg('')
    try {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: buildParams() as unknown as unknown[],
      })
      setState('success')
    } catch (err: unknown) {
      const code = (err as { code?: number } | null)?.code
      if (code === 4001) {
        setState('rejected')
        return
      }
      const msg =
        err instanceof Error ? err.message : 'Unknown wallet error'
      // Always log the raw error to the console for debugging.
      // eslint-disable-next-line no-console
      console.error('[add-network] wallet_addEthereumChain failed:', err)
      setErrorMsg(msg)
      setState('error')
    }
  }, [])

  if (state === 'no-wallet' || !hasWallet) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 ${className}`}
      >
        <span className="font-medium">No EVM wallet detected.</span>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-300 underline hover:text-amber-100"
        >
          Install MetaMask →
        </a>
      </div>
    )
  }

  const compact = variant === 'compact'
  const buttonLabel = compact
    ? 'Add GoodChain Testnet'
    : 'Add GoodChain Testnet to Wallet'

  const buttonClass = compact
    ? 'inline-flex items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
    : 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-base font-semibold text-dark hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-dark'

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'pending'}
        aria-busy={state === 'pending'}
        className={buttonClass}
      >
        <span aria-hidden className={compact ? 'text-sm' : 'text-lg'}>
          🟢
        </span>
        {state === 'pending' ? 'Asking your wallet…' : buttonLabel}
      </button>
      <p
        role="status"
        aria-live="polite"
        className={`mt-2 text-xs ${
          state === 'success'
            ? 'text-emerald-300'
            : state === 'rejected'
              ? 'text-amber-300'
              : state === 'error'
                ? 'text-red-300'
                : 'text-transparent select-none'
        }`}
      >
        {state === 'success' && (
          <span>
            ✓ GoodChain Testnet added to your wallet
            {successCta && (
              <>
                {' — '}
                <a
                  href={successCta.href}
                  className="underline hover:text-emerald-200"
                >
                  {successCta.label}
                </a>
              </>
            )}
          </span>
        )}
        {state === 'rejected' && (
          <span>You declined the request — click the button to retry.</span>
        )}
        {state === 'error' && (
          <span>
            Could not add the network: {errorMsg || 'unknown wallet error'}.
          </span>
        )}
        {state !== 'success' && state !== 'rejected' && state !== 'error' && (
          <span>&nbsp;</span>
        )}
      </p>
    </div>
  )
}

export default AddNetworkButton
