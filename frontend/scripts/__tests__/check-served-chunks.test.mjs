/**
 * Unit tests for scripts/check-served-chunks.mjs
 *
 * The script is the runtime counterpart to scripts/pm2-launch-next.mjs:
 *
 *   - pm2-launch-next.mjs checks BEFORE start that every JS chunk the
 *     on-disk manifest references actually exists on disk. That fences
 *     out the "PM2 starts a corrupt build" failure mode (iter18).
 *
 *   - check-served-chunks.mjs checks AFTER start that the JS chunks the
 *     LIVE process is REFERENCING IN ITS HTML actually return 200 from
 *     the live process. That fences out the "PM2 has a stale in-memory
 *     manifest after .next/ was rewritten" failure mode (iter11 — the
 *     condition that motivated this task), where the launcher fence
 *     was satisfied at boot but the on-disk tree has since been
 *     overwritten by `next build` or `next dev`.
 *
 *   Symptom this script catches: blank page / "Loading…" forever while
 *   the network panel shows e.g. /_next/static/chunks/app/predict/page-DEADBEEF.js
 *   returning 404. From an operator's perspective the site is up
 *   (`/api/status` is green, HTML is 200), but every page is broken.
 *
 * Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *   0022-iter11-blocker-pm2-stale-bundle-after-dev-clobber.md
 *
 * Tests use dependency injection (no vi.mock) — mirrors the convention
 * established by check-buildid-sync.test.mjs and postbuild-reload-pm2.test.mjs.
 */

import { describe, it, expect } from 'vitest'

import { checkServedChunks } from '../check-served-chunks.mjs'

// --- helpers -----------------------------------------------------------------

/**
 * Build a minimal HTML payload that resembles what a Next.js App Router
 * page emits. We only need the script/link references the script extracts —
 * everything else is window dressing. The chunk paths must be RELATIVE
 * (start with `/_next/`) because that is what Next emits in real HTML.
 */
function htmlReferencingChunks(chunkPaths) {
  const tags = chunkPaths
    .map((p) => {
      if (p.endsWith('.css')) return `<link rel="stylesheet" href="${p}"/>`
      return `<script src="${p}" async></script>`
    })
    .join('\n')
  return [
    '<!DOCTYPE html><html><head>',
    tags,
    '</head><body><div id="__next"></div></body></html>',
  ].join('')
}

/**
 * Build a fetch mock that:
 *   - returns the given HTML for the page URL (or `*` fallback);
 *   - returns the per-chunk status from `chunkStatuses` (default 200).
 *
 * The chunk request URL has the scheme+host stripped before lookup so the
 * fixture only deals with absolute paths like `/_next/static/chunks/foo.js`.
 */
function makeFetch({ pageHtml, pageStatus = 200, chunkStatuses = {} } = {}) {
  return async (url) => {
    const u = new URL(url, 'http://localhost:3100/')
    const path = u.pathname + u.search
    if (path === '/' || path === '') {
      return {
        ok: pageStatus >= 200 && pageStatus < 300,
        status: pageStatus,
        text: async () => pageHtml,
      }
    }
    const status = chunkStatuses[path] ?? 200
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => '',
    }
  }
}

// --- tests -------------------------------------------------------------------

