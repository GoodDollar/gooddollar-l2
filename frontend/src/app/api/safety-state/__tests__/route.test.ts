import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const ORIGINAL_MODE = process.env.ETORO_MODE

describe('/api/safety-state', () => {
  beforeEach(() => {
    process.env.ETORO_MODE = 'sandbox'
  })
  afterEach(() => {
    process.env.ETORO_MODE = ORIGINAL_MODE
  })

  it('returns hardcoded realTradingEnabled=false and the configured etoroMode', async () => {
    const req = new NextRequest('http://localhost/api/safety-state')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.realTradingEnabled).toBe(false)
    expect(body.etoroMode).toBe('sandbox')
    expect(body.version).toBe(1)
  })

  it('passes through ETORO_MODE=real but never flips realTradingEnabled', async () => {
    process.env.ETORO_MODE = 'real'
    const req = new NextRequest('http://localhost/api/safety-state')
    const res = await GET(req)
    const body = await res.json()
    expect(body.realTradingEnabled).toBe(false)
    expect(body.etoroMode).toBe('real')
  })
})
