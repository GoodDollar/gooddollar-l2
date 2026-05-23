import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sanitiseClientError } from '../sanitiseClientError'

describe('sanitiseClientError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the canned price-service copy and never leaks the raw message', () => {
    const out = sanitiseClientError('price-service', new Error('ECONNREFUSED'))
    expect(out).toMatch(/Live quotes feed is unreachable/i)
    expect(out).not.toMatch(/ECONNREFUSED/)
    expect(out).not.toMatch(/Error/)
  })

  it('returns the canned shape-mismatch copy for price-service-shape', () => {
    const out = sanitiseClientError('price-service-shape', new Error('SHAPE_MISMATCH'))
    expect(out).toMatch(/unexpected payload shape/i)
    expect(out).not.toMatch(/SHAPE_MISMATCH/)
  })

  it('returns the canned oracle copy and never leaks wagmi internals', () => {
    const wagmiError = new Error(
      'HTTP request failed.\n\nURL: https://rpc.gooddollar.org\nRequest body: {"method":"eth_call","params":[{"to":"0xa4899d35897033b927acfcf422bc7459161397ab"}]}\n\nDetails: connect ECONNREFUSED\nVersion: viem@2.x.x',
    )
    const out = sanitiseClientError('oracle-multicall', wagmiError)
    expect(out).toMatch(/On-chain oracle reads are unavailable/i)
    expect(out).not.toMatch(/eth_call/)
    expect(out).not.toMatch(/https?:\/\//)
    expect(out).not.toMatch(/0x[a-f0-9]{40}/i)
    expect(out).not.toMatch(/ECONNREFUSED/)
  })

  it('calls console.error exactly once per invocation with the leading tag', () => {
    const err = new Error('boom')
    sanitiseClientError('price-service', err)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('[proof-panel]', 'price-service', err)
  })

  it('forwards the original error object to the console for operator debugging', () => {
    const err = new Error('underlying')
    sanitiseClientError('oracle-multicall', err)
    const call = consoleErrorSpy.mock.calls[0]
    expect(call?.[0]).toBe('[proof-panel]')
    expect(call?.[1]).toBe('oracle-multicall')
    expect(call?.[2]).toBe(err)
  })

  it('returns the canned hedge-proof copy and never leaks the raw fetch message', () => {
    const out = sanitiseClientError('hedge-proof', new Error('Failed to fetch'))
    expect(out).toMatch(/Hedge proof endpoint is unreachable/i)
    expect(out).not.toMatch(/Failed to fetch/)
  })

  it('returns the canned hedge-proof-shape copy and never leaks the sentinel', () => {
    const out = sanitiseClientError('hedge-proof-shape', new Error('SHAPE_MISMATCH'))
    expect(out).toMatch(/unexpected shape/i)
    expect(out).not.toMatch(/SHAPE_MISMATCH/)
  })
})
