import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { GET, PROOF_UNREADABLE_MESSAGE, RELATIVE_SOURCE_LOCATOR } from '../route'

const ABSOLUTE_PATH_PATTERNS = [/\/home\//, /\/Users\//, /\/var\//, /\/tmp\//]

const LEAKY_DEBUG_PATTERNS = [
  /JSON/,
  /parse/,
  /control character/,
  /EACCES/,
  /SyntaxError/,
  /stack/i,
]

function expectNoAbsolutePaths(serialised: string): void {
  for (const pattern of ABSOLUTE_PATH_PATTERNS) {
    expect(serialised).not.toMatch(pattern)
  }
}

function expectNoLeakyDebugStrings(serialised: string): void {
  for (const pattern of LEAKY_DEBUG_PATTERNS) {
    expect(serialised).not.toMatch(pattern)
  }
}

const ORIGINAL_DIR = process.env.HEDGE_PROOF_DIR

const SAMPLE_PROOF = {
  runId: 'unit-test-run',
  orderId: 'dry-run',
  symbol: 'AAPL',
  side: 'buy',
  notionalUsd: 0,
  timestamp: 1_700_000_000_000,
  beforeExposure: { netDelta: 0, absExposure: 0, blockNumber: 0 },
  afterExposure: { netDelta: 0, absExposure: 0, blockNumber: 0 },
  dryRun: true,
  etoroMode: 'sandbox',
  realTradingEnabled: false,
}

describe('/api/hedge-proof/latest', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hedge-proof-route-'))
    process.env.HEDGE_PROOF_DIR = tmpDir
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    if (ORIGINAL_DIR === undefined) delete process.env.HEDGE_PROOF_DIR
    else process.env.HEDGE_PROOF_DIR = ORIGINAL_DIR
  })

  it('returns 404 with a structured error and a relative source locator when no proof file exists', async () => {
    const req = new NextRequest('http://localhost/api/hedge-proof/latest')
    const res = await GET(req)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('no_proof')
    expect(body.source).toBe(RELATIVE_SOURCE_LOCATOR)
    expect(body.source).not.toMatch(/^\//)
    expectNoAbsolutePaths(JSON.stringify(body))
  })

  it('returns 200 and the parsed proof JSON when latest.json is present', async () => {
    fs.writeFileSync(path.join(tmpDir, 'latest.json'), JSON.stringify(SAMPLE_PROOF))
    const req = new NextRequest('http://localhost/api/hedge-proof/latest')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.proof).toEqual(SAMPLE_PROOF)
    expect(body.source).toBe(RELATIVE_SOURCE_LOCATOR)
    expect(body.source).not.toMatch(/^\//)
    expectNoAbsolutePaths(JSON.stringify(body))
  })

  it('returns a sanitised 500 body on corrupt JSON and logs the parser error server-side', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fs.writeFileSync(path.join(tmpDir, 'latest.json'), '{ broken')
    const req = new NextRequest('http://localhost/api/hedge-proof/latest')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({
      error: 'read_failed',
      code: 'PROOF_UNREADABLE',
      message: PROOF_UNREADABLE_MESSAGE,
    })
    const serialised = JSON.stringify(body)
    expectNoAbsolutePaths(serialised)
    expectNoLeakyDebugStrings(serialised)
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toBe('[hedge-proof] read failed')
  })

  it('returns the same sanitised 500 body when fs.readFile throws a non-ENOENT errno', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const eaccess = Object.assign(new Error('permission denied'), { code: 'EACCES' })
    vi.spyOn(fs.promises, 'readFile').mockRejectedValueOnce(eaccess)
    const req = new NextRequest('http://localhost/api/hedge-proof/latest')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({
      error: 'read_failed',
      code: 'PROOF_UNREADABLE',
      message: PROOF_UNREADABLE_MESSAGE,
    })
    const serialised = JSON.stringify(body)
    expectNoAbsolutePaths(serialised)
    expectNoLeakyDebugStrings(serialised)
  })
})
