import { describe, it, expect } from 'vitest'

import { buildOracleTxLink, EXPLORER_BY_CHAIN } from '../oracleExplorer'
import { DEVNET_CHAIN_ID, DEVNET_EXPLORER_URL } from '../devnet'

describe('buildOracleTxLink', () => {
  it('returns a Blockscout-style URL for the devnet chain', () => {
    const url = buildOracleTxLink(DEVNET_CHAIN_ID, '0xabc123')
    expect(url).toBe(`${DEVNET_EXPLORER_URL.replace(/\/+$/, '')}/tx/0xabc123`)
  })

  it('returns null when chainId is null', () => {
    expect(buildOracleTxLink(null, '0xabc')).toBeNull()
  })

  it('returns null when chainId is undefined', () => {
    expect(buildOracleTxLink(undefined, '0xabc')).toBeNull()
  })

  it('returns null when txHash is empty', () => {
    expect(buildOracleTxLink(DEVNET_CHAIN_ID, '')).toBeNull()
  })

  it('returns null when txHash is null', () => {
    expect(buildOracleTxLink(DEVNET_CHAIN_ID, null)).toBeNull()
  })

  it('returns null when txHash does not start with 0x', () => {
    expect(buildOracleTxLink(DEVNET_CHAIN_ID, 'abc123')).toBeNull()
  })

  it('returns null for an unknown chainId not in the map', () => {
    expect(buildOracleTxLink(99999, '0xabc')).toBeNull()
  })

  it('strips trailing slash from explorer base URL', () => {
    // Pick a chain with a hardcoded base URL.
    const url = buildOracleTxLink(1, '0xdeadbeef')
    expect(url).toBe('https://etherscan.io/tx/0xdeadbeef')
    expect(url).not.toContain('//tx')
  })

  it('exposes well-known chain explorers', () => {
    expect(EXPLORER_BY_CHAIN[1]).toBe('https://etherscan.io')
    expect(EXPLORER_BY_CHAIN[42220]).toBe('https://celoscan.io')
    expect(EXPLORER_BY_CHAIN[DEVNET_CHAIN_ID]).toBe(DEVNET_EXPLORER_URL)
  })
})
