'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DEVNET_RPC_URL, DEVNET_CHAIN_ID, CONTRACTS as DEVNET_CONTRACTS } from '@/lib/devnet'
import { rpcCall as rpcCallStrict, RpcError } from '@/lib/rpc'
import type { EthBlock, EthReceipt, EthHex } from '@/lib/eth-types'
import { Skeleton } from '@/components/ui/skeleton'
import { computeBarHeights } from './block-timeline'
import { ActivityPriceStrip } from '@/components/ActivityPriceStrip'

const RPC_URL = '/api/rpc'

// Visibility-gated polling cadence — see task 0096. Tab-hidden ticks become
// no-ops so a forgotten tab cannot pummel the RPC. Value stays at 10s for
// continuity with the previous behaviour; out of scope to change it here.
const POLL_INTERVAL_MS = 10_000

const TESTERS = [
  { name: 'Tester Alpha', role: 'Swaps & Lending', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', color: '#10b981', emoji: '🟢' },
  { name: 'Tester Beta', role: 'Perps & Predictions', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', color: '#f59e0b', emoji: '🟡' },
  { name: 'Tester Gamma', role: 'Stocks & Stress', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', color: '#ef4444', emoji: '🔴' },
]

// Reverse map: lowercase address → contract name, derived from canonical devnet config
const CONTRACTS: Record<string, string> = Object.fromEntries(
  Object.entries(DEVNET_CONTRACTS).map(([name, addr]) => [(addr as string).toLowerCase(), name])
)

const TESTER_ADDRS = new Set(TESTERS.map(t => t.address.toLowerCase()))

// Strict JSON-RPC helper — throws RpcError on any error path (non-2xx,
// JSON-RPC error envelope, missing result, network failure, 4s timeout).
// Previously this was an inline helper that swallowed errors and returned
// `undefined`, which `hexToNumber(undefined)` coerced to `0`, rendering as
// "Block #0" beside a green "Live" pulse. See task 0069.
function rpcCall<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
  return rpcCallStrict<T>(RPC_URL, method, params)
}

function hexToNumber(hex: string | undefined | null): number {
  if (!hex) return 0
  return parseInt(hex, 16)
}

function hexToEth(hex: string | undefined | null): string {
  if (!hex) return '0.0000'
  const wei = BigInt(hex)
  const eth = Number(wei) / 1e18
  return eth.toFixed(eth < 1 ? 4 : 2)
}

function shortenHash(hash: string): string {
  return hash.slice(0, 10) + '…' + hash.slice(-6)
}

function getContractName(addr: string): string {
  return CONTRACTS[addr.toLowerCase()] || shortenHash(addr)
}

function getTesterInfo(addr: string) {
  return TESTERS.find(t => t.address.toLowerCase() === addr.toLowerCase())
}

function timeAgo(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

interface TxInfo {
  hash: string
  from: string
  to: string
  value: string
  blockNumber: number
  timestamp: number
  status: 'success' | 'failed' | 'pending'
  gasUsed: string
  contractName: string
}

interface TesterStats {
  address: string
  balance: string
  nonce: number
  name: string
  role: string
  color: string
  emoji: string
}

interface BlockInfo {
  number: number
  txCount: number
  timestamp: number
}

export default function ActivityClient() {
  const [transactions, setTransactions] = useState<TxInfo[]>([])
  const [testerStats, setTesterStats] = useState<TesterStats[]>([])
  const [blocks, setBlocks] = useState<BlockInfo[]>([])
  const [contractHits, setContractHits] = useState<Record<string, number>>({})
  const [currentBlock, setCurrentBlock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  // RpcError surfaces fetch failures as a visible banner with retry, instead
  // of silently anchoring the page at "Block #0" with a green "Live" pulse.
  const [rpcError, setRpcError] = useState<RpcError | null>(null)

  // Cache the last block we performed the expensive 20-block sweep on.
  // On a quiet chain the head advances slower than the 10s poll cadence,
  // so re-fetching 20 blocks + ~40 receipts + 3×2 tester calls on every
  // tick is pure waste. See task 0096.
  const lastFetchedBlockRef = useRef<number>(-1)

  const fetchData = useCallback(async () => {
    try {
      // Get latest block number. This is the only call we ALWAYS issue —
      // the rest of the sweep short-circuits if the head hasn't advanced.
      const blockHex = await rpcCall<string>('eth_blockNumber')
      const latestBlock = hexToNumber(blockHex)
      setCurrentBlock(latestBlock)

      // Short-circuit on unchanged head: the "Updated" timestamp still
      // ticks (gives a live-pulse feel) but we skip the heavy fanout.
      if (latestBlock === lastFetchedBlockRef.current) {
        setLastUpdate(new Date())
        setRpcError(null)
        return
      }

      // Fetch last 20 blocks. Type the promise as `EthBlock | null` —
      // anvil can return `null` for not-yet-mined blocks at the head, so we
      // narrow inside the loop instead of asserting non-null here.
      const blockPromises: Promise<EthBlock | null>[] = []
      const start = Math.max(0, latestBlock - 19)
      for (let i = latestBlock; i >= start; i--) {
        blockPromises.push(
          rpcCall<EthBlock | null>('eth_getBlockByNumber', ['0x' + i.toString(16), true])
        )
      }
      const blockResults = await Promise.all(blockPromises)

      const newBlocks: BlockInfo[] = []
      const hits: Record<string, number> = {}

      // Pass 1: walk blocks, collect tx metadata + dispatch receipt requests.
      // Previously the receipt fetch was awaited inside the for-loop, which
      // serialized N receipts back-to-back (~20 blocks × 2 txs = 40 round-trips
      // at one round-trip-per-tick). We now build all (tx, receiptPromise)
      // pairs and Promise.all them together below. See task 0096.
      type Pending = {
        tx: NonNullable<EthBlock['transactions']>[number]
        blockNum: number
        timestamp: number
        receiptPromise: Promise<EthReceipt | null>
      }
      const pending: Pending[] = []

      for (const block of blockResults) {
        if (!block) continue
        const blockNum = hexToNumber(block.number)
        const timestamp = hexToNumber(block.timestamp)
        const txs = block.transactions || []

        newBlocks.push({ number: blockNum, txCount: txs.length, timestamp })

        for (const tx of txs) {
          const toAddr = tx.to?.toLowerCase() || ''
          const contractName = CONTRACTS[toAddr]
          if (contractName) {
            hits[contractName] = (hits[contractName] || 0) + 1
          }

          // Wrap the receipt call so a single failure cannot reject the
          // outer Promise.all — receipts may be `null` for in-flight txs.
          const receiptPromise = rpcCall<EthReceipt | null>(
            'eth_getTransactionReceipt',
            [tx.hash],
          ).catch(() => null as EthReceipt | null)

          pending.push({ tx, blockNum, timestamp, receiptPromise })
        }
      }

      // Pass 2: await ALL receipts in parallel.
      const receipts = await Promise.all(pending.map((p) => p.receiptPromise))

      const allTxs: TxInfo[] = pending.map((p, i) => {
        const receipt = receipts[i]
        const toAddr = p.tx.to?.toLowerCase() || ''
        let status: 'success' | 'failed' | 'pending' = 'pending'
        let gasUsed = '0'
        if (receipt) {
          status = receipt.status === '0x1' ? 'success' : 'failed'
          gasUsed = hexToNumber(receipt.gasUsed).toLocaleString()
        }
        return {
          hash: p.tx.hash,
          from: p.tx.from,
          to: p.tx.to || '(contract creation)',
          value: p.tx.value,
          blockNumber: p.blockNum,
          timestamp: p.timestamp,
          status,
          gasUsed,
          contractName: CONTRACTS[toAddr] || '',
        }
      })

      setBlocks(newBlocks)
      setTransactions(allTxs.slice(0, 50))
      setContractHits(hits)

      // Fetch tester stats. Both calls return a 0x-prefixed hex string;
      // typing them as `EthHex` keeps `hexToEth` / `hexToNumber` strict.
      const testerPromises = TESTERS.map(async (t) => {
        const [balHex, nonceHex] = await Promise.all([
          rpcCall<EthHex>('eth_getBalance', [t.address, 'latest']),
          rpcCall<EthHex>('eth_getTransactionCount', [t.address, 'latest']),
        ])
        return {
          ...t,
          balance: hexToEth(balHex),
          nonce: hexToNumber(nonceHex),
        }
      })
      setTesterStats(await Promise.all(testerPromises))

      // Only record the new head AFTER all the heavy fetches succeeded —
      // a thrown RpcError in the middle of the sweep must NOT mark the
      // block as "already fetched", or the retry button would short-circuit.
      lastFetchedBlockRef.current = latestBlock
      setLastUpdate(new Date())
      setLoading(false)
      setRpcError(null)
    } catch (e) {
      if (e instanceof RpcError) {
        // Rate limits / upstream RPC failures are surfaced in the page banner;
        // keep them out of console.error so route-smoke E2E only fails on true
        // unhandled application errors.
        console.warn('RPC fetch warning:', e.message)
        setRpcError(e)
      } else {
        console.error('Fetch error:', e)
        // Wrap non-RpcError failures so the banner still renders with useful
        // context instead of leaving the page in a silent indeterminate state.
        setRpcError(new RpcError('unknown', 'unexpected', (e as Error)?.message || String(e), RPC_URL))
      }
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch. We always run this, even if the tab starts hidden —
    // the user must see SOMETHING on first mount, and the visibility gate
    // only protects the recurring poll.
    fetchData()

    // Tab-visibility-aware polling. The interval fires every 10s but the
    // tick is a no-op while the tab is hidden — a forgotten tab will not
    // continue hammering the RPC. When the tab becomes visible again we
    // also do an immediate catch-up fetch so the data isn't stale by up
    // to 10s. See task 0096.
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      fetchData()
    }, POLL_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData()
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }

    return () => {
      clearInterval(interval)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }
  }, [fetchData])

  const barHeights = computeBarHeights(blocks)
  const reversedBlocks = blocks.slice().reverse()
  const reversedHeights = barHeights.slice().reverse()
  const totalTxsInWindow = blocks.reduce((sum, b) => sum + b.txCount, 0)

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Lane 4: live-price strip above the block timeline. */}
      <div className="mb-5">
        <ActivityPriceStrip />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Activity</h1>
          <p className="text-sm text-gray-400 mt-1" data-testid="activity-subtitle">
            {currentBlock === 0 ? (
              <>Connecting to chain {DEVNET_CHAIN_ID}…</>
            ) : (
              <>
                Block #{currentBlock.toLocaleString()} • Chain {DEVNET_CHAIN_ID}
                {lastUpdate && <span> • Updated {lastUpdate.toLocaleTimeString()}</span>}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full animate-pulse ${
              rpcError ? 'bg-red-400' : 'bg-goodgreen'
            }`}
          />
          <span className={`text-xs ${rpcError ? 'text-red-400' : 'text-goodgreen'}`}>
            {rpcError ? 'Offline' : 'Live'}
          </span>
        </div>
      </div>

      {rpcError && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          data-testid="activity-rpc-error"
        >
          <div className="flex-1 text-sm text-red-200">
            <div className="font-semibold">Couldn’t reach the chain RPC.</div>
            <div className="text-xs text-red-300/80 mt-1 font-mono break-all">
              {rpcError.method} → {rpcError.url} ({rpcError.message})
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchData()}
            aria-label="Retry chain RPC fetch"
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold"
          >
            Retry now
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-dark-100/60 border border-gray-700/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Tester Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {testerStats.map((t) => (
              <div key={t.address} className="rounded-2xl bg-dark-100/60 border border-gray-700/30 p-4 hover:border-goodgreen/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{t.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Balance</div>
                    <div className="text-sm font-mono text-white">{t.balance} ETH</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Transactions</div>
                    <div className="text-sm font-mono text-goodgreen">{t.nonce}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 font-mono truncate">
                  {t.address}
                </div>
              </div>
            ))}
          </div>

          {/* Block Timeline */}
          <div className="rounded-2xl bg-dark-100/60 border border-gray-700/30 p-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Block Timeline</h2>
              <span className="text-xs text-gray-500">
                {totalTxsInWindow} {totalTxsInWindow === 1 ? 'tx' : 'txs'} in last {blocks.length || 0} blocks
              </span>
            </div>
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-16 text-center">
                <p className="text-xs text-gray-500">No recent blocks available.</p>
                <p className="text-[10px] text-gray-600 mt-1">Waiting for chain to advance…</p>
              </div>
            ) : totalTxsInWindow === 0 ? (
              <>
                <div className="flex items-end gap-1 h-16" role="img" aria-label="No transactions in the last 20 blocks">
                  {reversedBlocks.map((b, i) => (
                    <div
                      key={b.number}
                      className="flex-1 group relative"
                      title={`Block ${b.number}: 0 txs`}
                    >
                      <div
                        className="w-full rounded-t bg-gray-600/40"
                        style={{ height: `${reversedHeights[i].height}px` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-dark-50 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                        #{b.number} • 0 tx
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  No transactions in the last {blocks.length} blocks. Send a swap, perp, or predict tx to light it up.
                </p>
              </>
            ) : (
              <div className="flex items-end gap-1 h-16" role="img" aria-label={`Block transaction histogram, ${totalTxsInWindow} total transactions`}>
                {reversedBlocks.map((b, i) => (
                  <div
                    key={b.number}
                    className="flex-1 group relative"
                    title={`Block ${b.number}: ${b.txCount} txs`}
                  >
                    <div
                      className={`w-full rounded-t transition-all ${reversedHeights[i].hasTxs ? 'bg-goodgreen' : 'bg-gray-600/40'}`}
                      style={{ height: `${reversedHeights[i].height}px` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-dark-50 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                      #{b.number} • {b.txCount} tx
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                {blocks.length > 0 ? `#${blocks[blocks.length - 1]?.number}` : ''}
              </span>
              <span className="text-xs text-gray-500">
                {blocks.length > 0 ? `#${blocks[0]?.number}` : ''}
              </span>
            </div>
          </div>

          {/* Contract Activity */}
          {Object.keys(contractHits).length > 0 && (
            <div className="rounded-2xl bg-dark-100/60 border border-gray-700/30 p-4 mb-8">
              <h2 className="text-sm font-semibold text-white mb-3">Contract Activity (last 20 blocks)</h2>
              <div className="space-y-2">
                {Object.entries(contractHits)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, count]) => {
                    const maxHits = Math.max(...Object.values(contractHits))
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-36 text-xs text-gray-300 truncate">{name}</div>
                        <div className="flex-1 bg-gray-700/20 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-goodgreen rounded-full transition-all"
                            style={{ width: `${(count / maxHits) * 100}%` }}
                          />
                        </div>
                        <div className="w-8 text-xs text-goodgreen text-right">{count}</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Transaction Feed */}
          <div className="rounded-2xl bg-dark-100/60 border border-gray-700/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700/30">
              <h2 className="text-sm font-semibold text-white">Recent Transactions ({transactions.length})</h2>
            </div>
            <div className="divide-y divide-gray-700/20 max-h-[600px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No transactions in recent blocks</div>
              ) : (
                transactions.map((tx) => {
                  const tester = getTesterInfo(tx.from)
                  return (
                    <div key={tx.hash} className="px-4 py-3 hover:bg-dark-50/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.status === 'success' ? 'bg-green-400' : tx.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                          <a
                            href={`https://explorer.goodclaw.org/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-goodgreen/80 hover:text-goodgreen truncate"
                          >
                            {shortenHash(tx.hash)}
                          </a>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          Block #{tx.blockNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {tester ? (
                            <span style={{ color: tester.color }}>{tester.emoji} {tester.name.split(' ')[1]}</span>
                          ) : (
                            shortenHash(tx.from)
                          )}
                        </span>
                        <span className="text-xs text-gray-600">→</span>
                        <span className="text-xs text-gray-300">
                          {tx.contractName ? (
                            <span className="bg-goodgreen/10 text-goodgreen px-1.5 py-0.5 rounded text-[10px]">
                              {tx.contractName}
                            </span>
                          ) : (
                            typeof tx.to === 'string' ? shortenHash(tx.to) : tx.to
                          )}
                        </span>
                        {tx.gasUsed !== '0' && (
                          <span className="text-[10px] text-gray-500 ml-auto">⛽ {tx.gasUsed}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
