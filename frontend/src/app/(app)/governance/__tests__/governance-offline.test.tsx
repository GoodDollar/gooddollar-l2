/**
 * Task 0045 — `<GovernanceParams>` must replace the literal `…`
 * placeholders with an honest "Unable to load Governance Parameters"
 * card + Retry button when every chain-derived read fails. The legacy
 * behaviour was misread as a stuck spinner; the new state mirrors
 * `/ubi-impact`'s `UBIImpactErrorCard`.
 *
 * Tests two regimes:
 *  1. All five governance hooks return `isError: true` → offline card,
 *     no `…` anywhere, retry button wires through to every hook's
 *     `refetch`, and the static "Early Unlock Penalty" caption stays
 *     visible with its "static, set in GoodEscrow at deployment" label.
 *  2. All five hooks return concrete bigints → the 6-cell grid renders
 *     the formatted values, no offline card.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const refetchVD = vi.fn()
const refetchVP = vi.fn()
const refetchTD = vi.fn()
const refetchPT = vi.fn()
const refetchQB = vi.fn()

vi.mock('@/lib/useGovernance', async () => {
  const actual = await vi.importActual<typeof import('@/lib/useGovernance')>('@/lib/useGovernance')
  return {
    ...actual,
    useVotingDelay:           vi.fn(),
    useVotingPeriod:          vi.fn(),
    useTimelockDelay:         vi.fn(),
    useProposalThresholdBps:  vi.fn(),
    useQuorumBps:             vi.fn(),
  }
})

import {
  useVotingDelay, useVotingPeriod, useTimelockDelay,
  useProposalThresholdBps, useQuorumBps,
} from '@/lib/useGovernance'
import { GovernanceParams } from '@/app/(app)/governance/governance-params'

/**
 * Wagmi's `UseReadContractReturnType` is a sprawling generic; the
 * component only reads `data`, `isError`, and `refetch`, so the test
 * stubs only those three fields. The `unknown` two-step keeps
 * TypeScript happy without forcing us to populate every wagmi field
 * (`status`, `error`, `failureCount`, `fetchStatus`, etc.).
 */
type GovHookStub = {
  data: bigint | undefined
  isError: boolean
  refetch: ReturnType<typeof vi.fn>
}
function stub(s: GovHookStub) {
  return s as unknown as ReturnType<typeof useVotingDelay>
}

function mockAllError() {
  vi.mocked(useVotingDelay).mockReturnValue(stub({ data: undefined, isError: true, refetch: refetchVD }))
  vi.mocked(useVotingPeriod).mockReturnValue(stub({ data: undefined, isError: true, refetch: refetchVP }))
  vi.mocked(useTimelockDelay).mockReturnValue(stub({ data: undefined, isError: true, refetch: refetchTD }))
  vi.mocked(useProposalThresholdBps).mockReturnValue(stub({ data: undefined, isError: true, refetch: refetchPT }))
  vi.mocked(useQuorumBps).mockReturnValue(stub({ data: undefined, isError: true, refetch: refetchQB }))
}

function mockAllOk() {
  // 1 day, 7 days, 12 h, 1% threshold, 4% quorum.
  vi.mocked(useVotingDelay).mockReturnValue(stub({ data: 86_400n, isError: false, refetch: refetchVD }))
  vi.mocked(useVotingPeriod).mockReturnValue(stub({ data: BigInt(7 * 86_400), isError: false, refetch: refetchVP }))
  vi.mocked(useTimelockDelay).mockReturnValue(stub({ data: BigInt(12 * 3_600), isError: false, refetch: refetchTD }))
  vi.mocked(useProposalThresholdBps).mockReturnValue(stub({ data: 100n, isError: false, refetch: refetchPT }))
  vi.mocked(useQuorumBps).mockReturnValue(stub({ data: 400n, isError: false, refetch: refetchQB }))
}

describe('GovernanceParams — chain-offline empty state (task 0045)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the "Unable to load Governance Parameters" card when every hook is in error', () => {
    mockAllError()
    render(<GovernanceParams />)

    // No stuck-spinner ellipses anywhere in the document.
    expect(screen.queryByText('…')).toBeNull()
    // Heading mentions "Governance Parameters" so users can't confuse the
    // card with /ubi-impact's analogous state.
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.textContent).toMatch(/governance parameters/i)
    expect(heading.textContent).toMatch(/unable/i)
    // Retry button is reachable.
    const retry = screen.getByRole('button', { name: /retry/i })
    expect(retry).toBeInTheDocument()
    // Static "Early Unlock Penalty" caption still visible + labelled static.
    expect(screen.getByText(/early unlock penalty/i)).toBeInTheDocument()
    expect(screen.getByText(/static/i)).toBeInTheDocument()
  })

  it('calls refetch on every hook when Retry is clicked', () => {
    mockAllError()
    render(<GovernanceParams />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(refetchVD).toHaveBeenCalledTimes(1)
    expect(refetchVP).toHaveBeenCalledTimes(1)
    expect(refetchTD).toHaveBeenCalledTimes(1)
    expect(refetchPT).toHaveBeenCalledTimes(1)
    expect(refetchQB).toHaveBeenCalledTimes(1)
  })

  it('renders the 6-cell grid with formatted values when every hook resolves', () => {
    mockAllOk()
    render(<GovernanceParams />)
    // No offline card heading on the happy path.
    expect(screen.queryByRole('heading', { level: 2, name: /unable/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
    // The static grid heading IS rendered.
    expect(screen.getByText('Governance Parameters')).toBeInTheDocument()
    // The six rows are present (labels).
    expect(screen.getByText(/Proposal Threshold/)).toBeInTheDocument()
    expect(screen.getByText('Quorum:')).toBeInTheDocument()
    expect(screen.getByText('Voting Period:')).toBeInTheDocument()
    expect(screen.getByText('Voting Delay:')).toBeInTheDocument()
    expect(screen.getByText('Timelock:')).toBeInTheDocument()
    expect(screen.getByText(/Early Unlock Penalty/)).toBeInTheDocument()
    // No `…` placeholders anywhere.
    expect(screen.queryByText('…')).toBeNull()
  })

  it('keeps the partial-data grid if some hooks succeeded — only ALL-error triggers the offline card', () => {
    // Threshold + quorum succeeded; the three duration hooks failed. We
    // should still see the grid (partial em-dashes), NOT the offline card.
    mockAllError()
    vi.mocked(useProposalThresholdBps).mockReturnValue(stub({ data: 100n, isError: false, refetch: refetchPT }))
    vi.mocked(useQuorumBps).mockReturnValue(stub({ data: 400n, isError: false, refetch: refetchQB }))
    render(<GovernanceParams />)
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
    expect(screen.getByText('Governance Parameters')).toBeInTheDocument()
    // The still-undefined cells render the em-dash placeholder (task 0045
    // replaced `…` with `—` everywhere on this page).
    expect(screen.queryByText('…')).toBeNull()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })
})
