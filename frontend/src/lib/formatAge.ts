/**
 * formatAge — canonical "Ns / Nm / Nh ago" formatter for oracle
 * freshness clauses. Used by `OracleStatusBadge` (stocks rail) and
 * `CryptoOracleStatusBadge` (crypto rail) so both surfaces render the
 * same age vocabulary.
 */
export function formatAge(ms: number): string {
  if (ms < 1000) return 'just now'
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`
  return `${Math.floor(ms / 3_600_000)}h ago`
}
