import { describe, expect, it } from 'vitest'

import { resolveReceiptsAvailabilityReason } from '../receipts-availability'

describe('resolveReceiptsAvailabilityReason', () => {
  it('returns engine-offline when an error is set and no snapshot is rendered', () => {
    expect(
      resolveReceiptsAvailabilityReason({
        error: 'Hedge engine unreachable',
        hasSnapshot: false,
        degradedReceipts: undefined,
      }),
    ).toBe('engine-offline')
  })

  it('returns receipts-source-degraded when receipts source reports degradation and engine is healthy', () => {
    expect(
      resolveReceiptsAvailabilityReason({
        error: null,
        hasSnapshot: true,
        degradedReceipts: 'stale shard',
      }),
    ).toBe('receipts-source-degraded')
  })

  it('returns no-activity when engine is healthy and receipts source is healthy', () => {
    expect(
      resolveReceiptsAvailabilityReason({
        error: null,
        hasSnapshot: true,
        degradedReceipts: undefined,
      }),
    ).toBe('no-activity')
  })

  it('does not flip to engine-offline once a snapshot is present (last-good rendering)', () => {
    // PRD: the toolbar should follow the same disambiguation the empty
    // state already uses — when we have a snapshot to render, the
    // banner above carries the engine-down copy and the toolbar
    // reverts to its functional default.
    expect(
      resolveReceiptsAvailabilityReason({
        error: 'Hedge engine unreachable',
        hasSnapshot: true,
        degradedReceipts: undefined,
      }),
    ).toBe('no-activity')
  })

  it('prioritises engine-offline over receipts-source-degraded when both fire', () => {
    expect(
      resolveReceiptsAvailabilityReason({
        error: 'Hedge engine unreachable',
        hasSnapshot: false,
        degradedReceipts: 'stale shard',
      }),
    ).toBe('engine-offline')
  })
})
