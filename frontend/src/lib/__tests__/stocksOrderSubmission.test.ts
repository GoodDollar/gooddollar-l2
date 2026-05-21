import { describe, it, expect } from 'vitest'

import { computeOrderSubmissionState } from '../stocksOrderSubmission'

describe('computeOrderSubmissionState', () => {
  it('returns real-market when contract is deployed and orderType is market', () => {
    const out = computeOrderSubmissionState({ isDeployed: true, orderType: 'market' })
    expect(out.mode).toBe('real-market')
    expect(out.canSubmitOnChain).toBe(true)
    expect(out.unsupportedMessage).toBeNull()
  })

  it('returns unsupported-limit for a limit order even when contract is deployed', () => {
    const out = computeOrderSubmissionState({ isDeployed: true, orderType: 'limit' })
    expect(out.mode).toBe('unsupported-limit')
    expect(out.canSubmitOnChain).toBe(false)
    expect(out.unsupportedMessage).toMatch(/limit orders are not yet supported/i)
  })

  it('returns unsupported-limit for a limit order when contract is not deployed (limit takes precedence)', () => {
    const out = computeOrderSubmissionState({ isDeployed: false, orderType: 'limit' })
    expect(out.mode).toBe('unsupported-limit')
    expect(out.canSubmitOnChain).toBe(false)
    expect(out.unsupportedMessage).toMatch(/limit orders are not yet supported/i)
  })

  it('returns unsupported-network for a market order when contract is not deployed', () => {
    const out = computeOrderSubmissionState({ isDeployed: false, orderType: 'market' })
    expect(out.mode).toBe('unsupported-network')
    expect(out.canSubmitOnChain).toBe(false)
    expect(out.unsupportedMessage).toMatch(/trading is not yet enabled/i)
  })

  it('never reports canSubmitOnChain=true for any unsupported branch', () => {
    const limit = computeOrderSubmissionState({ isDeployed: true, orderType: 'limit' })
    const unsupported = computeOrderSubmissionState({ isDeployed: false, orderType: 'market' })
    expect(limit.canSubmitOnChain).toBe(false)
    expect(unsupported.canSubmitOnChain).toBe(false)
  })

  it('always returns a non-null unsupportedMessage for unsupported branches', () => {
    const limit = computeOrderSubmissionState({ isDeployed: true, orderType: 'limit' })
    const unsupported = computeOrderSubmissionState({ isDeployed: false, orderType: 'market' })
    expect(limit.unsupportedMessage).toBeTruthy()
    expect(unsupported.unsupportedMessage).toBeTruthy()
  })
})
