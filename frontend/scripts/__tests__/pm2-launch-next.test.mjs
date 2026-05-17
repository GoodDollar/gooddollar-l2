/**
 * Unit tests for scripts/pm2-launch-next.mjs
 *
 * `pm2-launch-next.mjs` is the PM2 entrypoint that wraps `next start`. It
 * structurally prevents the iter18 outage by validating the `.next/` build
 * artifacts BEFORE handing control to `next start`. If any of the following
 * are missing or corrupt, the launcher exits non-zero so PM2 marks the
 * process `errored` instead of silently serving 500s on every hashed chunk:
 *
 *   - `.next/`                                  (directory)
 *   - `.next/BUILD_ID`                          (non-empty)
 *   - `.next/build-manifest.json`               (parseable JSON)
 *   - 5 sample JS chunks referenced by the manifest, each present on disk
 *
 * Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *   0018-iter18-blocker-frontend-build-regression-fence.md
 *
 * Test style mirrors `atomic-build.test.mjs` — dependency injection only,
 * no `vi.mock`. Each test asserts both the boolean result AND, on failure,
 * the precise `reason` string so we can wire alerting/runbooks against it.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { join } from 'node:path'

import { validateNextBuild, resolvePort, shouldRunMain } from '../pm2-launch-next.mjs'

// --- in-memory test doubles -------------------------------------------------

function makeFakeFs(initial = {}) {
  // Path → { size: number, contents?: string }. Absent key = file/dir missing.
  const files = new Map()
  for (const [p, v] of Object.entries(initial)) {
    if (typeof v === 'object' && v !== null) files.set(p, v)
    else files.set(p, { size: v, contents: null })
  }

  return {
    files,
    existsSyncImpl: (p) => files.has(p),
    statSizeImpl: (p) => (files.has(p) ? files.get(p).size : 0),
    readFileSyncImpl: (p) => {
      if (!files.has(p)) {
        const err = new Error(`ENOENT: ${p}`)
        err.code = 'ENOENT'
        throw err
      }
      const entry = files.get(p)
      if (entry.contents == null) {
        throw new Error(`fake fs has no contents for ${p}`)
      }
      return entry.contents
    },
  }
}

function withManifest(pagesMap) {
  return { size: 256, contents: JSON.stringify({ pages: pagesMap }) }
}

// --- fixtures ---------------------------------------------------------------

let cwd
let nextDir
let buildIdPath
let manifestPath

beforeEach(() => {
  cwd = '/fake/frontend'
  nextDir = join(cwd, '.next')
  buildIdPath = join(nextDir, 'BUILD_ID')
  manifestPath = join(nextDir, 'build-manifest.json')
})

// --- tests ------------------------------------------------------------------

describe('validateNextBuild (Phase B fence for iter18)', () => {
  it('happy path: BUILD_ID + manifest + 5 sample chunks all present → ok:true', () => {
    const chunks = [
      'static/chunks/main-app-bc3987fcbb342bca.js',
      'static/chunks/webpack-abcdef1234567890.js',
      'static/chunks/framework-1234567890abcdef.js',
      'static/chunks/pages/_app-fedcba0987654321.js',
      'static/chunks/pages/index-aaaaaaaaaaaaaaaa.js',
    ]
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [manifestPath]: withManifest({
        '/_app': [chunks[0], chunks[1], chunks[2], chunks[3]],
        '/': [chunks[4]],
      }),
      ...Object.fromEntries(chunks.map((c) => [join(nextDir, c), 4096])),
    })

    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })

    expect(result.ok).toBe(true)
  })

  it('no .next/ directory → ok:false, reason:no-next-dir', () => {
    const fs = makeFakeFs({}) // empty
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('no-next-dir')
  })

  it('BUILD_ID missing → ok:false, reason:no-build-id', () => {
    const fs = makeFakeFs({ [nextDir]: 0 })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('no-build-id')
  })

  it('BUILD_ID is empty file → ok:false, reason:empty-build-id', () => {
    const fs = makeFakeFs({ [nextDir]: 0, [buildIdPath]: 0 })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('empty-build-id')
  })

  it('build-manifest.json missing → ok:false, reason:no-manifest', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
    })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('no-manifest')
  })

  it('build-manifest.json malformed JSON → ok:false, reason:bad-manifest', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [manifestPath]: { size: 10, contents: '{not json' },
    })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('bad-manifest')
  })

  it('manifest has no JS chunks at all → ok:false, reason:no-chunks', () => {
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [manifestPath]: withManifest({ '/': [] }),
    })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('no-chunks')
  })

  it('iter18 mode: manifest references chunks that are NOT on disk → ok:false, reason:missing-chunks', () => {
    // Exactly the iter18 production state: manifest is fine but the
    // hashed JS files it points to never made it onto disk, so every
    // `<script src="/_next/static/chunks/...js">` returns 500.
    const referencedChunks = [
      'static/chunks/main-app-bc3987fcbb342bca.js',
      'static/chunks/webpack-abcdef1234567890.js',
      'static/chunks/framework-1234567890abcdef.js',
      'static/chunks/pages/_app-fedcba0987654321.js',
      'static/chunks/pages/index-aaaaaaaaaaaaaaaa.js',
    ]
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [manifestPath]: withManifest({
        '/_app': referencedChunks.slice(0, 4),
        '/': [referencedChunks[4]],
      }),
      // …but NO chunk files on disk.
    })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('missing-chunks')
    expect(Array.isArray(result.missing)).toBe(true)
    expect(result.missing.length).toBeGreaterThan(0)
  })

  it('partial corruption: 1 out of 5 sample chunks missing → ok:false, reason:missing-chunks', () => {
    const chunks = [
      'static/chunks/main-app.js',
      'static/chunks/webpack.js',
      'static/chunks/framework.js',
      'static/chunks/pages/_app.js',
      'static/chunks/pages/index.js',
    ]
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [manifestPath]: withManifest({ '/_app': chunks }),
      // Drop chunks[2] (framework.js) — single corruption shouldn't be tolerated.
      ...Object.fromEntries(
        chunks.filter((_, i) => i !== 2).map((c) => [join(nextDir, c), 4096]),
      ),
    })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('missing-chunks')
    expect(result.missing).toContain('static/chunks/framework.js')
  })

  it('manifest with fewer than 5 chunks total: all present → ok:true (sample size adapts)', () => {
    // A minimal Next.js project may only have 2-3 chunks across all pages.
    // The launcher must not require artificially 5 — it must verify EVERY
    // chunk it samples (which may be fewer than 5).
    const chunks = ['static/chunks/main.js', 'static/chunks/webpack.js']
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [manifestPath]: withManifest({ '/_app': chunks }),
      ...Object.fromEntries(chunks.map((c) => [join(nextDir, c), 4096])),
    })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(true)
  })

  it('non-JS entries in manifest are skipped during chunk sampling', () => {
    // Some Next.js manifests reference .css and other non-JS assets too.
    // The launcher specifically samples JS chunks because those are what
    // produced the iter18 500s. CSS missing is a different failure mode.
    const jsChunks = [
      'static/chunks/main-app.js',
      'static/chunks/webpack.js',
      'static/chunks/framework.js',
      'static/chunks/pages/_app.js',
      'static/chunks/pages/index.js',
    ]
    const fs = makeFakeFs({
      [nextDir]: 0,
      [buildIdPath]: 21,
      [manifestPath]: withManifest({
        '/_app': ['static/css/some.css', ...jsChunks],
      }),
      ...Object.fromEntries(jsChunks.map((c) => [join(nextDir, c), 4096])),
      // CSS is intentionally missing — should not cause failure.
    })
    const result = validateNextBuild({
      cwd,
      existsSyncImpl: fs.existsSyncImpl,
      statSizeImpl: fs.statSizeImpl,
      readFileSyncImpl: fs.readFileSyncImpl,
      log: () => {},
      error: () => {},
    })
    expect(result.ok).toBe(true)
  })
})

describe('resolvePort', () => {
  it('returns "--port" argv value when present', () => {
    expect(resolvePort(['--port', '4000'], {})).toBe('4000')
  })

  it('argv takes precedence over PORT env', () => {
    expect(resolvePort(['--port', '4000'], { PORT: '5000' })).toBe('4000')
  })

  it('falls back to PORT env when --port absent', () => {
    expect(resolvePort([], { PORT: '5000' })).toBe('5000')
  })

  it('falls back to 3100 when nothing is provided', () => {
    expect(resolvePort([], {})).toBe('3100')
  })
})

describe('shouldRunMain', () => {
  // Why this exists:
  // PM2 in fork mode wraps the target script inside
  //   /usr/lib/node_modules/pm2/lib/ProcessContainerFork.js
  // so `process.argv[1]` is PM2's container, NOT this launcher's path.
  // A naive `argv[1] === fileURLToPath(import.meta.url)` check returns
  // false under PM2, so `main()` never runs — exactly the iter18 silent
  // failure we observed in /tmp/launcher-diag.log. shouldRunMain() must
  // return true when invoked directly OR when PM2 (or any other manager)
  // sets the well-known `pm_id` env var.
  const SELF = '/home/x/frontend/scripts/pm2-launch-next.mjs'
  const PM2_FORK = '/usr/lib/node_modules/pm2/lib/ProcessContainerFork.js'

  it('returns true when argv[1] equals the module path (direct node invocation)', () => {
    expect(shouldRunMain({ argv1: SELF, modulePath: SELF, env: {} })).toBe(true)
  })

  it('returns true when PM2 sets pm_id even if argv[1] is ProcessContainerFork', () => {
    expect(
      shouldRunMain({ argv1: PM2_FORK, modulePath: SELF, env: { pm_id: '12' } }),
    ).toBe(true)
  })

  it('returns true when PM2 sets PM2_HOME and a process name', () => {
    expect(
      shouldRunMain({
        argv1: PM2_FORK,
        modulePath: SELF,
        env: { PM2_HOME: '/home/u/.pm2', name: 'goodswap' },
      }),
    ).toBe(true)
  })

  it('returns false when imported by a test runner (argv[1] is vitest, no PM2 env)', () => {
    expect(
      shouldRunMain({
        argv1: '/home/x/node_modules/vitest/dist/cli.js',
        modulePath: SELF,
        env: {},
      }),
    ).toBe(false)
  })

  it('returns false when argv[1] is missing and no PM2 env', () => {
    expect(shouldRunMain({ argv1: undefined, modulePath: SELF, env: {} })).toBe(false)
  })
})
