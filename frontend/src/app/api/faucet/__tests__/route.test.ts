// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const VALID_PRIVKEY = '0x' + 'a'.repeat(64)

let tempDir: string
let claimsFile: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'faucet-route-test-'))
  claimsFile = join(tempDir, 'claims.json')
  process.env.FAUCET_CLAIMS_FILE = claimsFile
  // Default: configured. Individual tests override when they need a different state.
  process.env.FAUCET_PRIVATE_KEY = VALID_PRIVKEY
  vi.resetModules()
})

afterEach(() => {
  delete process.env.FAUCET_CLAIMS_FILE
  delete process.env.FAUCET_PRIVATE_KEY
  rmSync(tempDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

async function loadHandler() {
  const mod = await import('../route')
  return mod.POST
}

function makeRequest(body: BodyInit | null, contentType = 'application/json') {
  return new NextRequest('http://localhost/api/faucet', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  })
}

describe('POST /api/faucet — boundary errors', () => {
  it('returns 400 for missing body', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(null))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid json/i)
  })

  it('returns 400 for malformed JSON body', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest('not-json'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid json/i)
  })

  it('returns 400 for empty JSON object (no address)', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid address/i)
  })

  it('returns 400 for non-string address', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify({ address: 12345 })))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid address/i)
  })

  it('returns 400 for malformed address string', async () => {
    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify({ address: 'not-an-address' })))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid address/i)
  })
})

describe('POST /api/faucet — burn / unsupported address rejection', () => {
  // These tests pin the iteration #33 fix: addresses that pass the regex but
  // would burn tokens (zero, 0xdead..., 0xff...) must be rejected at 400 so
  // the faucet never wastes liquidity on unrecoverable destinations.
  const burnAddresses: ReadonlyArray<readonly [string, string]> = [
    ['zero address', '0x0000000000000000000000000000000000000000'],
    ['all-f address', '0xffffffffffffffffffffffffffffffffffffffff'],
    ['short dead address', '0x000000000000000000000000000000000000dead'],
    ['repeated dead address', '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead'],
    ['dead-beef address', '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'],
  ]

  for (const [label, addr] of burnAddresses) {
    it(`returns 400 for ${label}`, async () => {
      const POST = await loadHandler()
      const res = await POST(makeRequest(JSON.stringify({ address: addr })))
      expect(res.status, `${label} should be rejected`).toBe(400)
      const json = await res.json()
      expect(json.error).toMatch(/invalid or unsupported recipient/i)
    })
  }

  it('returns 400 for a known on-chain contract address', async () => {
    const { CONTRACTS } = await import('@/lib/devnet')
    const POST = await loadHandler()
    const res = await POST(
      makeRequest(JSON.stringify({ address: CONTRACTS.GoodDollarToken })),
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/invalid or unsupported recipient/i)
  })

  it('accepts a normal EOA-style address past the guard (continues to next stage)', async () => {
    // We can't run a real claim in unit tests, but we can prove that a
    // well-formed non-burn address gets PAST the burn guard and into the
    // configuration/rate-limit branch. We do this by removing the private
    // key so the next stage returns 503, not 400.
    delete process.env.FAUCET_PRIVATE_KEY
    vi.resetModules()
    const POST = await loadHandler()
    const validAddr = '0x' + 'a1b2c3d4'.repeat(5)
    const res = await POST(makeRequest(JSON.stringify({ address: validAddr })))
    expect(res.status).toBe(503)
  })
})

