/**
 * Resolve receipts availability status
 */

export interface ReceiptsAvailabilityInput {
  error: string | null
  hasSnapshot: boolean
  degradedReceipts?: string
}

export function resolveReceiptsAvailabilityReason(input: ReceiptsAvailabilityInput): string {
  if (input.degradedReceipts) {
    return `receipts degraded: ${input.degradedReceipts}`
  }
  
  if (input.error && !input.hasSnapshot) {
    return 'receipts unavailable (engine offline)'
  }
  
  if (!input.hasSnapshot) {
    return 'awaiting first tick'
  }
  
  return 'available'
}