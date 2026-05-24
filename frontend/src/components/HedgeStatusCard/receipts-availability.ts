/**
 * Lane 5 — receipts-availability reason (task 0048).
 *
 * Shared truth source for the three reasons the recent-receipts list
 * may render empty / un-exportable. Both `<EmptyReceiptsState>` and
 * `<ReceiptsExportToolbar>` resolve their copy through this helper so
 * the empty-state panel and the disabled Export tooltip never
 * disagree about whether the engine is offline, the receipts source
 * is degraded, or the operator simply has no activity yet.
 */

export type ReceiptsAvailabilityReason =
  | 'no-activity'
  | 'engine-offline'
  | 'receipts-source-degraded'

export interface ReceiptsAvailabilityInput {
  /** Error string surfaced in the top hedge banner, if any. */
  error: string | null
  /** Whether the card has a snapshot (last-good or fresh) to render. */
  hasSnapshot: boolean
  /** Reason from `data.degraded.receipts` when the receipts source is degraded. */
  degradedReceipts: string | undefined
}

export function resolveReceiptsAvailabilityReason(
  input: ReceiptsAvailabilityInput,
): ReceiptsAvailabilityReason {
  if (input.error && !input.hasSnapshot) return 'engine-offline'
  if (input.degradedReceipts) return 'receipts-source-degraded'
  return 'no-activity'
}