describe('POST /api/faucet — catch-all 500 sanitization (iter33 task 0046)', () => {
  // Pins the iter-33 task 0046 contract: the catch-all 500 branch must
  // never echo raw viem/internal error messages back to the client, and
  // each 500 must include an 8-hex `errorId` for log correlation.

  // A verbose viem-style error message — exactly the leaky shape we
  // observed on the live deployment before this fix.
  const RAW_VIEM_ERROR = [
    'HTTP request failed.',
    'Status: 500',
    'URL: https://devnet-rpc.example.com',
    'Request body: {"method":"eth_getBalance","params":["0xabcdef0123456789abcdef0123456789abcdef01"]}',
    'Details: revert',
    'Version: viem@2.21.0',
  ].join('\n')

  function withMockedViem() {
    vi.doMock('viem', async () => {
      const actual = await vi.importActual<typeof import('viem')>('viem')
      return {
        ...actual,
        createPublicClient: () => ({
          getBalance: vi.fn().mockRejectedValue(new Error(RAW_VIEM_ERROR)),
          readContract: vi.fn().mockRejectedValue(new Error(RAW_VIEM_ERROR)),
          waitForTransactionReceipt: vi
            .fn()
            .mockRejectedValue(new Error(RAW_VIEM_ERROR)),
        }),
        createWalletClient: () => ({
          sendTransaction: vi.fn().mockRejectedValue(new Error(RAW_VIEM_ERROR)),
          writeContract: vi.fn().mockRejectedValue(new Error(RAW_VIEM_ERROR)),
        }),
      }
    })
  }

  it('returns 500 with a fixed user-safe message — never the raw viem error', async () => {
    withMockedViem()
    vi.resetModules()

    const POST = await loadHandler()
    const validAddr = '0x' + 'a1b2c3d4'.repeat(5)
    const res = await POST(makeRequest(JSON.stringify({ address: validAddr })))

    expect(res.status).toBe(500)
    const json = await res.json()

    // Must contain the fixed user-safe message
    expect(json.error).toMatch(/please try again later/i)

    // Must NOT echo any of the viem-internal leaks
    expect(json.error).not.toMatch(/viem/i)
    expect(json.error).not.toMatch(/version/i)
    expect(json.error).not.toMatch(/0x[0-9a-fA-F]{40}/)
    expect(json.error).not.toMatch(/https?:\/\//)
    expect(JSON.stringify(json)).not.toMatch(/eth_getBalance/i)
  })

  it('includes an 8-hex errorId for log correlation', async () => {
    withMockedViem()
    vi.resetModules()

    const POST = await loadHandler()
    const validAddr = '0x' + 'a1b2c3d4'.repeat(5)
    const res = await POST(makeRequest(JSON.stringify({ address: validAddr })))

    const json = await res.json()
    expect(json.errorId).toMatch(/^[0-9a-f]{8}$/)
  })

  it('emits different errorIds across separate failures', async () => {
    withMockedViem()
    vi.resetModules()

    const POST = await loadHandler()
    const validAddr = '0x' + 'a1b2c3d4'.repeat(5)

    const res1 = await POST(makeRequest(JSON.stringify({ address: validAddr })))
    const res2 = await POST(makeRequest(JSON.stringify({ address: validAddr })))

    const j1 = await res1.json()
    const j2 = await res2.json()

    expect(j1.errorId).not.toBe(j2.errorId)
  })
})

describe('POST /api/faucet — configuration & rate limiting', () => {
  it('returns 503 when FAUCET_PRIVATE_KEY is missing', async () => {
    delete process.env.FAUCET_PRIVATE_KEY
    vi.resetModules()
    const POST = await loadHandler()
    const validAddr = '0x' + '1'.repeat(40)
    const res = await POST(makeRequest(JSON.stringify({ address: validAddr })))
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toMatch(/not configured/i)
  })

  it('returns 429 when address is within cooldown window', async () => {
    // Pre-seed a recent claim so the cooldown branch fires before any
    // chain call. The route normalizes the key to lowercase.
    const validAddr = '0x' + 'b'.repeat(40)
    const recent = Date.now() - 60_000 // 1 minute ago, well inside the 1-hour cooldown
    writeFileSync(claimsFile, JSON.stringify({ [validAddr.toLowerCase()]: recent }))

    const POST = await loadHandler()
    const res = await POST(makeRequest(JSON.stringify({ address: validAddr })))
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toMatch(/rate limited/i)
  })
})
