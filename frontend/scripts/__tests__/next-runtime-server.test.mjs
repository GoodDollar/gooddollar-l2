import { describe, expect, it } from 'vitest'

import { applyRuntimeDistDir, parseCliArgs } from '../next-runtime-server.mjs'

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
