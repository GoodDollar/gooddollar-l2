'use client'

/**
 * GovernanceParams — reference card on `/governance` listing the live
 * GoodGovernor parameter set (proposal threshold, quorum, voting
 * period/delay, timelock) plus the static `Early Unlock Penalty` constant.
 *
 * Task 0045 (Lane 4 `0007d-app-integration`):
 *
 *   When every chain-derived read fails (RPC offline → all five wagmi
 *   hooks report `isError: true`), the card replaced its rows with a
 *   literal Unicode ellipsis `…`. That reads as "almost loaded" so
 *   users couldn't tell the chain was unreachable — and the lone
 *   static row (`Early Unlock Penalty: 30%`) misled them into thinking
 *   the contract was live.
 *
 *   This file now:
 *     - replaces `…` with the project's "no data" glyph `—`
 *     - swaps the entire card for `UBIImpactErrorCard` + Retry when
 *       EVERY governor read failed
 *     - keeps the static Early Unlock Penalty caption with a
 *       "static, set in GoodEscrow at deployment" subtitle so it's
 *       not mistaken for live state.
 *
 * `useChainStatus()` is deliberately NOT introduced; the local hook
 * returns already discriminate "loading" from "errored" (`isError`)
 * and a global accessor would duplicate `/activity`'s existing per-page
 * RPC error state for one consumer.
 */

import { useCallback } from 'react'
import {
  useVotingDelay,
  useVotingPeriod,
  useTimelockDelay,
  useProposalThresholdBps,
  useQuorumBps,
  formatDuration,
} from '@/lib/useGovernance'
import { UBIImpactErrorCard } from '@/components/UBIImpactErrorCard'

/** "No data yet" placeholder. `—` reads as "no data"; `…` reads as
 * "still loading" — task 0045 conflated those states. */
const NO_DATA = '—'

function fmtSecs(val: bigint | undefined): string {
  if (val === undefined) return NO_DATA
  const s = Number(val)
  if (s === 0) return '0s'
  return formatDuration(s)
}

function fmtBps(val: bigint | undefined): string {
  if (val === undefined) return NO_DATA
  return (Number(val) / 100).toFixed(2).replace(/\.?0+$/, '') + '% of veG$'
}

export function GovernanceParams() {
  const {
    data: votingDelay, isError: errVD, refetch: rVD,
  } = useVotingDelay()
  const {
    data: votingPeriod, isError: errVP, refetch: rVP,
  } = useVotingPeriod()
  const {
    data: timelockDelay, isError: errTD, refetch: rTD,
  } = useTimelockDelay()
  const {
    data: thresholdBps, isError: errPT, refetch: rPT,
  } = useProposalThresholdBps()
  const {
    data: quorumBps, isError: errQB, refetch: rQB,
  } = useQuorumBps()

  const chainOffline = errVD && errVP && errTD && errPT && errQB

  const refetchAll = useCallback(() => {
    rVD(); rVP(); rTD(); rPT(); rQB()
  }, [rVD, rVP, rTD, rPT, rQB])

  if (chainOffline) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-5 space-y-4">
        <UBIImpactErrorCard
          title="Unable to load Governance Parameters"
          onRetry={refetchAll}
          message={
            "We couldn't reach the GoodDollar L2 RPC. Live governance parameters " +
            'reappear once the chain is reachable.'
          }
        />
        <div className="text-xs text-gray-500 px-2 border-t border-gray-800 pt-3">
          Early Unlock Penalty: 30% (⅓ → UBI)
          <span className="block text-gray-600 mt-1">
            Static value — set in GoodEscrow at deployment.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-5">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Governance Parameters</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 text-sm">
        <div className="min-w-0">
          <span className="text-gray-500">Proposal Threshold:</span>{' '}
          <span className="text-white break-words">{fmtBps(thresholdBps as bigint | undefined)}</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500">Quorum:</span>{' '}
          <span className="text-white break-words">{fmtBps(quorumBps as bigint | undefined)}</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500">Voting Period:</span>{' '}
          <span className="text-white break-words">{fmtSecs(votingPeriod as bigint | undefined)}</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500">Voting Delay:</span>{' '}
          <span className="text-white break-words">{fmtSecs(votingDelay as bigint | undefined)}</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500">Timelock:</span>{' '}
          <span className="text-white break-words">{fmtSecs(timelockDelay as bigint | undefined)}</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-500">Early Unlock Penalty:</span>{' '}
          <span className="text-white break-words">30% (⅓ → UBI)</span>
        </div>
      </div>
    </div>
  )
}
