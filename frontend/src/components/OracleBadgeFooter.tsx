'use client'

/**
 * OracleBadgeFooter — secondary "Source · explorer link" line rendered
 * under the OracleStatusBadge's main row. Pulled into its own component
 * to keep `OracleStatusBadge.tsx` focused on the primary-row state machine
 * and to make each rendering branch independently testable.
 *
 * Renders three pieces of information layered onto a single 10px gray
 * caption line:
 *
 *   1. `Source: {upstream} → {publisher} ({network})` provenance.
 *   2. A per-rail "block N ↗" explorer link (listing variant) or "Last
 *      write: block N ({publisher} ↗)" link (detail variant).
 *   3. A `Not yet published on chain` fallback when there is no proof
 *      tail yet for the relevant rail.
 *
 * The caller chooses the variant via `mode`. When `cached: true` the
 * source line short-circuits to `Source: cached snapshot` and the
 * explorer link is suppressed (we never fabricate a tx URL from a cached
 * payload).
 */

import { useOracleProvenance, type ProofTail } from '@/lib/useOracleProvenance'
import { buildOracleTxLink } from '@/lib/oracleExplorer'
import {
  buildSourceLine,
  publisherForRail,
  railForSymbol,
  type OracleRail,
} from '@/lib/oracleSource'

interface DetailModeProps {
  mode: 'detail'
  symbol: string
  cached?: boolean
}

interface ListingModeProps {
  mode: 'listing'
  cached?: boolean
}

type Props = DetailModeProps | ListingModeProps

const FOOTER_CLASS = 'mt-0.5 text-[10px] text-gray-500 whitespace-nowrap'
const LINK_CLASS = 'underline underline-offset-2 hover:text-goodgreen transition-colors'

function explorerLinkLabelForRail(rail: OracleRail, tail: ProofTail): string {
  return `View ${rail} oracle update ${tail.txHash} on explorer`
}

export function OracleBadgeFooter(props: Props) {
  const provenance = useOracleProvenance()
  if (!provenance.loaded) return null
  const { chainId, oracleAddresses, signerAddress, upstreamLabel, proof } = provenance

  if (props.mode === 'listing') {
    const cached = Boolean(props.cached)
    const sourceLine = buildSourceLine({
      upstreamLabel,
      rail: 'stocks',
      chainId,
      cached,
    })
    const stocksLink = !cached && proof.stocks ? buildOracleTxLink(chainId, proof.stocks.txHash) : null
    const cryptoLink = !cached && proof.crypto ? buildOracleTxLink(chainId, proof.crypto.txHash) : null

    return (
      <div className={FOOTER_CLASS}>
        <span>{sourceLine}</span>
        {(stocksLink || cryptoLink) ? (
          <>
            <span className="mx-1.5 text-gray-700">·</span>
            {stocksLink && proof.stocks && (
              <a
                href={stocksLink}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
                aria-label={explorerLinkLabelForRail('stocks', proof.stocks)}
              >
                stocks block {proof.stocks.blockNumber} ↗
              </a>
            )}
            {stocksLink && cryptoLink && <span className="mx-1.5 text-gray-700">·</span>}
            {cryptoLink && proof.crypto && (
              <a
                href={cryptoLink}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
                aria-label={explorerLinkLabelForRail('crypto', proof.crypto)}
              >
                crypto block {proof.crypto.blockNumber} ↗
              </a>
            )}
          </>
        ) : !cached ? (
          <>
            <span className="mx-1.5 text-gray-700">·</span>
            <span>Not yet published on chain</span>
          </>
        ) : null}
      </div>
    )
  }

  // Detail mode — rail is determined by the symbol's asset class.
  const rail = railForSymbol(props.symbol)
  const cached = Boolean(props.cached)
  const sourceLine = buildSourceLine({ upstreamLabel, rail, chainId, cached })
  const tail = proof[rail]
  const link = !cached && tail ? buildOracleTxLink(chainId, tail.txHash) : null
  const publisher = publisherForRail(rail)
  const tooltip = `Oracle ${oracleAddresses[rail] ?? '(unknown)'} · Signer ${signerAddress ?? '(unknown)'}`

  return (
    <div className={FOOTER_CLASS}>
      <span>{sourceLine}</span>
      {link && tail ? (
        <>
          <span className="mx-1.5 text-gray-700">·</span>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
            title={tooltip}
            aria-label={explorerLinkLabelForRail(rail, tail)}
          >
            Last write: block {tail.blockNumber} ({publisher} ↗)
          </a>
        </>
      ) : !cached ? (
        <>
          <span className="mx-1.5 text-gray-700">·</span>
          <span>Not yet published on chain</span>
        </>
      ) : null}
    </div>
  )
}
