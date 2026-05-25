'use client'

import { useEffect, useMemo, useState } from 'react'
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '@/lib/chain'
import { PriceOracleABI } from '@/lib/abi'
import { sanitiseClientError } from '@/lib/sanitiseClientError'
import { getAllTickers } from '@/lib/stockData'

type AxisHealth = 'unknown' | 'healthy' | 'degraded'
type Tone = 'unknown' | 'healthy' | 'degraded'

interface AxisState {
  quotes: AxisHealth
  onChain: AxisHealth
  hedgeProof: AxisHealth
}

type AxisKey = keyof AxisState

const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300'
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000
const DEFAULT_POLL_INTERVAL_MS = 15_000

const REASON_BY_AXIS: Record<AxisKey, string> = {
  quotes: 'price-service unreachable',
  onChain: 'no on-chain prices',
  hedgeProof: 'hedge-proof missing',
}

const PANEL_HREF_BY_NODE_ID: Record<string, string | null> = {
  etoro: null,
  'price-service': '#panel-live-quotes',
  'oracle-signer': '#panel-oracle-updates',
  chain: '#panel-onchain-oracle',
  frontend: '#panel-onchain-oracle',
  'demo-hedge': '#panel-last-hedge',
}

interface NodeSpec {
  id: string
  label: string
  axis: AxisKey
  subtitle?: string
}

interface EdgeSpec {
  id: string
  axis: AxisKey
}

const NODES: readonly NodeSpec[] = [
  { id: 'etoro', label: 'eToro', axis: 'quotes', subtitle: 'demo' },
  { id: 'price-service', label: 'price-service', axis: 'quotes' },
  { id: 'oracle-signer', label: 'oracle-signer', axis: 'onChain' },
  { id: 'chain', label: 'chain', axis: 'onChain' },
  { id: 'frontend', label: 'frontend', axis: 'onChain' },
  { id: 'demo-hedge', label: 'demo hedge', axis: 'hedgeProof' },
]

const EDGES: readonly EdgeSpec[] = [
  { id: 'etoro-price-service', axis: 'quotes' },
  { id: 'price-service-oracle-signer', axis: 'onChain' },
  { id: 'oracle-signer-chain', axis: 'onChain' },
  { id: 'chain-frontend', axis: 'onChain' },
  { id: 'frontend-demo-hedge', axis: 'hedgeProof' },
]

const TONE_NODE_CLASS: Record<Tone, string> = {
  healthy: 'border-green-500/40 bg-green-500/10 text-green-200',
  degraded: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-100',
  unknown: 'border-white/10 bg-white/5 text-gray-400 animate-pulse',
}

const TONE_EDGE_CLASS: Record<Tone, string> = {
  healthy: 'text-green-400',
  degraded: 'text-yellow-400',
  unknown: 'text-white/40',
}

function isFreshQuotes(payload: unknown, stalenessMs: number): boolean {
  if (typeof payload !== 'object' || payload === null) return false
  const r = payload as Record<string, unknown>
  const quotes = r.quotes
  if (typeof quotes !== 'object' || quotes === null || Array.isArray(quotes)) return false
  const values = Object.values(quotes as Record<string, unknown>)
  if (values.length === 0) return false
  let freshestAge = Number.POSITIVE_INFINITY
  for (const v of values) {
    if (typeof v !== 'object' || v === null) continue
    const q = v as Record<string, unknown>
    if (typeof q.cacheAge !== 'number') continue
    if (q.cacheAge < freshestAge) freshestAge = q.cacheAge
  }
  if (!Number.isFinite(freshestAge)) return false
  return freshestAge <= stalenessMs
}

function isHealthyOnChain(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false
  const r = data as Record<string, unknown>
  const price8 = r.price8
  const timestamp = r.timestamp
  if (typeof price8 !== 'bigint' || typeof timestamp !== 'bigint') return false
  return price8 > 0n && timestamp > 0n
}

function axisToTone(axis: AxisHealth): Tone {
  switch (axis) {
    case 'healthy':
      return 'healthy'
    case 'degraded':
      return 'degraded'
    case 'unknown':
      return 'unknown'
  }
}