describe('check-served-chunks', () => {
  it('returns OK (exit 0) when every chunk referenced by the live HTML responds 200', async () => {
    const chunks = [
      '/_next/static/chunks/webpack-abc.js',
      '/_next/static/chunks/main-app-def.js',
      '/_next/static/chunks/app/page-xyz.js',
      '/_next/static/css/app/layout-111.css',
    ]
    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/'],
      fetchImpl: makeFetch({ pageHtml: htmlReferencingChunks(chunks) }),
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/OK/)
    expect(result.sampledCount).toBe(chunks.length)
    expect(result.missing).toEqual([])
  })

  it('returns FAIL (exit 1) when one or more referenced chunks return 404 (stale PM2 in-memory manifest)', async () => {
    // This is the precise iter11 mode: HTML is served, but the chunks the
    // HTML references are no longer on disk because `next build` (or a stray
    // `next dev`) rotated them since PM2 started.
    const chunks = [
      '/_next/static/chunks/webpack-aaa.js',          // OK
      '/_next/static/chunks/main-app-bbb.js',         // OK
      '/_next/static/chunks/app/predict/page-OLD.js', // gone — stale
    ]
    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/'],
      fetchImpl: makeFetch({
        pageHtml: htmlReferencingChunks(chunks),
        chunkStatuses: { '/_next/static/chunks/app/predict/page-OLD.js': 404 },
      }),
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    expect(result.missing).toEqual(['/_next/static/chunks/app/predict/page-OLD.js'])
    // The error MUST tell the operator exactly how to recover.
    expect(result.message).toMatch(/pm2 reload goodswap/)
    // The error MUST tell the operator WHY this happened (stale manifest).
    expect(result.message).toMatch(/stale|in-memory|rewritten|clobbered/i)
  })

  it('returns FAIL (exit 1) when a referenced chunk returns 400 (Next static handler stale-hash response)', async () => {
    // Real-world variant: Next's static handler returns 400 (not 404) when
    // it sees a hashed path with a different BUILD_ID. The probe must
    // treat anything non-2xx as a failure, not just 404.
    const chunks = ['/_next/static/css/app/layout-STALE.css']
    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/'],
      fetchImpl: makeFetch({
        pageHtml: htmlReferencingChunks(chunks),
        chunkStatuses: { '/_next/static/css/app/layout-STALE.css': 400 },
      }),
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    expect(result.missing).toEqual(['/_next/static/css/app/layout-STALE.css'])
  })

  it('probes multiple paths and surfaces missing chunks from ANY of them', async () => {
    // App Router projects emit different chunks per route — `/` and
    // `/predict` reference different `app/<route>/page-*.js` bundles.
    // The probe must visit each path and aggregate.
    const homeHtml = htmlReferencingChunks([
      '/_next/static/chunks/webpack-x.js',          // shared, OK
      '/_next/static/chunks/app/page-HOME.js',      // home, OK
    ])
    const predictHtml = htmlReferencingChunks([
      '/_next/static/chunks/webpack-x.js',          // shared, OK
      '/_next/static/chunks/app/predict/page-MISSING.js', // BROKEN
    ])
    const fetchImpl = async (url) => {
      const u = new URL(url, 'http://localhost:3100/')
      const path = u.pathname
      if (path === '/') {
        return { ok: true, status: 200, text: async () => homeHtml }
      }
      if (path === '/predict') {
        return { ok: true, status: 200, text: async () => predictHtml }
      }
      const status = path.includes('predict/page-MISSING.js') ? 404 : 200
      return { ok: status === 200, status, text: async () => '' }
    }

    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/', '/predict'],
      fetchImpl,
    })

    expect(result.exitCode).toBe(1)
    expect(result.missing).toEqual(['/_next/static/chunks/app/predict/page-MISSING.js'])
    // The error message MUST identify WHICH probed page exposed the failure
    // so the operator can reproduce in a browser.
    expect(result.message).toMatch(/\/predict/)
  })

  it('returns SKIP (exit 0) when the live process is unreachable in non-strict mode', async () => {
    // Mirrors check-buildid-sync.mjs convention: CI build phase has no PM2
    // bound to :3100, so the script must SKIP rather than break the build.
    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/'],
      strict: false,
      fetchImpl: async () => {
        throw new Error('ECONNREFUSED')
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.message).toMatch(/SKIP/i)
  })

  it('returns FAIL (exit 1) when the live process is unreachable in strict mode', async () => {
    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/'],
      strict: true,
      fetchImpl: async () => {
        throw new Error('ECONNREFUSED')
      },
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    expect(result.message).toMatch(/unreachable|ECONNREFUSED/i)
    expect(result.message).toMatch(/pm2/i)
  })

  it('returns FAIL (exit 1) when the page itself responds non-2xx', async () => {
    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/'],
      fetchImpl: makeFetch({ pageHtml: 'Internal Server Error', pageStatus: 500 }),
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    expect(result.message).toMatch(/500/)
  })

  it('returns FAIL (exit 1) when the page HTML contains no _next chunk references at all', async () => {
    // Defensive: if the live process returned an HTML body without any
    // /_next/* references, something is wrong (Caddy serving a placeholder,
    // wrong port, etc.). Refuse to silently pass on that.
    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/'],
      fetchImpl: makeFetch({ pageHtml: '<html><body>Maintenance</body></html>' }),
    })

    expect(result.exitCode).toBe(1)
    expect(result.message).toMatch(/FAIL/)
    expect(result.message).toMatch(/no.*_next|no chunks/i)
  })

  it('extracts route-group chunk paths that contain literal parens (App Router (group) segments)', async () => {
    // Iter11 production caught a false positive: my first regex stopped at
    // `)`, so a real Next.js App Router chunk path like
    //   /_next/static/chunks/app/(app)/predict/page-ffb411a0675d481b.js
    // was truncated to `/_next/static/chunks/app/(app` and probed as 404,
    // failing the postbuild gate against a green build. Route groups are
    // a first-class Next feature — `(app)` does not appear in the URL but
    // DOES appear in the chunk path on disk and in the HTML.
    //
    // The probe must treat `(` and `)` as legal URL path characters.
    const routeGroupChunk =
      '/_next/static/chunks/app/(app)/predict/page-ffb411a0675d481b.js'
    const chunks = ['/_next/static/chunks/webpack-x.js', routeGroupChunk]
    let probedRouteGroup = false
    let probedTruncated = false
    const fetchImpl = async (url) => {
      const u = new URL(url, 'http://localhost:3100/')
      if (u.pathname === '/predict') {
        return { ok: true, status: 200, text: async () => htmlReferencingChunks(chunks) }
      }
      // The "wrong" truncated path that the buggy regex would emit.
      if (u.pathname === '/_next/static/chunks/app/(app') {
        probedTruncated = true
        return { ok: false, status: 404, text: async () => '' }
      }
      if (u.pathname === routeGroupChunk) {
        probedRouteGroup = true
        return { ok: true, status: 200, text: async () => '' }
      }
      return { ok: true, status: 200, text: async () => '' }
    }

    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/predict'],
      fetchImpl,
    })

    expect(probedRouteGroup, 'must probe the full route-group chunk path').toBe(true)
    expect(probedTruncated, 'must NOT probe a path truncated at `(`').toBe(false)
    expect(result.exitCode).toBe(0)
    expect(result.missing).toEqual([])
  })

  it('ignores duplicate chunk references (each chunk is probed at most once)', async () => {
    // Real HTML repeats some chunks (e.g. webpack.js appears in both
    // preload <link rel="preload"> and <script src>). Counting them twice
    // would inflate the "sampled" count and make logs misleading.
    const dup = '/_next/static/chunks/webpack-dedupe.js'
    const chunks = [dup, dup, dup, '/_next/static/chunks/main-app-y.js']
    let probedDup = 0
    const fetchImpl = async (url) => {
      const u = new URL(url, 'http://localhost:3100/')
      if (u.pathname === '/') {
        return { ok: true, status: 200, text: async () => htmlReferencingChunks(chunks) }
      }
      if (u.pathname === dup) probedDup++
      return { ok: true, status: 200, text: async () => '' }
    }
    const result = await checkServedChunks({
      liveUrl: 'http://localhost:3100/',
      probePaths: ['/'],
      fetchImpl,
    })
    expect(result.exitCode).toBe(0)
    expect(probedDup).toBe(1)
    expect(result.sampledCount).toBe(2)
  })
})
