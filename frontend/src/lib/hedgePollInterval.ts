/**
 * Shared polling cadence for the hedge feature (task 0080).
 *
 * Both `HedgeStatusCard` (analytics page card) and `HedgeProofViewer`
 * (`/analytics/hedge/proof/{latest,[receiptId]}`) auto-retry against
 * the hedge engine at this exact cadence so the operator sees the
 * same "Auto-retrying every Ns." promise on both surfaces. Exported
 * from a tiny shared module so the two callers stay in lockstep if
 * the cadence ever changes — never duplicate it locally.
 */
export const HEDGE_POLL_INTERVAL_MS = 10_000
