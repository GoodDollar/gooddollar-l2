/**
 * Unit tests for scripts/check-middleware-absent.mjs
 *
 * The script is a regression guard: it must fail (exit 1) if any of
 * `src/middleware.ts`, `src/middleware.js`, `src/middleware.tsx`,
 * `src/middleware.jsx`, `middleware.ts`, or `middleware.js` exists
 * under the frontend root, because Next.js 14.2.35 + Node 22 crashes
 * every request through Edge Runtime middleware with:
 *
 *   EvalError: Code generation from strings disallowed for this context
 *
 * Tracking:
 *   .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0023-iter11-followup-middleware-reintroduced-fails-perf-gate.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { checkMiddlewareAbsent } from '../check-middleware-absent.mjs'

let tmp
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'check-middleware-absent-'))
})
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('check-middleware-absent', () => {
  it('returns OK (exit 0) when no middleware files exist', () => {
    // Empty tmpdir → nothing forbidden.
    mkdirSync(join(tmp, 'src'), { recursive: true })

    const result = checkMiddlewareAbsent({ root: tmp })

    expect(result.exitCode).toBe(0)
    expect(result.found).toEqual([])
    expect(result.message).toMatch(/OK/)
    expect(result.message).toMatch(/no middleware\.ts present/)
  })

  it('returns FAIL (exit 1) when src/middleware.ts exists', () => {
    mkdirSync(join(tmp, 'src'), { recursive: true })
    writeFileSync(join(tmp, 'src', 'middleware.ts'), 'export const middleware = () => {}\n')

    const result = checkMiddlewareAbsent({ root: tmp })

    expect(result.exitCode).toBe(1)
    expect(result.found).toContain('src/middleware.ts')
    expect(result.message).toMatch(/FAIL/)
    expect(result.message).toMatch(/src\/middleware\.ts/)
    // Remediation must reference the canonical replacement.
    expect(result.message).toMatch(/withApiRateLimit/)
    expect(result.message).toMatch(/runtime = 'nodejs'/)
  })

  it.each([
    'src/middleware.js',
    'src/middleware.tsx',
    'src/middleware.jsx',
    'middleware.ts',
    'middleware.js',
  ])('returns FAIL (exit 1) when %s exists', (candidate) => {
    const parent = candidate.includes('/') ? join(tmp, 'src') : tmp
    mkdirSync(parent, { recursive: true })
    writeFileSync(join(tmp, candidate), '// forbidden middleware variant\n')

    const result = checkMiddlewareAbsent({ root: tmp })

    expect(result.exitCode).toBe(1)
    expect(result.found).toContain(candidate)
    expect(result.message).toMatch(/FAIL/)
    expect(result.message).toMatch(new RegExp(candidate.replace(/\./g, '\\.')))
  })

  it('reports ALL forbidden files when more than one exists', () => {
    mkdirSync(join(tmp, 'src'), { recursive: true })
    writeFileSync(join(tmp, 'src', 'middleware.ts'), '')
    writeFileSync(join(tmp, 'src', 'middleware.js'), '')
    writeFileSync(join(tmp, 'middleware.ts'), '')

    const result = checkMiddlewareAbsent({ root: tmp })

    expect(result.exitCode).toBe(1)
    expect(result.found).toEqual(
      expect.arrayContaining(['src/middleware.ts', 'src/middleware.js', 'middleware.ts']),
    )
    // Message should bullet each one.
    expect(result.message).toMatch(/- src\/middleware\.ts/)
    expect(result.message).toMatch(/- src\/middleware\.js/)
    expect(result.message).toMatch(/- middleware\.ts/)
  })

  it('cites both tracking tasks in the remediation', () => {
    mkdirSync(join(tmp, 'src'), { recursive: true })
    writeFileSync(join(tmp, 'src', 'middleware.ts'), '')

    const result = checkMiddlewareAbsent({ root: tmp })

    expect(result.message).toMatch(/0021-fix-middleware-evalerror-crashes-next-start/)
    expect(result.message).toMatch(/0023-iter11-followup-middleware-reintroduced-fails-perf-gate/)
  })

  it('honours injected existsImpl override (no real fs access required)', () => {
    const seen = []
    const fakeExists = (path) => {
      seen.push(path)
      // Pretend only middleware.tsx exists under some abstract root.
      return path.endsWith('middleware.tsx')
    }

    const result = checkMiddlewareAbsent({
      root: '/virtual/root',
      existsImpl: fakeExists,
    })

    expect(result.exitCode).toBe(1)
    expect(result.found).toEqual(['src/middleware.tsx'])
    expect(seen.length).toBeGreaterThanOrEqual(6) // all candidates probed
  })

  it('honours injected candidates override', () => {
    mkdirSync(join(tmp, 'src'), { recursive: true })
    writeFileSync(join(tmp, 'src', 'middleware.ts'), '')

    // If we override candidates to only look for something else, the
    // real middleware.ts should be invisible to the gate.
    const result = checkMiddlewareAbsent({
      root: tmp,
      candidates: ['src/something-else.ts'],
    })

    expect(result.exitCode).toBe(0)
    expect(result.found).toEqual([])
  })
})
