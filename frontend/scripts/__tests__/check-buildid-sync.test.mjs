/**
 * Unit tests for scripts/check-buildid-sync.mjs
 *
 * The script reads `.next/BUILD_ID` on disk and fetches the live PM2-managed
 * Next.js process at NEXT_LIVE_URL (default http://localhost:3100). It extracts
 * the live `buildId` from the `__NEXT_DATA__` blob in the HTML and compares it
 * against the on-disk value. A mismatch means a `next build` happened without
 * a `pm2 reload goodswap`, which breaks every CSS file site-wide with HTTP 400.
 *
 * Tracking: .autobuilder/initiatives/0002-security-hardening/tasks/
 *   0060-fix-frontend-deploy-stale-buildid-pm2-reload.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { checkBuildIdSync } from '../check-buildid-sync.mjs'

function makeFakeFetch(responses) {
  // responses: { [url]: { status: number, body: string } | Error }
  return async (url) => {
    const r = responses[url] ?? responses['*']
    if (!r) throw new Error(`unexpected fetch: ${url}`)
    if (r instanceof Error) throw r
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => r.body,
    }
  }
}

function htmlWithBuildId(id) {
  // Mimics the real Next.js HTML payload structure. The regex matches the
  // exact field shape Next emits: `"buildId":"<id>"`.
  return [
    '<!DOCTYPE html><html><head></head><body>',
    '<script id="__NEXT_DATA__" type="application/json">',
    JSON.stringify({ props: {}, page: '/', query: {}, buildId: id }),
    '</script></body></html>',
  ].join('')
}

function htmlWithAppRouterBuildId(id) {
  // Mimics the Next.js 13+ App Router HTML, which emits the buildId inside a
  // JSON-escaped React Server Component payload, e.g. `buildId\":\"<id>\"`.
  return [
    '<!DOCTYPE html><html><head></head><body>',
    '<script>self.__next_f.push([1,"some:rsc-payload {\\"',
    `buildId\\":\\"${id}\\"`,
    ',\\"other\\":1}"])</script></body></html>',
  ].join('')
}

let tmp
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'buildid-sync-test-'))
})
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('check-buildid-sync', () => {
  it('returns OK (exit 0) when disk BUILD_ID matches live __NEXT_DATA__.buildId', async () => {
    mkdirSync(join(tmp, '.next'), { recursive: true })
    writeFileSync(join(tmp, '.next', 'BUILD_ID'), 'abc123def456')

    const result = await checkBuildIdSync({
      cwd: tmp,
      liveUrl: 'http://localhost:3100/',
      fetchImpl: makeFakeFetch({
        'http://localhost:3100/': { status: 200, body: htmlWithBuildId('abc123def456') },
      }),
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/OK/)
    expect(result.message).toMatch(/abc123def456/)
  })

  it('returns FAIL (exit 1) with remediation pointing at pm2 reload when buildIds mismatch', async () => {
    mkdirSync(join(tmp, '.next'), { recursive: true })
    writeFileSync(join(tmp, '.next', 'BUILD_ID'), 'NEW_BUILD_ID_xyz')

    const result = await checkBuildIdSync({
      cwd: tmp,
      liveUrl: 'http://localhost:3100/',
      fetchImpl: makeFakeFetch({
        'http://localhost:3100/': { status: 200, body: htmlWithBuildId('OLD_BUILD_ID_abc') },
      }),
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    expect(result.message).toMatch(/NEW_BUILD_ID_xyz/)
    expect(result.message).toMatch(/OLD_BUILD_ID_abc/)
    // Remediation MUST tell the operator exactly how to fix it.
    expect(result.message).toMatch(/pm2 reload goodswap/)
  })

  it('returns FAIL (exit 1) when .next/BUILD_ID is missing on disk', async () => {
    // No .next dir at all.
    const result = await checkBuildIdSync({
      cwd: tmp,
      liveUrl: 'http://localhost:3100/',
      fetchImpl: makeFakeFetch({ '*': { status: 200, body: htmlWithBuildId('whatever') } }),
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    // Hint must point at next build.
    expect(result.message).toMatch(/next build|npm run build/)
  })

  it('returns FAIL (exit 1) with reachability hint when live process is unreachable in strict mode', async () => {
    mkdirSync(join(tmp, '.next'), { recursive: true })
    writeFileSync(join(tmp, '.next', 'BUILD_ID'), 'on-disk-id')

    const result = await checkBuildIdSync({
      cwd: tmp,
      liveUrl: 'http://localhost:3100/',
      strict: true,
      fetchImpl: makeFakeFetch({
        'http://localhost:3100/': new Error('ECONNREFUSED'),
      }),
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    expect(result.message).toMatch(/unreachable|ECONNREFUSED|not running/i)
    expect(result.message).toMatch(/pm2 (reload|start) goodswap/)
  })

  it('returns SKIP (exit 0) when live process is unreachable in non-strict mode (CI build phase)', async () => {
    mkdirSync(join(tmp, '.next'), { recursive: true })
    writeFileSync(join(tmp, '.next', 'BUILD_ID'), 'on-disk-id')

    const result = await checkBuildIdSync({
      cwd: tmp,
      liveUrl: 'http://localhost:3100/',
      strict: false,
      fetchImpl: makeFakeFetch({
        'http://localhost:3100/': new Error('ECONNREFUSED'),
      }),
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/SKIP|skip|skipped/i)
  })

  it('returns OK (exit 0) when live HTML uses App Router escaped buildId format', async () => {
    mkdirSync(join(tmp, '.next'), { recursive: true })
    writeFileSync(join(tmp, '.next', 'BUILD_ID'), 'appRouter_ID_123')

    const result = await checkBuildIdSync({
      cwd: tmp,
      liveUrl: 'http://localhost:3100/',
      fetchImpl: makeFakeFetch({
        'http://localhost:3100/': {
          status: 200,
          body: htmlWithAppRouterBuildId('appRouter_ID_123'),
        },
      }),
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/OK/)
    expect(result.message).toMatch(/appRouter_ID_123/)
  })

  it('returns FAIL (exit 1) when live HTML has no buildId in either format', async () => {
    mkdirSync(join(tmp, '.next'), { recursive: true })
    writeFileSync(join(tmp, '.next', 'BUILD_ID'), 'on-disk-id')

    const result = await checkBuildIdSync({
      cwd: tmp,
      liveUrl: 'http://localhost:3100/',
      fetchImpl: makeFakeFetch({
        'http://localhost:3100/': {
          status: 200,
          body: '<html><body>not a next.js page</body></html>',
        },
      }),
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    expect(result.message).toMatch(/buildId|__NEXT_DATA__/)
  })
})
