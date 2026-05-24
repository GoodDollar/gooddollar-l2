/**
 * Lane-1 cross-surface link constants.
 *
 * Multiple frontend surfaces deep-link to the same two destinations:
 *   - The `/lane1` proof page (created by task 0062).
 *   - The lane-1 runbook (`docs/runbooks/lane1-live-prices-on-chain.md`,
 *     created by task 0031).
 *
 * Centralising them here keeps the consumers
 * (`OracleStatusBadge`, `StalePriceBanner`, the `/lane1` proof page itself,
 * and the analytics Lane-1 panel) pointing at one source-of-truth pair so a
 * destination move is a one-line change.
 *
 * The runbook is served from the in-app route `/lane1/runbook`, which reads
 * `docs/runbooks/lane1-live-prices-on-chain.md` from disk at request time
 * (see `frontend/src/app/(app)/lane1/runbook/page.tsx`). The previous value
 * pointed at a public GitHub URL that 404'd because the repo path was not
 * publicly resolvable; serving the runbook from the same origin keeps the
 * recovery affordance pinned to the shipped lane-1 commit (task 0065).
 */
export const LANE1_STATUS_HREF = '/lane1'
export const LANE1_RUNBOOK_HREF = '/lane1/runbook'
