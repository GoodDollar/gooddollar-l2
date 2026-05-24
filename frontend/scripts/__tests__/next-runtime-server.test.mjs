import { describe, expect, it } from 'vitest'

import {
  HEDGE_PROOF_MALFORMED_URL_BODY,
  applyRuntimeDistDir,
  parseCliArgs,
  writeHedgeProofMalformedUrlResponse,
} from '../next-runtime-server.mjs'

function makeMockResponse() {
  let headWriteArgs = null
  let endArg = null
  return {
    writeHead(status, headers) {
      headWriteArgs = { status, headers }
    },
    end(body) {
      endArg = body
    },
    inspect() {
      return { headWriteArgs, endArg }
    },
  }
}

describe('next-runtime-server', () => {
  it('parses dev mode and explicit port', () => {
    const parsed = parseCliArgs(['--dev', '-p', '3214'])
    expect(parsed).toEqual({ dev: true, port: 3214 })
  })

  it('defaults to non-dev and env PORT fallback', () => {
    const priorPort = process.env.PORT
    process.env.PORT = '4555'
    const parsed = parseCliArgs([])
    expect(parsed).toEqual({ dev: false, port: 4555 })
    if (priorPort === undefined) delete process.env.PORT
    else process.env.PORT = priorPort
  })

  it('sets isolated NEXT_DIST_DIR in dev mode when unset', () => {
    const env = {}
    const distDir = applyRuntimeDistDir({ dev: true, env })
    expect(distDir).toBe('.next.dev')
    expect(env.NEXT_DIST_DIR).toBe('.next.dev')
  })

  it('preserves explicit NEXT_DIST_DIR override', () => {
    const env = { NEXT_DIST_DIR: '.next.custom' }
    const distDir = applyRuntimeDistDir({ dev: true, env })
    expect(distDir).toBe('.next.custom')
    expect(env.NEXT_DIST_DIR).toBe('.next.custom')
  })

  it('does not force dist dir in non-dev mode', () => {
    const env = {}
    const distDir = applyRuntimeDistDir({ dev: false, env })
    expect(distDir).toBeNull()
    expect(env.NEXT_DIST_DIR).toBeUndefined()
  })
})

describe('writeHedgeProofMalformedUrlResponse (#0074)', () => {
  it('writes HTTP 400 with application/json content-type and no-store cache', () => {
    const res = makeMockResponse()
    writeHedgeProofMalformedUrlResponse(res)
    const { headWriteArgs } = res.inspect()
    expect(headWriteArgs.status).toBe(400)
    expect(headWriteArgs.headers['Content-Type']).toMatch(/application\/json/)
    expect(headWriteArgs.headers['Cache-Control']).toBe('no-store')
  })

  it('writes the canonical invalid_id envelope body', () => {
    const res = makeMockResponse()
    writeHedgeProofMalformedUrlResponse(res)
    const { endArg } = res.inspect()
    const body = JSON.parse(endArg)
    expect(body.status).toBe('invalid_id')
    expect(body.reason).toMatch(/malformed.*url|url.*encoding/i)
  })

  it('exports the same JSON body constant used for the response', () => {
    const parsed = JSON.parse(HEDGE_PROOF_MALFORMED_URL_BODY)
    expect(parsed.status).toBe('invalid_id')
    expect(typeof parsed.reason).toBe('string')
  })
})
