import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { GET } from '../route'

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

  it('returns 404 with a structured error when no proof file exists', async () => {
    const req = new NextRequest('http://localhost/api/hedge-proof/latest')
    const res = await GET(req)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('no_proof')
    expect(typeof body.source).toBe('string')
  })

  it('returns 200 and the parsed proof JSON when latest.json is present', async () => {
    fs.writeFileSync(path.join(tmpDir, 'latest.json'), JSON.stringify(SAMPLE_PROOF))
    const req = new NextRequest('http://localhost/api/hedge-proof/latest')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.proof).toEqual(SAMPLE_PROOF)
    expect(body.source).toContain('latest.json')
  })
})
