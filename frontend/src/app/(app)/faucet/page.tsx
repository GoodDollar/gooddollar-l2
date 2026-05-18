'use client'

import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { AddNetworkButton } from '@/components/AddNetworkButton'
import { getFaucetAddressStatus, isClaimableFaucetAddress } from '@/lib/addressGuard'

export default function FaucetPage() {
  const { address: connectedAddr } = useAccount()
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'cooldown'>('idle')
  const [txHashes, setTxHashes] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const effectiveAddr = address || connectedAddr || ''
  const addrStatus = effectiveAddr ? getFaucetAddressStatus(effectiveAddr) : 'invalid'

  const claim = useCallback(async () => {
    if (!isClaimableFaucetAddress(effectiveAddr)) return
    setStatus('loading')
    setTxHashes([])
    setErrorMsg('')
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: effectiveAddr }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setStatus('cooldown')
          setErrorMsg(data.error || 'Rate limited — try again in 1 hour')
        } else {
          setStatus('error')
          setErrorMsg(data.error || 'Faucet request failed')
        }
        return
      }
      const hashes = Array.isArray(data.txHashes)
        ? data.txHashes.filter((hash: unknown): hash is string => typeof hash === 'string')
        : data.txHash ? [data.txHash] : []
      setTxHashes(hashes)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Network error — please try again')
    }
  }, [effectiveAddr])

  return (
    <div className="w-full max-w-lg mx-auto mt-4 sm:mt-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🚰</div>
        <h1 className="text-3xl font-bold text-white">Testnet Faucet</h1>
        <p className="text-gray-400 mt-2">
          Claim free test G$ and WETH to explore GoodDollar L2
        </p>
      </div>

      {/* Card */}
      <div className="bg-dark-50 border border-white/10 rounded-2xl p-6 space-y-5">
        {/* What you get */}
        <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl p-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">You&apos;ll receive</p>
            <p className="text-white font-bold text-lg mt-0.5">10,000 G$ + 1 WETH + gas ETH</p>
          </div>
          <div className="text-3xl">💰</div>
        </div>

        {/* Add network shortcut */}
        <div
          data-testid="add-network-button-container"
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-dark/40 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-white text-sm font-medium leading-tight">
              First time here?
            </p>
            <p className="text-gray-500 text-xs leading-tight mt-0.5">
              Add the GoodChain Testnet to your wallet in one click.
            </p>
          </div>
          <AddNetworkButton variant="compact" />
        </div>

        {/* Address input */}
        <div>
          <label htmlFor="faucet-addr" className="text-sm text-gray-400 mb-1.5 block">
            Wallet Address
          </label>
          <input
            id="faucet-addr"
            type="text"
            value={address || connectedAddr || ''}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-dark border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-accent/50"
          />
          {effectiveAddr && addrStatus === 'invalid' && (
            <p className="text-red-400 text-xs mt-1">Invalid Ethereum address</p>
          )}
          {effectiveAddr && addrStatus === 'unsupported' && (
            <p className="text-red-400 text-xs mt-1">
              This address can&apos;t receive faucet funds (burn or contract address)
            </p>
          )}
          {connectedAddr && !address && (
            <p className="text-gray-500 text-xs mt-1">Using connected wallet</p>
          )}
        </div>

        {/* Claim button */}
        <button
          onClick={claim}
          disabled={addrStatus !== 'ok' || status === 'loading'}
          className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-dark font-bold py-3 rounded-xl text-base transition-colors"
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-dark/30 border-t-dark rounded-full" />
              Claiming...
            </span>
          ) : (
            'Claim Test Tokens'
          )}
        </button>

        {/* Status messages */}
        {status === 'success' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
            <p className="text-emerald-400 font-semibold">Tokens sent! 🎉</p>
            {txHashes.length > 0 && (
              <div className="text-gray-400 text-xs mt-2 space-y-1 font-mono break-all text-left">
                {txHashes.map((hash, index) => (
                  <p key={hash}>{index === 0 ? 'Gas' : index === 1 ? 'G$' : 'WETH'}: {hash}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-red-400 font-semibold">Error</p>
            <p className="text-gray-400 text-xs mt-1">{errorMsg}</p>
          </div>
        )}

        {status === 'cooldown' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
            <p className="text-yellow-400 font-semibold">⏳ Cooldown Active</p>
            <p className="text-gray-400 text-xs mt-1">{errorMsg}</p>
          </div>
        )}

        {/* Rate limit note */}
        <p className="text-gray-500 text-xs text-center">
          Limited to 1 claim per address per hour
        </p>
      </div>
    </div>
  )
}
