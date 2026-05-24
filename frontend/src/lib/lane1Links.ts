/**
 * Lane-1 cross-surface link constants.
 *
 * Three frontend surfaces deep-link to the same two destinations:
 *   - The `/lane1` proof page (created by task 0062).
 *   - The repo-rooted runbook `docs/runbooks/lane1-live-prices-on-chain.md`
 *     (created by task 0031).
 *
 * Centralising them here keeps the three consumers
 * (`OracleStatusBadge`, `StalePriceBanner`, the test-dashboard drift panel)
 * pointing at one source-of-truth pair so a destination move (e.g. renaming
 * the route or moving the runbook) is a one-line change.
 *
 * The runbook href intentionally uses a repo-relative path. Next.js' `<Link>`
 * falls back to a regular `<a>` for non-route hrefs, and operators reading
 * the deployed dashboard generally have the repo checked out at the same
 * path on disk; for the public-facing deployment the surrounding component
 * can pass an override prop where one is needed.
 */
export const LANE1_STATUS_HREF = '/lane1'
export const LANE1_RUNBOOK_HREF =
  'https://github.com/yoniassia/gooddollar-l2/blob/main/docs/runbooks/lane1-live-prices-on-chain.md'
