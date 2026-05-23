import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useOracleProvenance, __resetOracleProvenanceForTests } from '../useOracleProvenance'

const provenancePayload = {
  chain: {
    chainId: 42069,
    signerAddress: '0xSigner',
    oracleAddresses: { stocks: '0xStocks', crypto: '0xCrypto' },
  },
  upstreams: {
    priceService: { status: 'ok', label: 'eToro demo' },
    oracleSigner: { status: 'ok' },
  },
  proof: {
    stocks: [{
      rail: 'stocks',
      txHash: '0xstockstx',
      blockNumber: 12345,
      symbols: ['AAPL'],
      submittedAtMs: 1700000000000,
    }],
    crypto: [{
      rail: 'crypto',
      txHash: '0xcryptotx',
      blockNumber: 12346,
      symbols: ['BTC'],
      submittedAtMs: 1700000001000,
    }],
  },
}

beforeEach(() => {
  vi.restoreAllMocks()
  __resetOracleProvenanceForTests()
})

afterEach(() => {
  __resetOracleProvenanceForTests()
})

describe('useOracleProvenance', () => {
  it('returns empty provenance before the first fetch resolves', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}) as unknown as Promise<Response>)
    const { result } = renderHook(() => useOracleProvenance())
    expect(result.current.chainId).toBeNull()
    expect(result.current.loaded).toBe(false)
    expect(result.current.proof.stocks).toBeNull()
  })

  it('exposes chainId, upstream label, and per-rail proof when the fetch succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(provenancePayload), { status: 200 }),
    )
    const { result } = renderHook(() => useOracleProvenance())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.chainId).toBe(42069)
    expect(result.current.signerAddress).toBe('0xSigner')
    expect(result.current.oracleAddresses).toEqual({ stocks: '0xStocks', crypto: '0xCrypto' })
    expect(result.current.upstreamLabel).toBe('eToro demo')
    expect(result.current.proof.stocks?.txHash).toBe('0xstockstx')
    expect(result.current.proof.crypto?.txHash).toBe('0xcryptotx')
    expect(result.current.proof.stocks?.blockNumber).toBe(12345)
  })

  it('returns empty provenance + loaded:true when the fetch rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useOracleProvenance())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.chainId).toBeNull()
    expect(result.current.upstreamLabel).toBeNull()
    expect(result.current.proof.stocks).toBeNull()
  })

  it('tolerates a 503 body with the documented degraded shape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ...provenancePayload, healthy: false, degraded: true }), { status: 503 }),
    )
    const { result } = renderHook(() => useOracleProvenance())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.chainId).toBe(42069)
    expect(result.current.proof.stocks?.blockNumber).toBe(12345)
  })

  it('drops malformed proof tails instead of fabricating them', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        ...provenancePayload,
        proof: {
          stocks: [{ rail: 'stocks', txHash: 'no-0x-prefix', blockNumber: 1, symbols: [], submittedAtMs: 0 }],
          crypto: [],
        },
      }), { status: 200 }),
    )
    const { result } = renderHook(() => useOracleProvenance())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.proof.stocks).toBeNull()
    expect(result.current.proof.crypto).toBeNull()
  })
})
