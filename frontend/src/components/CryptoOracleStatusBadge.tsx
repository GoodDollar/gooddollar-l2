'use client'

import Link from 'next/link'

import { useCryptoRailHealth, type CryptoRailHealth } from '@/lib/useCryptoRailHealth'
import { formatAge } from '@/lib/formatAge'

/**
 * CryptoOracleStatusBadge — inline rail-level health badge for the
 * perps page. Mirrors the stocks-side `OracleStatusBadge` visually
 * (status dot + plain-English label + "Updated Ns ago" freshness
 * clause) but stays small because the crypto rail does not yet
 * publish per-quote freshness or session state — only rail-level
 * enabled / lastSuccessAtMs / lastFailureAtMs from
 * `/api/oracle/status`. When a live crypto-quote stream lands, this
 * badge can grow per-symbol freshness without changing call sites.
 */

const STATUS_DOT = 'w-2.5 h-2.5 rounded-full shrink-0'
const STATUS_DOT_LIVE = `${STATUS_DOT} bg-green-400 animate-pulse ring-2 ring-green-400/20`
const STATUS_DOT_DEGRADED = `${STATUS_DOT} bg-yellow-400`
const STATUS_DOT_OFFLINE = `${STATUS_DOT} bg-red-400`

const LABELS: Record<CryptoRailHealth, string> = {
  live: 'Live',
  degraded: 'Degraded',
  offline: 'Oracle offline',
}

function dotClass(health: CryptoRailHealth): string {
  if (health === 'live') return STATUS_DOT_LIVE
  if (health === 'degraded') return STATUS_DOT_DEGRADED
  return STATUS_DOT_OFFLINE
}

export function CryptoOracleStatusBadge() {
  const { health, ageMs, isLoading } = useCryptoRailHealth()

  if (isLoading) {
    return (
      <span
        data-testid="crypto-oracle-status-badge"
        data-status="loading"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500"
      >
        <span className={`${STATUS_DOT} bg-gray-600 animate-pulse`} />
        <span>Checking oracle…</span>
      </span>
    )
  }

  return (
    <Link
      href="/status"
      aria-label="Open oracle status page"
      className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap hover:opacity-80 transition-opacity"
    >
      <span
        data-testid="crypto-oracle-status-badge"
        data-status={health}
        className="inline-flex items-center gap-1.5"
        title="Crypto oracle rail health, sourced from /api/oracle/status.rails.crypto"
      >
        <span className={dotClass(health)} />
        <span className={health === 'live' ? 'text-green-400' : health === 'degraded' ? 'text-yellow-300' : 'text-red-300'}>
          {LABELS[health]}
        </span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-500">on-chain crypto feed</span>
        {ageMs !== null && (
          <>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500">Updated {formatAge(ageMs)}</span>
          </>
        )}
      </span>
    </Link>
  )
}