interface PipelineFlowDiagramProps {
  priceServiceUrl?: string
  hedgeProofEndpoint?: string
  intervalMs?: number
  stalenessThresholdMs?: number
}

export function PipelineFlowDiagram({
  priceServiceUrl = process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL,
  hedgeProofEndpoint = '/api/hedge-proof/latest',
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
  stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS,
}: PipelineFlowDiagramProps) {
  const oracleAddress = CONTRACTS.StocksPriceOracle
  const probeTicker = useMemo(() => {
    const tickers = getAllTickers()
    return tickers.length > 0 ? tickers[0] : null
  }, [])

  const onChainReadEnabled = Boolean(oracleAddress) && probeTicker !== null
  const { data: onChainData, error: onChainError } = useReadContract({
    address: oracleAddress || undefined,
    abi: PriceOracleABI,
    functionName: 'getPriceData',
    args: probeTicker ? [probeTicker] : undefined,
    query: {
      enabled: onChainReadEnabled,
      refetchInterval: intervalMs,
      staleTime: intervalMs,
    },
  })

  const [offChain, setOffChain] = useState<{ quotes: AxisHealth; hedgeProof: AxisHealth }>({
    quotes: 'unknown',
    hedgeProof: 'unknown',
  })

  useEffect(() => {
    let cancelled = false

    const checkQuotes = async (): Promise<AxisHealth> => {
      try {
        const res = await fetch(`${priceServiceUrl}/quotes`, { cache: 'no-store' })
        if (!res.ok) return 'degraded'
        const body = (await res.json()) as unknown
        return isFreshQuotes(body, stalenessThresholdMs) ? 'healthy' : 'degraded'
      } catch (err) {
        sanitiseClientError('price-service', err)
        return 'degraded'
      }
    }

    const checkHedgeProof = async (): Promise<AxisHealth> => {
      try {
        const res = await fetch(hedgeProofEndpoint, { cache: 'no-store' })
        return res.ok ? 'healthy' : 'degraded'
      } catch (err) {
        sanitiseClientError('hedge-proof', err)
        return 'degraded'
      }
    }

    const tick = async () => {
      const [quotesResult, hedgeProofResult] = await Promise.allSettled([
        checkQuotes(),
        checkHedgeProof(),
      ])
      if (cancelled) return
      setOffChain({
        quotes: quotesResult.status === 'fulfilled' ? quotesResult.value : 'degraded',
        hedgeProof: hedgeProofResult.status === 'fulfilled' ? hedgeProofResult.value : 'degraded',
      })
    }

    void tick()
    const timer = setInterval(() => void tick(), intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [priceServiceUrl, hedgeProofEndpoint, intervalMs, stalenessThresholdMs])

  const onChain: AxisHealth = useMemo(() => {
    if (!onChainReadEnabled) return 'degraded'
    if (onChainError) {
      sanitiseClientError('oracle-multicall', onChainError)
      return 'degraded'
    }
    if (onChainData === undefined) return 'unknown'
    return isHealthyOnChain(onChainData) ? 'healthy' : 'degraded'
  }, [onChainReadEnabled, onChainError, onChainData])

  const axes: AxisState = {
    quotes: offChain.quotes,
    onChain,
    hedgeProof: offChain.hedgeProof,
  }

  const failedReasons = (Object.keys(axes) as AxisKey[])
    .filter((axis) => axes[axis] === 'degraded')
    .map((axis) => REASON_BY_AXIS[axis])

  return (
    <section
      aria-label="Pipeline flow"
      data-testid="pipeline-flow-diagram"
      className="rounded-2xl border border-white/10 bg-dark-100/40 px-4 py-3"
    >
      {/* Desktop layout - horizontal flow with all nodes in a single row */}
      <div data-testid="pipeline-flow-desktop" className="hidden sm:block">
        <ol className="flex flex-wrap items-center gap-y-2 text-xs">
          {NODES.map((node, idx) => {
            const nodeTone = axisToTone(axes[node.axis])
            const edge = EDGES[idx]
            const edgeTone = edge ? axisToTone(axes[edge.axis]) : null
            return (
              <FlowNode
                key={`node-${node.id}`}
                spec={node}
                tone={nodeTone}
                trailingEdge={edge && edgeTone ? { spec: edge, tone: edgeTone } : null}
              />
            )
          })}
        </ol>
      </div>

      {/* Mobile layout - vertical flow with stacked nodes */}
      <div data-testid="pipeline-flow-mobile" className="block sm:hidden">
        <ol className="space-y-2 text-xs">
          {NODES.map((node, idx) => {
            const nodeTone = axisToTone(axes[node.axis])
            const edge = EDGES[idx]
            const edgeTone = edge ? axisToTone(axes[edge.axis]) : null
            return (
              <MobileFlowNode
                key={`mobile-node-${node.id}`}
                spec={node}
                tone={nodeTone}
                hasTrailingEdge={Boolean(edge)}
                edgeTone={edgeTone}
              />
            )
          })}
        </ol>
      </div>

      {failedReasons.length > 0 && (
        <p
          data-testid="pipeline-flow-degradation"
          className="mt-2 text-xs text-yellow-200/80"
        >
          {failedReasons.join(' · ')}
        </p>
      )}
    </section>
  )
}

function FlowNode({
  spec,
  tone,
  trailingEdge,
}: {
  spec: NodeSpec
  tone: Tone
  trailingEdge: { spec: EdgeSpec; tone: Tone } | null
}) {
  const href = PANEL_HREF_BY_NODE_ID[spec.id]
  const nodeContent = (
    <span
      className={`inline-flex flex-col items-start rounded-lg border px-3 py-1.5 ${TONE_NODE_CLASS[tone]}`}
    >
      <span className="font-mono uppercase tracking-wider">{spec.label}</span>
      {spec.subtitle && <span className="text-[10px] text-gray-400">{spec.subtitle}</span>}
    </span>
  )

  return (
    <li
      data-testid={`pipeline-node-${spec.id}`}
      data-tone={tone}
      className="inline-flex items-center"
    >
      {href ? (
        <a
          href={href}
          data-testid={`pipeline-node-${spec.id}-link`}
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          aria-label={`Jump to ${spec.label} panel`}
        >
          {nodeContent}
        </a>
      ) : nodeContent}
      {trailingEdge && (
        <span
          aria-hidden
          data-testid={`pipeline-edge-${trailingEdge.spec.id}`}
          data-tone={trailingEdge.tone}
          className={`mx-1.5 text-base leading-none sm:mx-2 ${TONE_EDGE_CLASS[trailingEdge.tone]}`}
        >
          →
        </span>
      )}
    </li>
  )
}

function MobileFlowNode({
  spec,
  tone,
  hasTrailingEdge,
  edgeTone,
}: {
  spec: NodeSpec
  tone: Tone
  hasTrailingEdge: boolean
  edgeTone: Tone | null
}) {
  const href = PANEL_HREF_BY_NODE_ID[spec.id]
  const nodeContent = (
    <span
      className={`inline-flex flex-col items-start rounded-lg border px-3 py-1.5 ${TONE_NODE_CLASS[tone]}`}
    >
      <span className="font-mono uppercase tracking-wider">{spec.label}</span>
      {spec.subtitle && <span className="text-[10px] text-gray-400">{spec.subtitle}</span>}
    </span>
  )

  return (
    <li
      data-testid={`pipeline-node-mobile-${spec.id}`}
      data-tone={tone}
      className="flex flex-col items-center space-y-1"
    >
      {href ? (
        <a
          href={href}
          data-testid={`pipeline-node-mobile-${spec.id}-link`}
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          aria-label={`Jump to ${spec.label} panel`}
        >
          {nodeContent}
        </a>
      ) : nodeContent}
      {hasTrailingEdge && (
        <span
          aria-hidden
          data-testid={`pipeline-edge-mobile-${spec.id}`}
          data-tone={edgeTone}
          className={`text-base leading-none ${edgeTone ? TONE_EDGE_CLASS[edgeTone] : 'text-white/40'}`}
        >
          ↓
        </span>
      )}
    </li>
  )
}
